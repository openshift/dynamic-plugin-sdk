import { consoleLogger } from '@monorepo/common';
import type {
  EventHandlers,
  EventHandlerTypes,
  CloseHandler,
  MessageHandler,
  BulkMessageHandler,
  MessageDataType,
  DestroyHandler,
  OpenHandler,
  ErrorHandler,
} from './types';
import { applyConfigSubProtocols, applyConfigHost, createURL } from './ws-utils';

/**
 * The web socket configuration options.
 */
export type WSOptions = {
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
   * Set to true if you wish to get your data back in JSON format when the WS sends a message.
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
 * States the web socket can be in.
 */
export enum WSState {
  INIT = 'init',
  OPENED = 'open',
  ERRORED = 'error',
  CLOSED = 'closed',
  DESTROYED = 'destroyed',
}

/**
 * @class WebSocket factory and utility wrapper.
 */
export class WSFactory {
  private readonly handlers: EventHandlers;

  private readonly flushCanceler: ReturnType<typeof setInterval>;

  private readonly bufferMax: number;

  private paused = false;

  private state: WSState = WSState.INIT;

  private messageBuffer: MessageDataType[] = [];

  private connectionAttempt: ReturnType<typeof setTimeout>;

  private ws: WebSocket | null = null;

  constructor(
    /** Unique identifier for the web socket. */
    private readonly id: string,
    /** Options to configure the web socket with. */
    private readonly options: WSOptions,
  ) {
    this.bufferMax = options.bufferMax || 0;
    this.handlers = {
      open: [],
      close: [],
      error: [],
      message: [],
      destroy: [],
      bulkMessage: [],
    };
    this.connect();

    if (this.bufferMax) {
      this.flushCanceler = setInterval(
        this.flushMessageBuffer.bind(this),
        this.options.bufferFlushInterval || 500,
      );
    }
  }

  private reconnect(): void {
    if (this.connectionAttempt || this.state === WSState.DESTROYED) {
      return;
    }

    let duration = 0;

    const attempt = () => {
      if (!this.options.reconnect || this.state === WSState.OPENED) {
        clearTimeout(this.connectionAttempt);
        this.connectionAttempt = -1;
        return;
      }
      if (this.options.timeout && duration > this.options.timeout) {
        clearTimeout(this.connectionAttempt);
        this.connectionAttempt = -1;
        this.destroy();
        return;
      }

      this.connect();
      duration = Math.round(Math.min(1.5 * duration, 60000));
      this.connectionAttempt = setTimeout(attempt, duration);
      consoleLogger.info(`attempting reconnect in ${duration / 1000} seconds...`);
    };

    this.connectionAttempt = setTimeout(attempt, 1000);
  }

  private connect(): void {
    this.state = WSState.INIT;
    this.messageBuffer = [];

    const url = createURL(applyConfigHost(this.options.host), this.options.path);
    const subProtocols = applyConfigSubProtocols(
      this.options.host ? this.options.subProtocols : undefined,
    );
    try {
      this.ws = new WebSocket(url, subProtocols);
    } catch (e) {
      consoleLogger.error('Error creating websocket:', e);
      this.reconnect();
      return;
    }

    this.ws.onopen = () => {
      consoleLogger.info(`websocket open: ${this.id}`);
      this.state = WSState.OPENED;
      this.triggerEvent('open', undefined);
      if (this.connectionAttempt) {
        clearTimeout(this.connectionAttempt);
        this.connectionAttempt = null;
      }
    };
    this.ws.onclose = (evt) => {
      consoleLogger.info(`websocket closed: ${this.id}`, evt);
      this.state = WSState.CLOSED;
      this.triggerEvent('close', evt);
      this.reconnect();
    };
    this.ws.onerror = (evt) => {
      consoleLogger.info(`websocket error: ${this.id}`);
      this.state = WSState.ERRORED;
      this.triggerEvent('error', evt);
    };
    this.ws.onmessage = (evt) => {
      let msg;
      try {
        msg = this.options.jsonParse ? JSON.parse(evt.data) : evt.data;
      } catch (e) {
        consoleLogger.warn(
          'Based on `options.parseJSON`, message data was attempted to be parsed. An error occurred:',
          e,
        );
        msg = evt.data;
      }
      // In some browsers, onmessage can fire after onclose/error. Don't update state to be incorrect.
      if (this.state !== WSState.DESTROYED && this.state !== WSState.CLOSED) {
        this.state = WSState.OPENED;
      }
      this.triggerEvent('message', msg);
    };
  }

  private invokeHandlers(type: EventHandlerTypes, data?: unknown): void {
    const handlers = this.handlers[type];
    handlers?.forEach((h) => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        h(data); // typescript is having an issue with passing the data, muting for now
      } catch (e) {
        consoleLogger.error('WS handling failed:', e);
      }
    });
  }

  private triggerEvent(type: EventHandlerTypes, data?: unknown): void {
    if (this.state === WSState.DESTROYED) {
      return;
    }

    const isMessageEvent = (t: string, e: unknown): e is MessageDataType => {
      return t === 'message' && !!e;
    };

    // Only buffer "message" events, so "error" and "close" etc can pass thru.
    if (this.bufferMax && isMessageEvent(type, data)) {
      this.messageBuffer.push(data);

      if (this.messageBuffer.length > this.bufferMax) {
        this.messageBuffer.shift();
      }

      return;
    }

    this.invokeHandlers(type, data);
  }

  /**
   * Sets up a listener to when a message comes through the ws.
   * @param fn - The event handler that will be called
   */
  onMessage(fn: MessageHandler): WSFactory {
    if (this.state !== WSState.DESTROYED) {
      this.handlers.message.push(fn);
    }
    return this;
  }

  /**
   * Sets up a listener for when you set `options.bufferMax` to receive multiple messages at once.
   * @param fn - The event handler that will be called
   */
  onBulkMessage(fn: BulkMessageHandler): WSFactory {
    if (this.state !== WSState.DESTROYED) {
      this.handlers.bulkMessage.push(fn);
    }
    return this;
  }

  /**
   * Sets up a listener for when an error gets invoked in the WS response.
   * @param fn - The event handler that will be called
   */
  onError(fn: ErrorHandler): WSFactory {
    if (this.state !== WSState.DESTROYED) {
      this.handlers.error.push(fn);
    }
    return this;
  }

  /**
   * Sets up a listener for when the WS opens.
   * @param fn - The event handler that will be called
   */
  onOpen(fn: OpenHandler): WSFactory {
    if (this.state !== WSState.DESTROYED) {
      this.handlers.open.push(fn);
    }
    return this;
  }

  /**
   * Sets up a listener for when the WS closes.
   * @param fn - The event handler that will be called
   */
  onClose(fn: CloseHandler): WSFactory {
    if (this.state !== WSState.DESTROYED) {
      this.handlers.close.push(fn);
    }
    return this;
  }

  /**
   * Sets up a listener for when the WS is cleaned up and no longer in-use.
   * @param fn - The event handler that will be called
   */
  onDestroy(fn: DestroyHandler): WSFactory {
    if (this.state !== WSState.DESTROYED) {
      this.handlers.destroy.push(fn);
    }
    return this;
  }

  /**
   * Pushes the messages through the `onBulkMessage` handlers that have been configured. If no
   * `onBulkMessage` handlers are set, multiple 'onMessage' callbacks will be invoked for each item.
   *
   * Does nothing when paused or has no messages to push out.
   */
  flushMessageBuffer(): void {
    if (this.paused || !this.messageBuffer.length) {
      return;
    }

    if (this.handlers.bulkMessage.length) {
      this.invokeHandlers('bulkMessage', this.messageBuffer);
    } else {
      this.messageBuffer.forEach((e) => this.invokeHandlers('message', e));
    }

    this.messageBuffer = [];
  }

  /**
   *  Pauses the WS event handlers from being invoked.
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Unpauses the WS event handlers, messages will be flushed automatically.
   */
  unpause(): void {
    this.paused = false;
    this.flushMessageBuffer();
  }

  /**
   * @returns pausedState - The current pause state
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Gets the current state of the WS.
   */
  getState(): WSState {
    return this.state;
  }

  /**
   * Returns the current buffer size.
   */
  bufferSize(): number {
    return this.messageBuffer.length;
  }

  /**
   * Cleans up the WS instance and related internal data.
   */
  destroy(): void {
    consoleLogger.info(`destroying websocket: ${this.id}`);
    if (this.state === WSState.DESTROYED) {
      return;
    }

    try {
      if (this.ws) {
        this.ws.close();
      }
    } catch (e) {
      consoleLogger.error('Error while close WS socket', e);
    }

    clearInterval(this.flushCanceler);
    clearTimeout(this.connectionAttempt);

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws = null;
    }

    try {
      this.triggerEvent('destroy');
    } catch (e) {
      consoleLogger.error('Error while trigger destroy event for WS socket', e);
    }

    this.state = WSState.DESTROYED;

    this.messageBuffer = [];
  }

  /**
   * Send a message through the WS to the server.
   * @param data - String like data for the server to consume
   */
  send(data: Parameters<typeof WebSocket.prototype.send>[0]): void {
    this.ws?.send(data);
  }
}
