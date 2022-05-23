let flagsForSampleApp: string[] = [];

const setFlagsForSampleApp = (flags: string[]): void => {
  flagsForSampleApp = flags;
};

const getFlagsForSampleApp = () => {
  return flagsForSampleApp;
};

export { setFlagsForSampleApp, getFlagsForSampleApp };
