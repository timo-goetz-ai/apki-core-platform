resource "aws_db_instance" "this" {
  identifier          = "${var.project_name}-${var.environment}-db"
  engine              = var.db_engine
  engine_version      = var.db_version
  allocated_storage   = var.allocated_storage
  instance_class      = "db.t3.micro"
  username            = "app"
  password            = "change-me-now"
  skip_final_snapshot = true
}
