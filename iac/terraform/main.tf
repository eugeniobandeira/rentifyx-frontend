locals {
  prefix = "${var.app_name}-frontend-${var.environment}"

  common_tags = {
    Application = var.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

provider "aws" {
  region  = var.aws_region
  profile = "rentifyx-admin"

  default_tags {
    tags = local.common_tags
  }
}

data "aws_caller_identity" "main" {}

# Cross-repo, read-only: rentifyx-platform owns the shared VPC/subnets - this
# repo doesn't provision its own networking, same pattern every other
# RentifyX app repo uses.
data "terraform_remote_state" "platform" {
  backend = "s3"

  config = {
    bucket = "rentifyx-tfstate-166613156216"
    key    = "platform/terraform.tfstate"
    region = "us-east-1"
  }
}

module "ec2" {
  source = "./modules/ec2"

  prefix       = local.prefix
  environment  = var.environment
  aws_region   = var.aws_region
  ssh_key_name = var.ssh_key_name
  vpc_id       = data.terraform_remote_state.platform.outputs.vpc_id
  subnet_id    = data.terraform_remote_state.platform.outputs.public_subnets[0]
}
