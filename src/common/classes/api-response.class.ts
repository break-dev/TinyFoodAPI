export class ApiResponse<T = unknown> {
  constructor(
    public success: boolean,
    public data: T | null,
    public message: string | string[] | null = null,
  ) {}

  static success<T>(data: T, message: string | null = null): ApiResponse<T> {
    return new ApiResponse(true, data, message);
  }

  static error(message: string | string[]): ApiResponse<null> {
    return new ApiResponse(false, null, message);
  }
}
