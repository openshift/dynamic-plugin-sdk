import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const distDir = resolve(__dirname, '../dist');
const pkgPath = resolve(__dirname, '../package.json');
const hasDist = existsSync(distDir);

const describeIfDist = hasDist ? describe : describe.skip;

describeIfDist('generated output', () => {
  it('dist/index.d.ts exists and exports kubernetes and openshift', () => {
    const indexPath = resolve(distDir, 'index.d.ts');
    expect(existsSync(indexPath)).toBe(true);
    const content = readFileSync(indexPath, 'utf-8');
    expect(content).toMatch(/from\s+['"]\.\/kubernetes['"]/);
    expect(content).toMatch(/from\s+['"]\.\/openshift['"]/);
    expect(content).toMatch(/from\s+['"]\.\/k8s-common['"]/);
  });

  it('dist/k8s-common.d.ts exports the base interface', () => {
    const path = resolve(distDir, 'k8s-common.d.ts');
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('export interface K8sResourceCommon');
    expect(content).toContain('export interface OwnerReference');
    expect(content).toContain('export interface ObjectMetadata');
  });

  it('dist/kubernetes/ contains type files', () => {
    const indexPath = resolve(distDir, 'kubernetes/index.d.ts');
    expect(existsSync(indexPath)).toBe(true);
    expect(existsSync(resolve(distDir, 'kubernetes/all.d.ts'))).toBe(true);
    expect(existsSync(resolve(distDir, 'kubernetes/latest.d.ts'))).toBe(true);
  });

  it('dist/openshift/ contains type files', () => {
    const indexPath = resolve(distDir, 'openshift/index.d.ts');
    expect(existsSync(indexPath)).toBe(true);
    expect(existsSync(resolve(distDir, 'openshift/all.d.ts'))).toBe(true);
    expect(existsSync(resolve(distDir, 'openshift/latest.d.ts'))).toBe(true);
  });

  it('dist/index.d.ts has the build banner', () => {
    const content = readFileSync(resolve(distDir, 'index.d.ts'), 'utf-8');
    expect(content).toMatch(/^\/\*\*/);
    expect(content).toContain('OpenShift Dynamic Plugin SDK');
    expect(content).toContain('packageName');
  });
});

describeIfDist('build-metadata.json', () => {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  it('exists in dist', () => {
    expect(existsSync(resolve(distDir, 'build-metadata.json'))).toBe(true);
  });

  it('has the required fields', () => {
    const metadata = JSON.parse(readFileSync(resolve(distDir, 'build-metadata.json'), 'utf-8'));
    expect(metadata).toHaveProperty('packageName', pkg.name);
    expect(metadata).toHaveProperty('packageVersion', pkg.version);
    expect(metadata).toHaveProperty('buildDate');
    expect(metadata).toHaveProperty('buildTime');
    expect(metadata).toHaveProperty('gitCommit');
    expect(metadata).toHaveProperty('gitBranch');
    expect(metadata).toHaveProperty('sources');
  });

  it('source commits match package.json', () => {
    const metadata = JSON.parse(readFileSync(resolve(distDir, 'build-metadata.json'), 'utf-8'));
    expect(metadata.sources).toEqual(pkg.sources);
  });
});
