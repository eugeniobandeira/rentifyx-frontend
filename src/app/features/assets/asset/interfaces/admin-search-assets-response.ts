import { iAdminAssetSummaryResponse } from './admin-asset-summary-response';

export interface iAdminSearchAssetsResponse {
  items: iAdminAssetSummaryResponse[];
  nextPageToken: string | null;
}
