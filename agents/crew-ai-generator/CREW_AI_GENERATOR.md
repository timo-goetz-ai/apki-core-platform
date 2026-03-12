CREW\_AI\_GENERATOR  
\`\`\`  
crew-ai-generator/  
├── README.md  
├── setup.py  
├── requirements.txt  
│  
├── generator/  
│   ├── \_\_init\_\_.py  
│   ├── cli.py                 \# Haupteinstiegspunkt  
│   ├── core.py                \# Generator-Logik  
│   └── utils.py               \# Hilfsfunktionen  
│  
├── templates/  
│   ├── chatbot/  
│   │   ├── streamlit/  
│   │   │   ├── streamlit\_app.py  
│   │   │   ├── agents.py  
│   │   │   ├── tasks.py  
│   │   │   ├── tools.py  
│   │   │   └── config.py  
│   │   ├── infrastructure/  
│   │   │   ├── terraform/  
│   │   │   │   ├── main.tf  
│   │   │   │   ├── variables.tf  
│   │   │   │   ├── outputs.tf  
│   │   │   │   └── terraform.tfvars  
│   │   │   ├── kubernetes/  
│   │   │   │   ├── deployment.yaml  
│   │   │   │   ├── service.yaml  
│   │   │   │   ├── configmap.yaml  
│   │   │   │   └── ingress.yaml  
│   │   │   ├── docker/  
│   │   │   │   ├── Dockerfile  
│   │   │   │   └── .dockerignore  
│   │   │   └── .github/  
│   │   │       └── workflows/  
│   │   │           ├── build.yml  
│   │   │           └── deploy.yml  
│   │   └── metadata.json  
│   │  
│   ├── admin\_dashboard/  
│   │   ├── streamlit/  
│   │   ├── infrastructure/  
│   │   │   ├── terraform/  
│   │   │   ├── kubernetes/  
│   │   │   ├── docker/  
│   │   │   └── .github/  
│   │   └── metadata.json  
│   │  
│   ├── repository/  
│   │   ├── streamlit/  
│   │   ├── infrastructure/  
│   │   │   ├── terraform/  
│   │   │   ├── kubernetes/  
│   │   │   ├── docker/  
│   │   │   └── .github/  
│   │   └── metadata.json  
│   │  
│   └── base/                  \# Shared Base-Template  
│       ├── .env.example  
│       ├── .gitignore  
│       ├── pyproject.toml  
│       ├── Makefile  
│       └── docker-compose.yml  
│  
├── scripts/  
│   ├── setup.sh  
│   ├── validate.sh  
│   └── init\_project.sh  
│  
├── tests/  
│   ├── \_\_init\_\_.py  
│   ├── test\_generator.py  
│   ├── test\_cli.py  
│   └── fixtures/  
│       └── expected\_output/  
│  
└── docs/  
    ├── README.md  
    ├── quickstart.md  
    ├── templates.md  
    ├── terraform.md  
    ├── kubernetes.md  
    └── examples/  
\`\`\`

\*\*Detaillierte Template-Struktur für einen Projekttyp (chatbot):\*\*

\`\`\`  
templates/chatbot/  
├── metadata.json  
├── streamlit/  
│   ├── streamlit\_app.py  
│   ├── agents.py  
│   ├── tasks.py  
│   ├── tools.py  
│   ├── config.py  
│   ├── .streamlit/  
│   │   └── config.toml  
│   └── pages/  
│       ├── settings.py  
│       └── analytics.py  
│  
├── infrastructure/  
│   ├── terraform/  
│   │   ├── main.tf              \# Provider, VPC, RDS  
│   │   ├── variables.tf         \# Input-Variablen  
│   │   ├── outputs.tf           \# Outputs  
│   │   ├── terraform.tfvars     \# Default Values  
│   │   ├── modules/  
│   │   │   ├── networking/  
│   │   │   │   ├── main.tf  
│   │   │   │   └── variables.tf  
│   │   │   ├── compute/  
│   │   │   │   ├── main.tf  
│   │   │   │   └── variables.tf  
│   │   │   └── database/  
│   │   │       ├── main.tf  
│   │   │       └── variables.tf  
│   │   └── environments/  
│   │       ├── dev.tfvars  
│   │       ├── staging.tfvars  
│   │       └── prod.tfvars  
│   │  
│   ├── kubernetes/  
│   │   ├── deployment.yaml      \# Streamlit Deployment  
│   │   ├── service.yaml         \# Service  
│   │   ├── ingress.yaml         \# Ingress  
│   │   ├── configmap.yaml       \# Config  
│   │   ├── secret.yaml          \# Secrets (template)  
│   │   ├── hpa.yaml             \# Horizontal Pod Autoscaler  
│   │   ├── pvc.yaml             \# Persistent Volume Claims  
│   │   ├── namespace.yaml       \# Namespace  
│   │   └── kustomization.yaml   \# Kustomize  
│   │  
│   ├── docker/  
│   │   ├── Dockerfile  
│   │   ├── .dockerignore  
│   │   └── entrypoint.sh  
│   │  
│   └── .github/  
│       └── workflows/  
│           ├── build.yml        \# Build & Push to Registry  
│           ├── deploy-dev.yml   \# Deploy to Dev  
│           └── deploy-prod.yml  \# Deploy to Prod  
│  
├── docs/  
│   ├── README.md  
│   ├── architecture.md  
│   ├── deployment.md  
│   └── configuration.md  
│  
└── scripts/  
    ├── setup.sh  
    ├── build.sh  
    └── deploy.sh  
\`\`\`

\*\*Beispiel: metadata.json\*\*

\`\`\`json  
{  
  "name": "chatbot",  
  "version": "1.0.0",  
  "description": "Streamlit Chatbot mit Crew AI, Terraform & Kubernetes",  
  "components": {  
    "streamlit": {  
      "enabled": true,  
      "version": "1.28.0",  
      "python\_version": "3.11"  
    },  
    "terraform": {  
      "enabled": true,  
      "version": "1.5.0",  
      "cloud\_providers": \["aws", "gcp", "azure"\]  
    },  
    "kubernetes": {  
      "enabled": true,  
      "version": "1.27"  
    },  
    "docker": {  
      "enabled": true,  
      "registry": "docker.io"  
    },  
    "cicd": {  
      "enabled": true,  
      "provider": "github-actions"  
    }  
  },  
  "variables": {  
    "project\_name": "string",  
    "environment": "enum:dev,staging,prod",  
    "region": "string",  
    "enable\_monitoring": "boolean"  
  }  
}  
\`\`\`

\*\*Beispiel: Terraform Template (\*\*\[\*\*main.tf\*\*\](http://main.tf)\*\*)\*\*

\`\`\`hcl  
\# templates/chatbot/infrastructure/terraform/main.tf

terraform {  
  required\_version \= "\>= 1.5"  
  required\_providers {  
    aws \= {  
      source  \= "hashicorp/aws"  
      version \= "\~\> 5.0"  
    }  
  }  
}

provider "aws" {  
  region \= var.aws\_region  
}

\# Networking  
module "networking" {  
  source \= "./modules/networking"  
    
  project\_name \= var.project\_name  
  environment  \= var.environment  
  vpc\_cidr     \= var.vpc\_cidr  
}

\# Compute (ECS für Streamlit)  
module "compute" {  
  source \= "./modules/compute"  
    
  project\_name       \= var.project\_name  
  environment        \= var.environment  
  container\_image    \= var.container\_image  
  container\_port     \= 8501  
  vpc\_id             \= module.networking.vpc\_id  
  subnet\_ids         \= module.networking.private\_subnets  
}

\# Database  
module "database" {  
  source \= "./modules/database"  
    
  project\_name       \= var.project\_name  
  environment        \= var.environment  
  db\_engine          \= "postgres"  
  db\_version         \= "15"  
  allocated\_storage  \= var.db\_storage  
}  
\`\`\`

\*\*Beispiel: Kubernetes Deployment (deployment.yaml)\*\*

\`\`\`yaml  
\# templates/chatbot/infrastructure/kubernetes/deployment.yaml

apiVersion: apps/v1  
kind: Deployment  
metadata:  
  name: {{ .Values.projectName }}-streamlit  
  namespace: {{ .Values.namespace }}  
  labels:  
    app: {{ .Values.projectName }}  
    version: "1.0"  
spec:  
  replicas: {{ .Values.replicas }}  
  selector:  
    matchLabels:  
      app: {{ .Values.projectName }}  
  template:  
    metadata:  
      labels:  
        app: {{ .Values.projectName }}  
    spec:  
      containers:  
      \- name: streamlit  
        image: {{ .Values.image.repository }}:{{ .Values.image.tag }}  
        ports:  
        \- containerPort: 8501  
          name: http  
        env:  
        \- name: PROJECT\_NAME  
          valueFrom:  
            configMapKeyRef:  
              name: {{ .Values.projectName }}-config  
              key: project\_name  
        \- name: ENVIRONMENT  
          value: {{ .Values.environment }}  
        resources:  
          requests:  
            memory: "256Mi"  
            cpu: "250m"  
          limits:  
            memory: "512Mi"  
            cpu: "500m"  
        livenessProbe:  
          httpGet:  
            path: /\_stcore/health  
            port: 8501  
          initialDelaySeconds: 30  
          periodSeconds: 10  
        readinessProbe:  
          httpGet:  
            path: /\_stcore/health  
            port: 8501  
          initialDelaySeconds: 5  
          periodSeconds: 5  
\`\`\`

\*\*Beispiel: Docker Template (Dockerfile)\*\*

\`\`\`dockerfile  
\# templates/chatbot/infrastructure/docker/Dockerfile

FROM python:3.11-slim

WORKDIR /app

\# Dependencies installieren  
COPY requirements.txt .  
RUN pip install \--no-cache-dir \-r requirements.txt

\# App kopieren  
COPY streamlit/ .

\# Streamlit Port  
EXPOSE 8501

\# Health Check  
HEALTHCHECK CMD curl \--fail http://localhost:8501/\_stcore/health || exit 1

\# Entrypoint  
COPY infrastructure/docker/entrypoint.sh .  
RUN chmod \+x entrypoint.sh

ENTRYPOINT \["./entrypoint.sh"\]  
\`\`\`

\*\*Generator-Logik (\*\*\[\*\*core.py\*\*\](http://core.py)\*\*)\*\*

\`\`\`python  
\# generator/core.py

from pathlib import Path  
import shutil  
import json  
from jinja2 import Environment, FileSystemLoader

class ProjectGenerator:  
    def \_\_init\_\_(self, templates\_dir="templates"):  
        self.templates\_dir \= Path(templates\_dir)  
        self.env \= Environment(loader=FileSystemLoader(self.templates\_dir))  
      
    def generate(self, project\_name, template\_type, \*\*variables):  
        """Generiert ein komplettes Projekt"""  
          
        template\_path \= self.templates\_dir / template\_type  
        if not template\_path.exists():  
            raise ValueError(f"Template {template\_type} nicht gefunden")  
          
        project\_dir \= Path(project\_name)  
        project\_dir.mkdir(parents=True, exist\_ok=True)  
          
        \# Alle Dateien kopieren & mit Variablen rendern  
        for src\_file in template\_path.rglob("\*"):  
            if src\_file.is\_file() and not src\_file.name.startswith("."):  
                rel\_path \= src\_file.relative\_to(template\_path)  
                dst\_file \= project\_dir / rel\_path  
                  
                dst\_file.parent.mkdir(parents=True, exist\_ok=True)  
                  
                \# Jinja2 Template rendern  
                template \= self.env.get\_template(str(rel\_path))  
                rendered \= template.render(\*\*variables)  
                dst\_file.write\_text(rendered)  
          
        print(f"✅ Projekt '{project\_name}' erstellt\!")  
\`\`\`

Das ist eine \*\*Production-ready Struktur\*\*, die:  
\- ✅ Skalierbar ist (neue Templates einfach hinzufügen)  
\- ✅ Terraform, Kubernetes & Docker unterstützt  
\- ✅ Multi-Environment möglich (dev/staging/prod)  
\- ✅ Template-Variablen nutzt (Jinja2)  
\- ✅ Vollständig versionierbar ist

Brauchst du noch Beispiele für spezifische Terraform-Module oder Kubernetes-Configs?  
