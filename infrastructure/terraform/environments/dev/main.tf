data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

module "storage" {
  source = "../../modules/storage"

  bucket_name = "convertix-dev-storage-537390611023-eu-west-2-an"

  tags = {
    Project     = "Convertix"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

module "queueing" {
  source = "../../modules/queueing"

  queue_name        = "convertix-dev-conversion-jobs"
  dlq_name          = "convertix-dev-conversion-jobs-dlq"
  max_receive_count = 3

  tags = {
    Project     = "Convertix"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}