import { getUtilsConfig } from '../config';
import type { WebSocketOptions } from './types';

export const applyConfigHost = async (
  options: WebSocketOptions & { wsPrefix?: string; pathPrefix?: string },
): Promise<string> => {
  return options.host ?? (await getUtilsConfig().wsAppSettings(options)).host;
};

export const createURL = async (options: WebSocketOptions): Promise<string> => {
  let url;

  const host = await applyConfigHost(options);

  if (host === 'auto') {
    if (window.location.protocol === 'https:') {
      url = 'wss://';
    } else {
      url = 'ws://';
    }
    url += window.location.host;
  } else {
    url = host;
  }

  if (options.path) {
    url += options.path;
  }

  const { urlAugment } = await getUtilsConfig().wsAppSettings(options);

  return urlAugment ? urlAugment(url) : url;
};

export const applyConfigSubProtocols = async (
  options: WebSocketOptions & { wsPrefix?: string; pathPrefix?: string },
): Promise<string[]> => {
  return (
    (options.host ? options.subProtocols : undefined) ??
    (await getUtilsConfig().wsAppSettings(options)).subProtocols
  );
};
