variable "project_name" { type = string }
variable "environment" { type = string }
variable "aws_region" { type = string }
variable "vpc_cidr" {
	type    = string
	default = "10.0.0.0/16"
}
variable "container_image" {
	type    = string
	default = "docker.io/library/chatbot:latest"
}

variable "db_storage" {
	type    = number
	default = 20
}
