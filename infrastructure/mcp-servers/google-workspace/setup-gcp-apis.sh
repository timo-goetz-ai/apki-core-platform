#!/bin/bash
# ============================================================
# Google Workspace MCP Server - API Setup Script
# Run this ONCE to enable all required APIs in your GCP project
# ============================================================

set -e

# --- Configuration ---
PROJECT_ID="${GOOGLE_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"

if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: No project ID. Set GOOGLE_PROJECT_ID or run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "=== Enabling APIs for project: $PROJECT_ID ==="
echo ""

# All required APIs
APIS=(
  "drive.googleapis.com"
  "sheets.googleapis.com"
  "calendar-json.googleapis.com"
  "slides.googleapis.com"
  "forms.googleapis.com"
  "iam.googleapis.com"
  "cloudresourcemanager.googleapis.com"
  "serviceusage.googleapis.com"
  "admin.googleapis.com"
)

for api in "${APIS[@]}"; do
  echo "Enabling $api..."
  gcloud services enable "$api" --project="$PROJECT_ID" 2>/dev/null && \
    echo "  ✓ $api enabled" || \
    echo "  ⚠ $api may already be enabled or requires billing"
done

echo ""
echo "=== API Setup Complete ==="
echo ""
echo "=== NEXT STEPS ==="
echo ""
echo "1. CREATE SERVICE ACCOUNT (if not already done):"
echo "   gcloud iam service-accounts create workspace-mcp \\"
echo "     --display-name='Workspace MCP Server' \\"
echo "     --project=$PROJECT_ID"
echo ""
echo "2. CREATE KEY FILE:"
echo "   gcloud iam service-accounts keys create service-account-key.json \\"
echo "     --iam-account=workspace-mcp@$PROJECT_ID.iam.gserviceaccount.com"
echo ""
echo "3. GRANT ROLES:"
echo "   gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "     --member='serviceAccount:workspace-mcp@$PROJECT_ID.iam.gserviceaccount.com' \\"
echo "     --role='roles/iam.serviceAccountAdmin'"
echo ""
echo "   gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "     --member='serviceAccount:workspace-mcp@$PROJECT_ID.iam.gserviceaccount.com' \\"
echo "     --role='roles/resourcemanager.projectIamAdmin'"
echo ""
echo "4. DOMAIN-WIDE DELEGATION (CRITICAL for Workspace APIs):"
echo "   Go to: https://admin.google.com/ac/owl/domainwidedelegation"
echo "   Add the service account client ID with these scopes:"
echo "   https://www.googleapis.com/auth/drive,"
echo "   https://www.googleapis.com/auth/spreadsheets,"
echo "   https://www.googleapis.com/auth/calendar,"
echo "   https://www.googleapis.com/auth/presentations,"
echo "   https://www.googleapis.com/auth/forms.body,"
echo "   https://www.googleapis.com/auth/forms.responses.readonly,"
echo "   https://www.googleapis.com/auth/cloud-platform,"
echo "   https://www.googleapis.com/auth/iam"
echo ""
echo "5. PLACE KEY FILE:"
echo "   Copy service-account-key.json to this project root"
echo ""
echo "6. CONFIGURE .env:"
echo "   cp .env.example .env"
echo "   Edit .env with your values"
echo ""
