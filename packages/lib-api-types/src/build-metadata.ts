import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const root = process.cwd();

const pkg: {
  name: string;
  version: string;
  repository: { url: string };
} = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));

const sources: Record<string, string> = JSON.parse(
  readFileSync(resolve(root, 'sources.json'), 'utf-8'),
);

const now = new Date();

const metadata = {
  packageName: pkg.name,
  packageVersion: pkg.version,
  buildDate: now.toLocaleString('en-US', { dateStyle: 'long' }),
  buildTime: now.toLocaleString('en-US', { timeStyle: 'long' }),
  gitCommit: execSync('git rev-parse HEAD').toString().trim(),
  gitBranch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
  sources,
};

writeFileSync(resolve(root, 'dist/build-metadata.json'), JSON.stringify(metadata, null, 2) + '\n');

const bannerEntries: Record<string, string> = {
  packageName: metadata.packageName,
  packageVersion: metadata.packageVersion,
  buildDate: metadata.buildDate,
  buildTime: metadata.buildTime,
  gitCommit: metadata.gitCommit,
  gitBranch: metadata.gitBranch,
  ...Object.fromEntries(
    Object.entries(sources).map(([repo, commit]) => [`source:${repo}`, commit]),
  ),
};

const padLength = Object.keys(bannerEntries).reduce(
  (max, key) => (key.length > max ? key.length : max),
  0,
);

const banner = `/**\n  OpenShift Dynamic Plugin SDK\n  ${pkg.repository.url.replace(/\.git$/, '')}\n\n  ${Object.entries(
  bannerEntries,
)
  .map(([key, value]) => `${key.padEnd(padLength)} : ${value}`)
  .join('\n  ')}\n */\n`;

const indexPath = resolve(root, 'dist/index.d.ts');
const content = readFileSync(indexPath, 'utf-8');
writeFileSync(indexPath, banner + content);
