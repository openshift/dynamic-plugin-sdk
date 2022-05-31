const flagsForSampleApp: { [key: string]: boolean } = {};

const setFlagForSampleApp = (flag: string, isEnabled: boolean): void => {
  flagsForSampleApp[flag] = isEnabled;
};

const getFlagForSampleApp = (flag: string): boolean => {
  return flagsForSampleApp[flag];
};

const getFlagsForSampleApp = () => {
  return flagsForSampleApp;
};

export { setFlagForSampleApp, getFlagForSampleApp, getFlagsForSampleApp };
