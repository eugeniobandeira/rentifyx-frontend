import { AssetStatus } from '../types/asset-status';

const KEYS: Record<AssetStatus, string> = {
  [AssetStatus.Draft]: 'detail.status.draft',
  [AssetStatus.PendingModeration]: 'detail.status.pendingModeration',
  [AssetStatus.Active]: 'detail.status.active',
  [AssetStatus.Suspended]: 'detail.status.suspended',
  [AssetStatus.Archived]: 'detail.status.archived',
};

export function getAssetStatusLabelKey(status: AssetStatus): string {
  return KEYS[status] ?? 'detail.status.unknown';
}
