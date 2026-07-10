import { iAuditLogEntryRecord } from './audit-log-entry-record';

export interface iDataExportResponse {
  id: string;
  email: string;
  taxId: string;
  role: string;
  status: string;
  createdAt: string;
  consentGivenAt: string | null;
  auditHistory: iAuditLogEntryRecord[];
}
