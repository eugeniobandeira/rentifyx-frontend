import { AssetStatus } from '../types/asset-status';

export interface iAdminAssetSummaryResponse {
  id: string;
  title: string;
  price: number;
  categoryId: string;
  ownerId: string;
  status: AssetStatus;
  createdAt: string;
}
