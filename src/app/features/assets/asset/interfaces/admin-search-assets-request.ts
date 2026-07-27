import { AssetStatus } from '../types/asset-status';

export interface iAdminSearchAssetsRequest {
  pageSize: number;
  status: AssetStatus;
  nextPageToken?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  keyword?: string;
}
