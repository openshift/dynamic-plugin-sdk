import type { TelemetryEventListener } from '@openshift/dynamic-plugin-sdk-extensions';

const telemetryListener: TelemetryEventListener = (eventType, properties) => {
  // eslint-disable-next-line no-console
  console.info('Telemetry listener', eventType, properties);
};

export default telemetryListener;
