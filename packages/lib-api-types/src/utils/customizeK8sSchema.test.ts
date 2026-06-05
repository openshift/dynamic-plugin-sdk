import type { JSONSchema4 } from 'json-schema';
import { customizeK8sSchema } from './customizeK8sSchema';

const makeSchema = (overrides: Partial<JSONSchema4> = {}): JSONSchema4 => ({
  description: 'A test resource',
  properties: {
    apiVersion: { type: 'string' },
    kind: { type: 'string' },
    metadata: { type: 'object' },
    spec: { type: 'object' },
  },
  ...overrides,
});

describe('customizeK8sSchema', () => {
  it('removes apiVersion, kind, and metadata from properties', () => {
    const schema = makeSchema();
    customizeK8sSchema(schema, 'apps', 'v1', 'Deployment');
    expect(schema.properties).not.toHaveProperty('apiVersion');
    expect(schema.properties).not.toHaveProperty('kind');
    expect(schema.properties).not.toHaveProperty('metadata');
    expect(schema.properties).toHaveProperty('spec');
  });

  it('appends @version tag to description', () => {
    const schema = makeSchema();
    customizeK8sSchema(schema, 'apps', 'v1', 'Deployment');
    expect(schema.description).toContain('@version `apps~v1~Deployment`');
  });

  it('uses core for empty group in version tag', () => {
    const schema = makeSchema();
    customizeK8sSchema(schema, '', 'v1', 'Pod');
    expect(schema.description).toContain('@version `core~v1~Pod`');
  });

  it('appends @alpha tag for alpha versions', () => {
    const schema = makeSchema();
    customizeK8sSchema(schema, 'apps', 'v1alpha1', 'Deployment');
    expect(schema.description).toContain('@alpha');
    expect(schema.description).not.toContain('@beta');
  });

  it('appends @beta tag for beta versions', () => {
    const schema = makeSchema();
    customizeK8sSchema(schema, 'apps', 'v1beta1', 'Deployment');
    expect(schema.description).toContain('@beta');
    expect(schema.description).not.toContain('@alpha');
  });

  it('appends no stability tag for stable versions', () => {
    const schema = makeSchema();
    customizeK8sSchema(schema, 'apps', 'v1', 'Deployment');
    expect(schema.description).not.toContain('@alpha');
    expect(schema.description).not.toContain('@beta');
  });

  it('handles schema without properties', () => {
    const schema = makeSchema({ properties: undefined });
    expect(() => customizeK8sSchema(schema, 'apps', 'v1', 'Deployment')).not.toThrow();
  });
});
