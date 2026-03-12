# Google Workspace MCP Server

MCP Server for Google Workspace + Cloud: **44 Tools** across Drive, Sheets, Calendar, Slides, Forms, IAM, and a natural language automation engine.

## Tools Overview

| Module | Tools | Capabilities |
|--------|-------|-------------|
| **Drive** | 9 | List, search, create folders, nested paths, move, upload, download, delete |
| **Sheets** | 7 | Create, read, write, append rows, clear, add tabs, get info |
| **Calendar** | 6 | List events, create, update, delete, get event, list calendars |
| **Slides** | 5 | Create presentation, add slides, add text, get info, export PPTX/PDF |
| **Forms** | 4 | Get form info, get responses, create form, add questions |
| **IAM** | 10 | Service accounts CRUD, roles, keys, enable APIs, list APIs, IAM policy |
| **Prompt Engine** | 3 | Natural language execute, plan mode, audit log |

## Setup (from zero)

### 1. Enable Google APIs

```bash
# Set your project
export GOOGLE_PROJECT_ID=tgai-core-prod

# Run the setup script
./setup-gcp-apis.sh
```

### 2. Create Service Account + Domain-Wide Delegation

```bash
# Create service account
gcloud iam service-accounts create workspace-mcp \
  --display-name="Workspace MCP Server" \
  --project=$GOOGLE_PROJECT_ID

# Create JSON key
gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=workspace-mcp@$GOOGLE_PROJECT_ID.iam.gserviceaccount.com

# Grant IAM admin role
gcloud projects add-iam-policy-binding $GOOGLE_PROJECT_ID \
  --member="serviceAccount:workspace-mcp@$GOOGLE_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountAdmin"

gcloud projects add-iam-policy-binding $GOOGLE_PROJECT_ID \
  --member="serviceAccount:workspace-mcp@$GOOGLE_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/resourcemanager.projectIamAdmin"
```

### 3. Domain-Wide Delegation (CRITICAL)

This is required for Workspace APIs (Drive, Sheets, Calendar, Slides, Forms).

1. Get the service account's **Client ID**:
   ```bash
   gcloud iam service-accounts describe \
     workspace-mcp@$GOOGLE_PROJECT_ID.iam.gserviceaccount.com \
     --format="value(uniqueId)"
   ```

2. Go to **Google Admin Console**:
   https://admin.google.com/ac/owl/domainwidedelegation

3. Click "Add new" and paste the Client ID

4. Add these scopes (comma-separated):
   ```
   https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/presentations,https://www.googleapis.com/auth/forms.body,https://www.googleapis.com/auth/forms.responses.readonly,https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/iam
   ```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
GOOGLE_DELEGATED_USER=your-email@your-domain.com
GOOGLE_PROJECT_ID=tgai-core-prod
ADMIN_EMAIL=your-email@your-domain.com
OPENAI_API_KEY=sk-...
DRY_RUN=false
```

### 5. Build & Test

```bash
npm install
npm run build
npm start   # starts MCP server on stdio
```

### 6. Register in Claude Code

Add to your Claude Code MCP settings (`~/.claude/settings.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "node",
      "args": ["/Users/zuhause_mit_ideen/DEV_ROOT/server-infra/03_INFRASTRUCTURE/google-workspace-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/Users/zuhause_mit_ideen/DEV_ROOT/server-infra/03_INFRASTRUCTURE/google-workspace-mcp-server/service-account-key.json",
        "GOOGLE_DELEGATED_USER": "your-email@your-domain.com",
        "GOOGLE_PROJECT_ID": "tgai-core-prod",
        "OPENAI_API_KEY": "sk-...",
        "DRY_RUN": "false"
      }
    }
  }
}
```

## Security

- **Destructive actions** (delete file, remove role, etc.) require `confirmed=true`
- **Dry-run mode**: Set `DRY_RUN=true` to log actions without executing
- **Audit log**: Every action is logged with timestamp, params, and result
- All actions go through `guardAction()` security check

## Natural Language Engine

The `prompt_execute` and `prompt_plan` tools use OpenAI to parse natural language into structured actions:

```
"Create a lead folder for Max Mustermann under 2026/High Ticket"
→ drive_create_nested_folders { path: "2026/High Ticket/Max Mustermann" }

"Add John Doe to the leads sheet"
→ sheets_append { values: [["John Doe", ...]] }

"Schedule a call with client tomorrow at 10am"
→ calendar_create_event { summary: "Call with client", start: "..." }
```

## Docker (Cloud Run)

```bash
docker build -t google-workspace-mcp .
docker run -e GOOGLE_APPLICATION_CREDENTIALS=/app/key.json \
  -v ./service-account-key.json:/app/key.json \
  google-workspace-mcp
```
