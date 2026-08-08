variable "bucket_name" {
  description = "Name of the S3 bucket used for temporary Convertix storage."
  type        = string
}

variable "tags" {
  description = "Tags applied to storage resources."
  type        = map(string)
  default     = {}
}