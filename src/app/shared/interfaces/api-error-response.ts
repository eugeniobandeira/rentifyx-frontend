export interface iApiErrorResponse {
  title: string;
  status: number;
  extensions: { correlationId: string | null };
}
