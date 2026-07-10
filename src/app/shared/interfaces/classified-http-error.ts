import { HttpErrorKind } from '@shared/types/http-error-kind';

export interface iClassifiedHttpError {
  kind: HttpErrorKind;
  status: number;
  message: string;
  correlationId: string | null;
  validationErrors: Record<string, string[]> | null;
}
