import type { JSONSchema4 } from 'json-schema';
import { extendK8sInterface } from './extendK8sInterface';

const makeInterface = (name: string, body = '  foo: string;') =>
  `export interface ${name} {\n${body}\n}`;

describe('extendK8sInterface', () => {
  it('extends with K8sResourceCommon when no fields are required', () => {
    const ts = makeInterface('DeploymentKind');
    const schema: JSONSchema4 = {};
    const result = extendK8sInterface(ts, schema, 'DeploymentKind');
    expect(result).toContain('extends K8sResourceCommon {');
  });

  it('extends with RequiredK8sResourceCommon when apiVersion is required', () => {
    const ts = makeInterface('DeploymentKind');
    const schema: JSONSchema4 = { required: ['apiVersion'] };
    const result = extendK8sInterface(ts, schema, 'DeploymentKind');
    expect(result).toContain('extends RequiredK8sResourceCommon<"apiVersion">');
  });

  it('extends with multiple required fields', () => {
    const ts = makeInterface('DeploymentKind');
    const schema: JSONSchema4 = { required: ['apiVersion', 'kind', 'metadata'] };
    const result = extendK8sInterface(ts, schema, 'DeploymentKind');
    expect(result).toContain('RequiredK8sResourceCommon<"apiVersion" | "kind" | "metadata">');
  });

  it('ignores non-K8s required fields', () => {
    const ts = makeInterface('DeploymentKind');
    const schema: JSONSchema4 = { required: ['spec', 'status'] };
    const result = extendK8sInterface(ts, schema, 'DeploymentKind');
    expect(result).toContain('extends K8sResourceCommon {');
  });

  it('preserves the rest of the interface body', () => {
    const ts = makeInterface('DeploymentKind');
    const schema: JSONSchema4 = {};
    const result = extendK8sInterface(ts, schema, 'DeploymentKind');
    expect(result).toContain('foo: string;');
  });

  it('does not modify interfaces with a different name', () => {
    const ts = makeInterface('OtherKind');
    const schema: JSONSchema4 = {};
    const result = extendK8sInterface(ts, schema, 'DeploymentKind');
    expect(result).not.toContain('extends');
  });
});
