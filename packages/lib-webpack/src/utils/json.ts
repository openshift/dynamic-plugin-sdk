import * as fs from 'fs';

export const parseJSONFile = <TValue = unknown>(filePath: string) =>
  JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TValue;
