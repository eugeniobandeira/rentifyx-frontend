export interface ApiErrorResponse {
  title: string;
  status: number;
  extensions: { correlationId: string | null };
}
