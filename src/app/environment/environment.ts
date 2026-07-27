// Per-service base URLs — one absolute URL per backend, not a single shared apiUrl. See
// .specs/features/api-integration-plan/spec.md §4: asset-registry-api may end up deployed at a
// different host than identity-api, so a single string can't represent both once that happens.
export const environment = {
  production: false,
  identityApiUrl: 'http://ec2-18-230-74-182.sa-east-1.compute.amazonaws.com:8080/api/v1',
  assetRegistryApiUrl: 'http://ec2-54-20-59-67.sa-east-1.compute.amazonaws.com:8080/api/v1',
};
