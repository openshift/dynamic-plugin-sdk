import type { JSONSchema4 } from 'json-schema';

/**
 * Takes a TypeScript interface as a string and adds an "extends ..." clause to it
 *
 * Assumes this has not already been done.
 */
const extendInterface = (ts: string, interfaceName: string, extension: string): string => {
  const interfaceRegex = new RegExp(`(export interface ${interfaceName} )({)`);
  return ts.replace(interfaceRegex, `$1extends ${extension} $2`);
};

/** Check if one field is required in a JSON schema */
const isFieldRequired = (schema: JSONSchema4, fieldName: string): boolean => {
  return Array.isArray(schema.required) && schema.required.includes(fieldName);
};

/** Check if multiple fields are required in a JSON schema and return the required ones */
const areFieldsRequired = (schema: JSONSchema4, fieldNames: string[]): string[] => {
  return fieldNames.filter((name) => isFieldRequired(schema, name));
};

/** Determine the appropriate common interface to extend based on required fields */
const getCommonInterface = (schema: JSONSchema4) => {
  const requiredFields = areFieldsRequired(schema, ['apiVersion', 'kind', 'metadata']);
  if (requiredFields.length === 0) return 'K8sResourceCommon';
  return `RequiredK8sResourceCommon<"${requiredFields.join('" | "')}">`;
};

/** Extend a TypeScript interface string with the appropriate K8sResourceCommon variant */
export const extendK8sInterface = (ts: string, schema: JSONSchema4, interfaceName: string) => {
  const commonInterface = getCommonInterface(schema);
  return extendInterface(ts, interfaceName, commonInterface);
};
