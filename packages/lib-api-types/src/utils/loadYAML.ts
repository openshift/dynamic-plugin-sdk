import { readFileSync } from 'fs';
import { load as parseYAML } from 'js-yaml';
import { resolve } from 'path';

/** Parse a YAML file and return the parsed object */
export const loadYAML = <T>(filePath: string): T => {
  const fullPath = resolve(__dirname, filePath);
  const fileContents = readFileSync(fullPath, 'utf8');
  return parseYAML(fileContents) as T;
};
