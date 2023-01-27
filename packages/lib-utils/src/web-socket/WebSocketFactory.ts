import { consoleLogger } from '@monorepo/common';
import type {
  BulkMessageHandler,
  CloseHandler,
  DestroyHandler,
  EventHandlers,
  EventHandlerTypes,
  ErrorHandler,
  GenericHandler,
  MessageDataType,
  MessageHandler,
  OpenHandler,
  WebSocketOptions,
} from './types';
import { applyConfigSubProtocols, createURL } from './utils';

/**
 * States the web socket can be in.
 */
export enum WebSocketState {
  INIT = 'init',
  OPENED = 'open',
  ERRORED = 'error',
  CLOSED = 'closed',
  DESTROYED = 'destroyed',
}

/**
 * WebSocket factory and utility wrapper.
 */
export class WebSocketFactory {
  private readonly handlers: EventHandlers;

  private readonly flushCanceler: number = -1;

  private readonly bufferMax: number;

  private paused = false;

  private state: WebSocketState = WebSocketState.INIT;

  private messageBuffer: MessageDataType[] = [];

  private connectionAttempt = -1;

  private ws: WebSocket | null = null;

  constructor(
    /** Unique identifier for the web socket. */
    private readonly id: string,
    /** Options to configure the web socket with. */
    private readonly options: WebSocketOptions & { wsPrefix?: string; pathPrefix?: string },
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
      this.flushCanceler = window.setInterval(
        this.flushMessageBuffer.bind(this),
        this.options.bufferFlushInterval || 500,
      );
    }
  }

  private async reconnect(): Promise<void> {
    if (this.connectionAttempt || this.state === WebSocketState.DESTROYED) {
      return;
    }

    let duration = 0;

    const attempt = async () => {
      if (!this.options.reconnect || this.state === WebSocketState.OPENED) {
        window.clearTimeout(this.connectionAttempt);
        this.connectionAttempt = -1;
        return;
      }
      if (this.options.timeout && duration > this.options.timeout) {
        window.clearTimeout(this.connectionAttempt);
        this.connectionAttempt = -1;
        this.destroy();
        return;
      }

      await this.connect();
      duration = Math.round(Math.min(1.5 * duration, 60000));
      this.connectionAttempt = window.setTimeout(attempt, duration);
      consoleLogger.info(`attempting reconnect in ${duration / 1000} seconds...`);
    };

    this.connectionAttempt = window.setTimeout(attempt, 1000);
  }

  private async connect(): Promise<void> {
    this.state = WebSocketState.INIT;
    this.messageBuffer = [];

    const url = await createURL(this.options);
    const subProtocols = await applyConfigSubProtocols(this.options);
    try {
      this.ws = new WebSocket(url, subProtocols);
    } catch (e) {
      consoleLogger.error('Error creating websocket:', e);
      await this.reconnect();
      return;
    }

    this.ws.onopen = () => {
      consoleLogger.info(`websocket open: ${this.id}`);
      this.state = WebSocketState.OPENED;
      this.triggerEvent('open', undefined);
      if (this.connectionAttempt) {
        window.clearTimeout(this.connectionAttempt);
        this.connectionAttempt = -1;
      }
    };
    this.ws.onclose = (evt) => {
      consoleLogger.info(`websocket closed: ${this.id}`, evt);
      this.state = WebSocketState.CLOSED;
      this.triggerEvent('close', evt);
      this.reconnect();
    };
    this.ws.onerror = (evt) => {
      consoleLogger.info(`websocket error: ${this.id}`);
      this.state = WebSocketState.ERRORED;
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
      if (this.state !== WebSocketState.DESTROYED && this.state !== WebSocketState.CLOSED) {
        this.state = WebSocketState.OPENED;
      }
      this.triggerEvent('message', msg);
    };
  }

  private invokeHandlers(type: EventHandlerTypes, data?: unknown): void {
    const handlers = this.handlers[type];
    handlers?.forEach((h) => {
      try {
        (h as GenericHandler)(data);
      } catch (e) {
        consoleLogger.error('Web socket handling failed:', e);
      }
    });
  }

  private triggerEvent(type: EventHandlerTypes, data?: unknown): void {
    if (this.state === WebSocketState.DESTROYED) {
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
   * Sets up a listener to when a message comes through the web socket.
   * @param fn - The event handler that will be called
   */
  onMessage(fn: MessageHandler): WebSocketFactory {
    if (this.state !== WebSocketState.DESTROYED) {
      this.handlers.message.push(fn);
    }
    return this;
  }

  /**
   * Sets up a listener for when you set `options.bufferMax` to receive multiple messages at once.
   * @param fn - The event handler that will be called
   */
  onBulkMessage(fn: BulkMessageHandler): WebSocketFactory {
    if (this.state !== WebSocketState.DESTROYED) {
      this.handlers.bulkMessage.push(fn);
    }
    return this;
  }

  /**
   * Sets up a listener for when an error gets invoked in the web socket response.
   * @param fn - The event handler that will be called
   */
  onError(fn: ErrorHandler): WebSocketFactory {
    if (this.state !== WebSocketState.DESTROYED) {
      this.handlers.error.push(fn);
    }
    return this;
  }

  /**
   * Sets up a listener for when the web socket opens.
   * @param fn - The event handler that will be called
   */
  onOpen(fn: OpenHandler): WebSocketFactory {
    if (this.state !== WebSocketState.DESTROYED) {
      this.handlers.open.push(fn);
    }
    return this;
  }

  /**
   * Sets up a listener for when the web socket closes.
   * @param fn - The event handler that will be called
   */
  onClose(fn: CloseHandler): WebSocketFactory {
    if (this.state !== WebSocketState.DESTROYED) {
      this.handlers.close.push(fn);
    }
    return this;
  }

  /**
   * Sets up a listener for when the web socket is cleaned up and no longer in-use.
   * @param fn - The event handler that will be called
   */
  onDestroy(fn: DestroyHandler): WebSocketFactory {
    if (this.state !== WebSocketState.DESTROYED) {
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
   *  Pauses the web socket event handlers from being invoked.
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Unpauses the web socket event handlers, messages will be flushed automatically.
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
   * Gets the current state of the web socket.
   */
  getState(): WebSocketState {
    return this.state;
  }

  /**
   * Returns the current buffer size.
   */
  bufferSize(): number {
    return this.messageBuffer.length;
  }

  /**
   * Cleans up the web socket instance and related internal data.
   */
  destroy(eventData?: unknown): void {
    consoleLogger.info(`destroying websocket: ${this.id}`);
    if (this.state === WebSocketState.DESTROYED) {
      return;
    }

    try {
      if (this.ws) {
        this.ws.close();
      }
    } catch (e) {
      consoleLogger.error('Error while close web socket socket', e);
    }

    window.clearInterval(this.flushCanceler);
    window.clearTimeout(this.connectionAttempt);

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws = null;
    }

    try {
      this.triggerEvent('destroy', eventData);
    } catch (e) {
      consoleLogger.error('Error while trigger destroy event for web socket', e);
    }

    this.state = WebSocketState.DESTROYED;

    this.messageBuffer = [];
  }

  /**
   * Send a message through the web socket to the server.
   * @param data - String like data for the server to consume
   */
  send(data: Parameters<typeof WebSocket.prototype.send>[0]): void {
    this.ws?.send(data);
  }
}
