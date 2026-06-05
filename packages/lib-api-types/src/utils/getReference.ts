import { toSafeString } from './toSafeString';

/**
 * Provides a reference string that uniquely identifies the group, version, and kind of a k8s resource.
 *
 * @param group Pass group of k8s resource or model.
 * @param version Pass version of k8s resource or model.
 * @param kind Pass kind of k8s resource or model.
 * @returns The reference for any k8s resource i.e `group~version~kind`.
 *
 * If the group will not be present then "core" will be returned as part of the group in reference.
 */
export const getReference = (group: string, version: string, kind: string): string =>
  [group || 'core', version, kind].join('~');

export const getReferenceInterfaceName = (group: string, version: string, kind: string): string =>
  toSafeString(`${getReference(group, version, kind)}Kind`);
