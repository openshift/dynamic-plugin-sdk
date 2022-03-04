import { getUtilsConfig } from '../config';

export const createURL = (host: string, path: string): string => {
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

  return url;
};

export const applyConfigHost = (overrideHost?: string): string => {
  return overrideHost ?? getUtilsConfig().wsAppSettings.host;
};

export const applyConfigSubProtocols = (overridableProtocols?: string[]): string[] => {
  return overridableProtocols ?? getUtilsConfig().wsAppSettings.subProtocols;
};
