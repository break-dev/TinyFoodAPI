import { ApiResponse } from '../logic/dtos/api.response';

type Handler = (client: any, data: any) => Promise<ApiResponse>;

export class Dispatcher {
  private static privateHandlers = new Map<string, Handler>();
  private static publicHandlers = new Map<string, Handler>();

  /** Registra eventos privados (requiere auth) */
  static registerPrivate(
    eventOrHandlers: string | Record<string, Handler>,
    handler?: Handler,
  ) {
    if (typeof eventOrHandlers === 'string' && handler) {
      this.privateHandlers.set(eventOrHandlers, handler);
    } else if (typeof eventOrHandlers === 'object') {
      Object.entries(eventOrHandlers).forEach(([event, h]) => {
        this.privateHandlers.set(event, h);
      });
    }
  }

  /** Registra eventos públicos */
  static registerPublic(
    eventOrHandlers: string | Record<string, Handler>,
    handler?: Handler,
  ) {
    if (typeof eventOrHandlers === 'string' && handler) {
      this.publicHandlers.set(eventOrHandlers, handler);
    } else if (typeof eventOrHandlers === 'object') {
      Object.entries(eventOrHandlers).forEach(([event, h]) => {
        this.publicHandlers.set(event, h);
      });
    }
  }

  /** Despacha un evento privado */
  static async dispatchPrivate(event: string, client: any, data: any) {
    const handler = this.privateHandlers.get(event);
    if (!handler) return null;
    return handler(client, data);
  }

  /** Despacha un evento público */
  static async dispatchPublic(event: string, client: any, data: any) {
    const handler = this.publicHandlers.get(event);
    if (!handler) return null;
    return handler(client, data);
  }
}
