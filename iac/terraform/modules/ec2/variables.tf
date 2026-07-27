variable "prefix" {
  description = "Resource name prefix"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "ssh_key_name" {
  description = "EC2 key pair name for SSH access (leave empty to disable SSH)"
  type        = string
  default     = ""
}

variable "vpc_id" {
  description = "VPC ID to provision the security group in - rentifyx-platform's VPC, read via terraform_remote_state"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID to provision the instance in - one of rentifyx-platform's public subnets"
  type        = string
}
