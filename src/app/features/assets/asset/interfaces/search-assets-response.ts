import { iAssetSummaryResponse } from './asset-summary-response';

export interface iSearchAssetsResponse {
  items: iAssetSummaryResponse[];
  nextPageToken: string | null;
}
