output "aws_account_id" {
  description = "AWS account Terraform is authenticated against."
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "AWS region Terraform is operating in."
  value       = data.aws_region.current.region
}

output "vpc_id" {
  description = "Convertix development VPC ID."
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs."
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs."
  value       = module.networking.private_subnet_ids
}