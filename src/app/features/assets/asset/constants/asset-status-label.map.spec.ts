import { getAssetStatusLabel } from './asset-status-label.map';
import { AssetStatus } from '../types/asset-status';

describe('getAssetStatusLabel', () => {
  it('maps every AssetStatus value to a Portuguese label', () => {
    expect(getAssetStatusLabel(AssetStatus.Draft)).toBe('Rascunho');
    expect(getAssetStatusLabel(AssetStatus.PendingModeration)).toBe('Em moderação');
    expect(getAssetStatusLabel(AssetStatus.Active)).toBe('Disponível');
    expect(getAssetStatusLabel(AssetStatus.Suspended)).toBe('Suspenso');
    expect(getAssetStatusLabel(AssetStatus.Archived)).toBe('Arquivado');
  });
});
