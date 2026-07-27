import { AssetStatus } from '../types/asset-status';

export interface iCreateAssetResponse {
  assetId: string;
  status: AssetStatus;
  createdAt: string;
}
