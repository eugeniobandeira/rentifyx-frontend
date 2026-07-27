export interface iCreateAssetRequest {
  title: string;
  description: string;
  price: number;
  categoryId: string;
  idempotencyKey: string;
}
