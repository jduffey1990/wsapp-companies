# backend.tf
# Configuration for Terraform state storage

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Store state in S3 for team collaboration
  # Comment this out for first run if bucket doesn't exist yet
  backend "s3" {
    bucket         = "brandora-terraform-state"
    key            = "microservices/companies/terraform.tfstate"
    region         = "us-east-2"
    encrypt        = true
    dynamodb_table = "brandora-terraform-locks"
  }
}
