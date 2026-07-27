import { AssetStatus } from '../types/asset-status';

export interface iAssetModerationResponse {
  assetId: string;
  status: AssetStatus;
}
