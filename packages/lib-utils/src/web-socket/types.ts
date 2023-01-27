import type { AnyObject } from '@openshift/dynamic-plugin-sdk';

/**
 * Configuration that is used to configure WebSockets from a host app perspective.
 */
export type WebSocketAppSettings = {
  /**
   * The host to which the web socket will connect to.
   */
  host: string;

  /**
   * The sub protocols that you wish to send along with the web socket connection call.
   */
  subProtocols: string[];

  /**
   * An optional function to augment the URL after it's constructed and before it is used by the
   * web socket.
   * @param url - The fully qualified URL
   * @returns - A optionally modified fully qualified URL
   */
  urlAugment?: (url: string) => string;
};

/**
 * The web socket configuration options.
 */
export type WebSocketOptions = {
  /**
   * The path to the resource you wish to watch.
   */
  path: string;

  /**
   * Overridable web socket host URL for plugins. Normally set by the application.
   */
  host?: string;

  /**
   * Overridable web socket sub protocols for plugins. Normally set by the application.
   * Note: This is ignored if `host` is not set.
   */
  subProtocols?: string[];

  /**
   * Set to true if you want automatic reconnection if it fails to create or when the web socket
   * closes.
   */
  reconnect?: boolean;

  /**
   * Set to true if you wish to get your data back in JSON format when the web socket sends a message.
   * Note: If it's not valid JSON, a warning will be logged and you get back the raw message.
   */
  jsonParse?: boolean;

  /**
   * Set a maximum buffer to hold onto between `bufferFlushInterval`s. Messages that exceed the
   * buffer are dropped.
   *
   * Unit is in number of messages.
   */
  bufferMax?: number;

  /**
   * Configure a duration between messages being flushed out in events.
   *
   * Note: If `bufferMax` is not set, this is ignored.
   * Defaults to 500ms.
   */
  bufferFlushInterval?: number;

  /**
   * Set a connection limit for when to give up on the current instance of the web socket.
   *
   * If omitted, the web socket will continue to try to reconnect only if you set the `reconnect`
   * flag.
   */
  timeout?: number;
};

/**
 * The WebSocket data can be returned in an object state or in the raw string response passed.
 *
 * This is configured through `jsonParse` options flag.
 * @see WebSocketOptions
 */
export type MessageDataType = AnyObject | string;

export type GenericHandler<T = unknown> = (data: T) => void;
export type OpenHandler = GenericHandler<never>;
export type CloseHandler = GenericHandler<CloseEvent>;
export type ErrorHandler = GenericHandler<Event>;
export type MessageHandler = GenericHandler<MessageDataType>;
/**
 * Data is provided potentially by .destroy() caller.
 */
export type DestroyHandler = GenericHandler<unknown | undefined>;
export type BulkMessageHandler = GenericHandler<MessageDataType[]>;

export type EventHandlers = {
  open: OpenHandler[];
  close: CloseHandler[];
  error: ErrorHandler[];
  message: MessageHandler[];
  destroy: DestroyHandler[];
  bulkMessage: BulkMessageHandler[];
};

export type EventHandlerTypes = keyof EventHandlers;
