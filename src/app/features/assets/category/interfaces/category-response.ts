export interface iCategoryResponse {
  id: string;
  name: string;
  parentCategoryId: string | null;
  depth: number;
}
