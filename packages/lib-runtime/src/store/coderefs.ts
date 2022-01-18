import type { AnyObject } from '@monorepo/common';
import { CustomError, visitDeep } from '@monorepo/common';
import * as _ from 'lodash-es';
import type { EncodedCodeRef, CodeRef, LoadedExtension } from '../types/extension';
import type { PluginEntryModule } from '../types/runtime';

class CodeRefError extends CustomError {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
  }
}

const codeRefSymbol = Symbol('CodeRef');

/**
 * Check if the given object has the {@link EncodedCodeRef} shape.
 */
const isEncodedCodeRef = (obj: unknown): obj is EncodedCodeRef =>
  _.isPlainObject(obj) &&
  _.isEqual(Object.getOwnPropertyNames(obj), ['$codeRef']) &&
  typeof (obj as EncodedCodeRef).$codeRef === 'string';

/**
 * Check if the given object is a {@link CodeRef} function.
 */
const isCodeRef = (obj: unknown): obj is CodeRef =>
  typeof obj === 'function' &&
  _.isEqual(Object.getOwnPropertySymbols(obj), [codeRefSymbol]) &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (obj as any)[codeRefSymbol] === true;

/**
 * Parse data from the {@link EncodedCodeRef} object.
 *
 * Returns `undefined` if the `$codeRef` value is malformed.
 */
const parseEncodedCodeRef = (
  ref: EncodedCodeRef,
): [moduleName: string, exportName: string] | undefined => {
  const match = ref.$codeRef.match(/^([^.]+)(?:\.([^.]+)){0,1}$/);

  if (!match) {
    return undefined;
  }

  const moduleName = match[1];
  const exportName = match[2] || 'default';

  if (!moduleName || !exportName) {
    return undefined;
  }

  if (moduleName !== moduleName.trim() || exportName !== exportName.trim()) {
    return undefined;
  }

  return [moduleName, exportName];
};

/**
 * Create a {@link CodeRef} function from the {@link EncodedCodeRef} object.
 *
 * The referenced object is resolved just once. Multiple {@link CodeRef} Promise resolutions
 * yield the exact same value.
 */
const createCodeRef = (
  encodedRef: EncodedCodeRef,
  entryModule: PluginEntryModule,
  formatErrorMessage: (message: string) => string = _.identity,
): CodeRef => {
  let referencedObject: unknown;
  let referencedObjectResolved = false;

  const codeRef: CodeRef = async () => {
    if (referencedObjectResolved) {
      return referencedObject;
    }

    const refData = parseEncodedCodeRef(encodedRef);

    if (!refData) {
      throw new CodeRefError(
        formatErrorMessage(`Malformed code reference '${encodedRef.$codeRef}'`),
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

    referencedObject = referencedModule[exportName];
    referencedObjectResolved = true;

    return referencedObject;
  };

  // Mark the function with a non-configurable symbol property
  Object.defineProperty(codeRef, codeRefSymbol, { value: true });

  return codeRef;
};

/**
 * In the extension's `properties` object, replace all {@link EncodedCodeRef} values
 * with {@link CodeRef} functions that can be used to load the referenced objects.
 */
export const decodeExtensionCodeRefs = (
  extension: LoadedExtension,
  entryModule: PluginEntryModule,
) => {
  visitDeep<EncodedCodeRef>(extension.properties, isEncodedCodeRef, (encodedRef, key, obj) => {
    const codeRef = createCodeRef(
      encodedRef,
      entryModule,
      (message) => `${message} in extension ${extension.uid}`,
    );

    // Use a sensible function name that reflects the contextual information
    Object.defineProperty(codeRef, 'name', {
      value: `$codeRef_${extension.uid}_${encodedRef}`,
      configurable: true,
    });

    // eslint-disable-next-line no-param-reassign
    obj[key] = codeRef;
  });
};

/**
 * In the extension's `properties` object, replace all {@link CodeRef} functions
 * with the corresponding values resolved by executing these functions.
 */
export const resolveExtensionCodeRefValues = (extension: LoadedExtension) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  visitDeep<CodeRef>(extension.properties, isCodeRef, (codeRef, key, obj) => {
    // TODO not implemented yet
  });
};
