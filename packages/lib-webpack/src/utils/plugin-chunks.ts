import { Compilation, Chunk, AssetInfo } from 'webpack';

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

  const runtimeChunk = allChunks.find((chunk) => {
      /**
       * In webpack chunk runtime can be one of undefined, string and a SortableSet.
       * 
       * If runtime is a SortableSet, a different check is needed.
       */
      if (typeof entryChunk.runtime === 'string') {
        return chunk.name === entryChunk.runtime;
      } else if (entryChunk.runtime) {
        return entryChunk.runtime.has(chunk.name);
      }
    }
  );

  if (!runtimeChunk) {
    throw new Error(`Cannot find runtime chunk for entry chunk ${containerName}`);
  }

  return { entryChunk, runtimeChunk };
};

export const getChunkFiles = (
  chunk: Chunk,
  compilation: Compilation,
  includeFile = (assetInfo: AssetInfo) => !assetInfo.development && !assetInfo.hotModuleReplacement,
) =>
  Array.from(chunk.files).filter((fileName) => {
    const assetInfo = compilation.getAsset(fileName);

    if (!assetInfo) {
      throw new Error(`Missing asset information for ${fileName}`);
    }

    return includeFile(assetInfo);
  });
