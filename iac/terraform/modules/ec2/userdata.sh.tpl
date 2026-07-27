#!/bin/bash
set -euo pipefail

# Install Docker
dnf install -y docker
systemctl enable --now docker

# Explicit SSM Agent install - this AL2023 AMI resolution does not ship the
# agent pre-installed despite AWS's docs describing AL2023 as including it
# by default (confirmed 2026-07-25 in rentifyx-identity-api/communications-api/
# asset-registry-api). Do not assume it's present.
dnf install -y amazon-ssm-agent
systemctl enable --now amazon-ssm-agent

# Log in to ECR and pull the image
aws ecr get-login-password --region ${aws_region} \
  | docker login --username AWS --password-stdin ${ecr_repository_url}

docker pull ${ecr_repository_url}:latest

# Run the SSR server container (restarts automatically on failure or reboot)
# NG_ALLOWED_HOSTS=* - Angular 19+ SSR rejects requests whose Host header
# isn't on an explicit allowlist (SSRF protection). No fixed domain/CloudFront
# exists yet (only this EC2's own public IP), so there's nothing narrower to
# allow yet - same temporary posture already taken for CORS on the backend
# repos. Narrow to the real domain once one exists.
docker run -d \
  --name rentifyx-frontend \
  --restart unless-stopped \
  -p 4000:4000 \
  -e NODE_ENV=production \
  -e PORT=4000 \
  -e NG_ALLOWED_HOSTS=* \
  ${ecr_repository_url}:latest
