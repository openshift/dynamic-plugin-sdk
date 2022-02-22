import type { AnyObject } from '@monorepo/common';
import type { Extension, CodeRef } from '../types/extension';

export type TelemetryListener = Extension<
  'core.telemetry/listener',
  {
    /** Listen for telemetry events */
    listener: CodeRef<TelemetryEventListener>;
  }
>;

// TProperties should be valid JSON
export type TelemetryEventListener = <TProperties = AnyObject>(
  eventType: string,
  properties?: TProperties,
) => void;

// Type guards

export const isTelemetryListener = (e: Extension): e is TelemetryListener => {
  return e.type === 'core.telemetry/listener';
};
