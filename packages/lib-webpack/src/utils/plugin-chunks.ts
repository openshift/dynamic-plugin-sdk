import { Compilation, Chunk } from 'webpack';

export const findPluginChunks = (
  containerName: string,
  compilation: Compilation,
): {
  entryChunk: Chunk;
  runtimeChunk?: Chunk;
} => {
  const allChunks = Array.from(compilation.chunks);

  const entryChunk = allChunks.find((chunk) => chunk.name === containerName);

  if (!entryChunk) {
    throw new Error(`Cannot find entry chunk ${containerName}`);
  }

  if (entryChunk.hasRuntime()) {
    return { entryChunk };
  }

  const runtimeChunk = allChunks.find((chunk) => chunk.name === entryChunk.runtime);

  if (!runtimeChunk) {
    throw new Error(`Cannot find runtime chunk for entry chunk ${containerName}`);
  }

  return { entryChunk, runtimeChunk };
};
