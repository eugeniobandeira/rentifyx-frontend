// Numeric, unlike identity-api's UserStatus/UserRole (string unions) - asset-registry-api has no
// JsonStringEnumConverter configured, so AssetStatus serializes over HTTP as its raw enum ordinal.
// Values must match RentifyxAssetRegistry.Domain.Enums.AssetStatus exactly (Draft=0 .. Archived=4).
export enum AssetStatus {
  Draft = 0,
  PendingModeration = 1,
  Active = 2,
  Suspended = 3,
  Archived = 4,
}
