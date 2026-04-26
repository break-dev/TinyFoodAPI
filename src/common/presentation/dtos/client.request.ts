export interface ClientRequest<T = any> {
  token?: string;
  event: string;
  body: T;
}
