variable "project_name" { type = string }
variable "environment" { type = string }
variable "container_image" { type = string }
variable "container_port" { type = number }
variable "vpc_id" { type = string }
variable "subnet_ids" { type = list(string) }
