resource "aws_vpc" "this" {
  cidr_block = var.vpc_cidr
  tags = {
    Name = "${var.project_name}-${var.environment}-vpc"
  }
}
