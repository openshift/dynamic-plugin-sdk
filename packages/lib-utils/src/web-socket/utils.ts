import { getUtilsConfig } from '../config';

export const createURL = async (host: string, path: string): Promise<string> => {
  let url;

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

  if (path) {
    url += path;
  }

  const { urlAugment } = await getUtilsConfig().wsAppSettings();

  return urlAugment ? urlAugment(url) : url;
};

export const applyConfigHost = async (overrideHost?: string): Promise<string> => {
  return overrideHost ?? (await getUtilsConfig().wsAppSettings()).host;
};

export const applyConfigSubProtocols = async (
  overridableProtocols?: string[],
): Promise<string[]> => {
  return overridableProtocols ?? (await getUtilsConfig().wsAppSettings()).subProtocols;
};
