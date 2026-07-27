terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Empty on purpose: values supplied via -backend-config flags at `terraform
  # init` time (bucket=rentifyx-tfstate-166613156216,
  # key=frontend/terraform.tfstate, region=us-east-1,
  # dynamodb_table=rentifyx-tflock), matching the other RentifyX repos'
  # convention.
  backend "s3" {}
}
