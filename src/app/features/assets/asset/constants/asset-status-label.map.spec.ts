import { getAssetStatusLabelKey } from './asset-status-label.map';
import { AssetStatus } from '../types/asset-status';

describe('getAssetStatusLabelKey', () => {
  it('maps every AssetStatus value to a translation key', () => {
    expect(getAssetStatusLabelKey(AssetStatus.Draft)).toBe('detail.status.draft');
    expect(getAssetStatusLabelKey(AssetStatus.PendingModeration)).toBe('detail.status.pendingModeration');
    expect(getAssetStatusLabelKey(AssetStatus.Active)).toBe('detail.status.active');
    expect(getAssetStatusLabelKey(AssetStatus.Suspended)).toBe('detail.status.suspended');
    expect(getAssetStatusLabelKey(AssetStatus.Archived)).toBe('detail.status.archived');
  });
});
