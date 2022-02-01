import type { AnyObject } from '@monorepo/common';
import { CustomError, visitDeep } from '@monorepo/common';
import * as _ from 'lodash-es';
import type {
  EncodedCodeRef,
  CodeRef,
  Extension,
  LoadedExtension,
  ResolvedExtension,
} from '../types/extension';
import type { PluginEntryModule } from '../types/runtime';

class CodeRefError extends CustomError {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
  }
}

/**
 * Indicates that the given function is a {@link CodeRef} function.
 */
const codeRefSymbol = Symbol('CodeRef');

const isEncodedCodeRef = (obj: unknown): obj is EncodedCodeRef =>
  _.isPlainObject(obj) &&
  _.isEqual(Object.getOwnPropertyNames(obj), ['$codeRef']) &&
  typeof (obj as EncodedCodeRef).$codeRef === 'string';

const isCodeRef = (obj: unknown): obj is CodeRef =>
  typeof obj === 'function' &&
  _.isEqual(Object.getOwnPropertySymbols(obj), [codeRefSymbol]) &&
  (obj as unknown as Record<symbol, unknown>)[codeRefSymbol] === true;

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

/**
 * Create new {@link CodeRef} function from an {@link EncodedCodeRef} object.
 */
const createCodeRef =
  (
    encodedCodeRef: EncodedCodeRef,
    entryModule: PluginEntryModule,
    formatErrorMessage: (message: string) => string = _.identity,
  ): CodeRef =>
  async () => {
    const refData = parseEncodedCodeRef(encodedCodeRef);

    if (!refData) {
      throw new CodeRefError(
        formatErrorMessage(`Malformed code reference '${encodedCodeRef.$codeRef}'`),
      );
    }

    const [moduleName, exportName] = refData;

    let referencedModule: AnyObject;

    try {
      const moduleFactory = await entryModule.get(moduleName);
      referencedModule = moduleFactory();
    } catch (e) {
      throw new CodeRefError(formatErrorMessage(`Failed to load module '${moduleName}'`), e);
    }

    if (!_.has(referencedModule, exportName)) {
      throw new CodeRefError(
        formatErrorMessage(`Missing module export '${moduleName}.${exportName}'`),
      );
    }

    return referencedModule[exportName];
  };

/**
 * In the extension's `properties` object, replace all {@link EncodedCodeRef} values
 * with {@link CodeRef} functions that can be used to load the referenced objects.
 *
 * Returns the updated extension instance.
 */
export const decodeCodeRefs = (
  extension: LoadedExtension,
  entryModule: PluginEntryModule,
  codeRefCache: Map<string, CodeRef>,
) => {
  visitDeep<EncodedCodeRef>(extension.properties, isEncodedCodeRef, (encodedCodeRef, key, obj) => {
    const codeRefKey = `${extension.pluginName}[${encodedCodeRef.$codeRef}]`;

    let codeRef: CodeRef;

    if (codeRefCache.has(codeRefKey)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      codeRef = codeRefCache.get(codeRefKey)!;
    } else {
      codeRef = createCodeRef(
        encodedCodeRef,
        entryModule,
        (message) => `${message} in extension ${extension.uid}`,
      );

      // Use a sensible function name that reflects the current context
      Object.defineProperty(codeRef, 'name', {
        value: `$codeRef_${codeRefKey}`,
        configurable: true,
      });

      // Mark the function with a non-configurable symbol property
      Object.defineProperty(codeRef, codeRefSymbol, { value: true });

      codeRefCache.set(codeRefKey, codeRef);
    }

    // eslint-disable-next-line no-param-reassign
    obj[key] = codeRef;
  });

  return extension;
};

/**
 * In the extension's `properties` object, replace all {@link CodeRef} functions
 * with the corresponding values by resolving the associated Promises.
 *
 * This is an asynchronous operation that completes when all of the associated
 * Promises are either resolved or rejected. If there were no resolution errors,
 * the resulting Promise resolves to the updated extension instance.
 */
export const resolveCodeRefValues = async <TExtension extends Extension>(extension: TExtension) => {
  const resolutions: Promise<void>[] = [];
  const resolutionErrors: unknown[] = [];

  visitDeep<CodeRef>(extension.properties, isCodeRef, (codeRef, key, obj) => {
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
    throw new CodeRefError('Failed to resolve code references', resolutionErrors);
  }

  return extension as ResolvedExtension<TExtension>;
};
