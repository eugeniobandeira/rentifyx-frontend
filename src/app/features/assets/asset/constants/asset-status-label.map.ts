import { AssetStatus } from '../types/asset-status';

const LABELS: Record<AssetStatus, string> = {
  [AssetStatus.Draft]: 'Rascunho',
  [AssetStatus.PendingModeration]: 'Em moderação',
  [AssetStatus.Active]: 'Disponível',
  [AssetStatus.Suspended]: 'Suspenso',
  [AssetStatus.Archived]: 'Arquivado',
};

export function getAssetStatusLabel(status: AssetStatus): string {
  return LABELS[status] ?? 'Desconhecido';
}
