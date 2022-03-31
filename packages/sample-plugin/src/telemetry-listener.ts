import type { TelemetryEventListener } from '@openshift/dynamic-plugin-sdk';

const telemetryListener: TelemetryEventListener = (eventType, properties) => {
  // eslint-disable-next-line no-console
  console.log('telemetryListener', eventType, properties);
};

export default telemetryListener;
