import { getReference, getReferenceInterfaceName } from './getReference';

describe('getReference', () => {
  it('joins group, version, and kind with ~', () => {
    expect(getReference('apps', 'v1', 'Deployment')).toBe('apps~v1~Deployment');
  });

  it('substitutes "core" for empty group', () => {
    expect(getReference('', 'v1', 'Pod')).toBe('core~v1~Pod');
  });

  it('handles dotted group names', () => {
    expect(getReference('batch.k8s.io', 'v1', 'Job')).toBe('batch.k8s.io~v1~Job');
  });
});

describe('getReferenceInterfaceName', () => {
  it('appends Kind and sanitizes', () => {
    const result = getReferenceInterfaceName('apps', 'v1', 'Deployment');
    expect(result).toContain('Kind');
    expect(result).not.toContain('~');
  });

  it('uses core for empty group', () => {
    const result = getReferenceInterfaceName('', 'v1', 'Pod');
    expect(result).toContain('Kind');
  });
});
