import { Chunk } from "webpack"

const findPluginEntry = (containerName: string, chunks: Set<Chunk>) => {
  const chunkArray = Array.from(chunks);
  const { entryChunkName, runtimeChunkName } = chunkArray.reduce<{entryChunkName?: string, runtimeChunkName?: string}>((acc, { name, runtime, hash, files }) => {
    const result = {...acc,}
    if(!result.entryChunkName && name === containerName) {
      result.entryChunkName = files.values().next().value
    }
    /**
     * Sometimes webpack runtime chunk might not be included inside the remote container script.
     * This fully depends on the optmization.runtime webpack config
     */
    if(!result.runtimeChunkName && name === runtime) {
      result.runtimeChunkName = files.values().next().value
    }
    return result
  }, {})

  if(entryChunkName === runtimeChunkName) {
    return { entryChunkName }
  }

  return {
    entryChunkName,
    runtimeChunkName
  }
}

export default findPluginEntry
