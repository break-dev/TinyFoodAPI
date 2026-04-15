export interface WsResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}

export interface WsRequest<T = any> {
  token?: string;
  event: string;
  body: T;
}
