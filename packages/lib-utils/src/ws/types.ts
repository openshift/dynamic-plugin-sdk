import type { AnyObject } from '@monorepo/common';

type GenericHandler<T = unknown> = (data: T) => void;
export type OpenHandler = GenericHandler<never>;
export type CloseHandler = GenericHandler<CloseEvent>;
export type ErrorHandler = GenericHandler<Event>;
/**
 * The WebSocket data can be returned in an object state or in the raw string response passed.
 *
 * This is configured through `jsonParse` options flag.
 * @see WSOptions
 */
export type MessageDataType = AnyObject | string;
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
