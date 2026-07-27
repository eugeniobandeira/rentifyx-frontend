output "ec2_public_ip" {
  value = module.ec2.public_ip
}

output "ec2_public_dns" {
  value = module.ec2.public_dns
}

output "ecr_repository_url" {
  value = module.ec2.ecr_repository_url
}
