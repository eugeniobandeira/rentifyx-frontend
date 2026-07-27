import { AssetStatus } from '../types/asset-status';

export interface iAssetSummaryResponse {
  id: string;
  title: string;
  price: number;
  categoryId: string;
  status: AssetStatus;
}
