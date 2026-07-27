// Per-service base URLs — one absolute URL per backend, not a single shared apiUrl. See
// .specs/features/api-integration-plan/spec.md §4: asset-registry-api may end up deployed at a
// different host than identity-api, so a single string can't represent both once that happens.
export const environment = {
  production: false,
  identityApiUrl: 'http://ec2-56-125-145-238.sa-east-1.compute.amazonaws.com:8080/api/v1',
  // rentifyx-asset-registry-api has no real deployment yet (M6 IaC not applied) — placeholder
  // points at the same local mock server as identityApiUrl until a real host exists.
  assetRegistryApiUrl: 'http://ec2-56-125-145-238.sa-east-1.compute.amazonaws.com:8080/api/v1',
};
