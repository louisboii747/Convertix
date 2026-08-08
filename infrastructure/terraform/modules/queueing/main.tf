resource "aws_sqs_queue" "dlq" {
  name = var.dlq_name

  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true

  redrive_allow_policy = jsonencode({
    redrivePermission = "allowAll"
  })

  tags = var.tags
}

resource "aws_sqs_queue" "jobs" {
  name = var.queue_name

  visibility_timeout_seconds = 900
  message_retention_seconds  = 345600
  delay_seconds              = 0
  max_message_size           = 1048576
  receive_wait_time_seconds  = 20
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = var.tags
}