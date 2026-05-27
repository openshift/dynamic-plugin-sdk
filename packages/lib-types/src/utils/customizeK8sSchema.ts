import type { JSONSchema4 } from 'json-schema';
import { getReference } from './getReference';

/** Removes common properties addressed by `K8sResourceCommon` and add some TSDoc tags */
export const customizeK8sSchema = (
  schema: JSONSchema4,
  group: string,
  version: string,
  kind: string,
) => {
  // delete common properties that are always present (we will use our own)
  if (schema.properties) {
    delete schema.properties.apiVersion;
    delete schema.properties.kind;
    delete schema.properties.metadata;
  }

  // append group~version~kind to banner comment
  schema.description += `\n\n@version \`${getReference(group, version, kind)}\``;

  // append @alpha or @beta to description if applicable
  if (version.includes('alpha')) schema.description += `\n@alpha`;
  else if (version.includes('beta')) schema.description += `\n@beta`;
};
