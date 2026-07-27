output "public_ip" {
  value = aws_instance.frontend.public_ip
}

output "public_dns" {
  value = aws_instance.frontend.public_dns
}

output "ecr_repository_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "ecr_repository_arn" {
  value = aws_ecr_repository.frontend.arn
}

output "instance_id" {
  value = aws_instance.frontend.id
}
