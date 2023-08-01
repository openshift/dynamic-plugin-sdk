import type { AnyObject } from '@monorepo/common';
import { ErrorWithCause, visitDeep } from '@monorepo/common';
import { cloneDeep, has, identity, isEqual, isPlainObject } from 'lodash';
import type {
  EncodedCodeRef,
  CodeRef,
  Extension,
  LoadedExtension,
  ResolvedExtension,
} from '../types/extension';
import type { PluginEntryModule } from '../types/runtime';

/**
 * Indicates that the given function is a {@link CodeRef} function.
 */
const codeRefSymbol = Symbol('CodeRef');

const isEncodedCodeRef = (obj: unknown): obj is EncodedCodeRef =>
  isPlainObject(obj) &&
  isEqual(Object.getOwnPropertyNames(obj), ['$codeRef']) &&
  typeof (obj as EncodedCodeRef).$codeRef === 'string';

const isCodeRef = (obj: unknown): obj is CodeRef =>
  typeof obj === 'function' &&
  isEqual(Object.getOwnPropertySymbols(obj), [codeRefSymbol]) &&
  (obj as unknown as Record<symbol, boolean>)[codeRefSymbol] === true;

/**
 * Parse data from the {@link EncodedCodeRef} object.
 *
 * Returns `undefined` if the `$codeRef` value is malformed.
 */
const parseEncodedCodeRef = (
  ref: EncodedCodeRef,
): [moduleName: string, exportName: string] | undefined => {
  const match = ref.$codeRef.match(/^([^.\s]+)(?:\.([^.\s]+))?$/);

  if (!match) {
    return undefined;
  }

  const moduleName = match[1];
  const exportName = match[2] || 'default';

  return [moduleName, exportName];
};

export const getPluginModule = async <TModule extends AnyObject>(
  moduleName: string,
  entryModule: PluginEntryModule,
  formatErrorMessage: (message: string) => string = identity,
) => {
  try {
    const moduleFactory = await entryModule.get(moduleName);
    return moduleFactory() as TModule;
  } catch (e) {
    throw new ErrorWithCause(formatErrorMessage(`Failed to load module '${moduleName}'`), e);
  }
};

/**
 * Create new {@link CodeRef} function from an {@link EncodedCodeRef} object.
 */
const createCodeRef =
  (
    encodedCodeRef: EncodedCodeRef,
    entryModule: PluginEntryModule,
    formatErrorMessage: (message: string) => string = identity,
  ): CodeRef =>
  async () => {
    const refData = parseEncodedCodeRef(encodedCodeRef);

    if (!refData) {
      throw new Error(formatErrorMessage(`Malformed code reference '${encodedCodeRef.$codeRef}'`));
    }

    const [moduleName, exportName] = refData;

    const referencedModule = await getPluginModule(moduleName, entryModule, formatErrorMessage);

    if (!has(referencedModule, exportName)) {
      throw new Error(formatErrorMessage(`Missing module export '${moduleName}.${exportName}'`));
    }

    return referencedModule[exportName];
  };

/**
 * In the extension's `properties` object, replace all {@link EncodedCodeRef} values
 * with {@link CodeRef} functions that can be used to load the referenced objects.
 *
 * Returns the extension that was passed in.
 */
export const decodeCodeRefs = (extension: LoadedExtension, entryModule: PluginEntryModule) => {
  visitDeep<EncodedCodeRef>(extension.properties, isEncodedCodeRef, (encodedCodeRef, key, obj) => {
    const codeRef = createCodeRef(
      encodedCodeRef,
      entryModule,
      (message) => `${message} in extension ${extension.uid}`,
    );

    // Use a sensible function name that reflects the current context
    Object.defineProperty(codeRef, 'name', {
      value: `$codeRef_${extension.pluginName}[${encodedCodeRef.$codeRef}]`,
      configurable: true,
    });

    // Mark the function with a non-configurable symbol property
    Object.defineProperty(codeRef, codeRefSymbol, { value: true });

    // eslint-disable-next-line no-param-reassign
    obj[key] = codeRef;
  });

  return extension;
};

/**
 * In the extension's `properties` object, replace all {@link CodeRef} functions with
 * the corresponding values by resolving the associated Promises.
 *
 * This is an asynchronous operation that completes when all of the associated Promises
 * are either resolved or rejected. Each code reference resolution error will cause the
 * associated value to be set to `undefined`.
 *
 * The resulting Promise resolves with the updated extension; its `properties` object
 * is cloned in order to preserve the original structure of decoded extensions.
 *
 * The resulting Promise never rejects. Use the `onResolutionErrors` callback to handle
 * code reference resolution errors.
 */
export const resolveCodeRefValues = async <TExtension extends Extension>(
  extension: LoadedExtension<TExtension>,
  onResolutionErrors: (errors: unknown[]) => void,
) => {
  const clonedProperties = cloneDeep(extension.properties);
  const resolutions: Promise<void>[] = [];
  const resolutionErrors: unknown[] = [];

  visitDeep<CodeRef>(clonedProperties, isCodeRef, (codeRef, key, obj) => {
    resolutions.push(
      codeRef()
        // eslint-disable-next-line promise/always-return -- resolutions element type is Promise<void>
        .then((resolvedValue) => {
          // eslint-disable-next-line no-param-reassign
          obj[key] = resolvedValue;
        })
        .catch((e) => {
          resolutionErrors.push(e);
          // eslint-disable-next-line no-param-reassign
          obj[key] = undefined;
        }),
    );
  });

  await Promise.allSettled(resolutions);

  if (resolutionErrors.length > 0) {
    onResolutionErrors(resolutionErrors);
  }

  return {
    ...extension,
    properties: clonedProperties,
  } as LoadedExtension<ResolvedExtension<TExtension>>;
};
