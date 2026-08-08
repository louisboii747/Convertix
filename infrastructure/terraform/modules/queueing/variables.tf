variable "queue_name" {
  description = "Name of the main Convertix conversion jobs queue."
  type        = string
}

variable "dlq_name" {
  description = "Name of the Convertix dead-letter queue."
  type        = string
}

variable "max_receive_count" {
  description = "Number of failed receives before a message is moved to the DLQ."
  type        = number
  default     = 3
}

variable "tags" {
  description = "Tags applied to SQS resources."
  type        = map(string)
  default     = {}
}