export interface ValidationErrorResponse {
  title: string;
  status: 422;
  errors: Record<string, string[]>;
  extensions: { correlationId: string | null };
}
