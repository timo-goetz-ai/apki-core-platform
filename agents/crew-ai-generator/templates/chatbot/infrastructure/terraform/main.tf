terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "networking" {
  source       = "./modules/networking"
  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
}

module "compute" {
  source          = "./modules/compute"
  project_name    = var.project_name
  environment     = var.environment
  container_image = var.container_image
  container_port  = 8501
  vpc_id          = module.networking.vpc_id
  subnet_ids      = module.networking.private_subnets
}

module "database" {
  source            = "./modules/database"
  project_name      = var.project_name
  environment       = var.environment
  db_engine         = "postgres"
  db_version        = "15"
  allocated_storage = var.db_storage
}
