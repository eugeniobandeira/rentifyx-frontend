import { AssetStatus } from '../types/asset-status';

export interface iGetAssetByIdResponse {
  id: string;
  title: string;
  description: string;
  price: number;
  categoryId: string;
  ownerId: string;
  status: AssetStatus;
  createdAt: string;
}
