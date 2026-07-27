export interface iSearchAssetsRequest {
  pageSize: number;
  nextPageToken?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  keyword?: string;
}
