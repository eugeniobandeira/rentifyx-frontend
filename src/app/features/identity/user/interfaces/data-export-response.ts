import { AuditLogEntryRecord } from './audit-log-entry-record';

export interface DataExportResponse {
  id: string;
  email: string;
  taxId: string;
  role: string;
  status: string;
  createdAt: string;
  consentGivenAt: string | null;
  auditHistory: AuditLogEntryRecord[];
}
