import type { AnyObject } from '@monorepo/common';

/**
 * Configuration that is used to configure WebSockets from a host app perspective.
 */
export type WebSocketConfigs = {
  host: string;
  subProtocols: string[];
};

/**
 * The WebSocket data can be returned in an object state or in the raw string response passed.
 *
 * This is configured through `jsonParse` options flag.
 * @see WSOptions
 */
export type MessageDataType = AnyObject | string;

type GenericHandler<T = unknown> = (data: T) => void;
export type OpenHandler = GenericHandler<never>;
export type CloseHandler = GenericHandler<CloseEvent>;
export type ErrorHandler = GenericHandler<Event>;
export type MessageHandler = GenericHandler<MessageDataType>;
export type DestroyHandler = GenericHandler<never>;
export type BulkMessageHandler = GenericHandler<MessageDataType>;

export type EventHandlers = {
  open: OpenHandler[];
  close: CloseHandler[];
  error: ErrorHandler[];
  message: MessageHandler[];
  destroy: DestroyHandler[];
  bulkMessage: BulkMessageHandler[];
};

export type EventHandlerTypes = keyof EventHandlers;
