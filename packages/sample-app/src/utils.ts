export const isValidURL = (value: string, allowedProtocols = ['http:', 'https:']) => {
  let url: URL;

  try {
    url = new URL(value);
  } catch (e) {
    return false;
  }

  return allowedProtocols.includes(url.protocol);
};
