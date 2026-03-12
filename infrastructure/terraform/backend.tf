terraform {
  backend "s3" {
    bucket = "tf-state-automation-stack"
    key    = "terraform.tfstate"

    # Hetzner Object Storage (S3-kompatibel, Standort Falkenstein)
    endpoint = "https://fsn1.your-objectstorage.com"
    region   = "us-east-1" # Pflichtfeld fuer S3-Backend, Wert wird ignoriert

    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    force_path_style            = true

    # Credentials via Umgebungsvariablen setzen (NICHT in dieser Datei):
    # export AWS_ACCESS_KEY_ID=<hetzner-object-storage-access-key>
    # export AWS_SECRET_ACCESS_KEY=<hetzner-object-storage-secret-key>
  }
}
