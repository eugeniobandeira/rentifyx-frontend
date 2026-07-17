import { iAuditLogEntryRecord } from './audit-log-entry-record';

export interface iDataExportResponse {
  id: string;
  email: string;
  taxId: string;
  role: string;
  status: string;
  createdAt: string;
  consentGivenAt: string | null;
  essentialConsentRevokedAt: string | null;
  marketingConsentGranted: boolean;
  marketingConsentGivenAt: string | null;
  marketingConsentRevokedAt: string | null;
  auditHistory: iAuditLogEntryRecord[];
}
