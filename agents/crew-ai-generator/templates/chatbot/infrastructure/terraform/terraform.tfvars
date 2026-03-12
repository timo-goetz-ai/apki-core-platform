project_name    = "{{ project_name | default('chatbot') }}"
environment     = "{{ environment | default('dev') }}"
aws_region      = "{{ aws_region | default('eu-central-1') }}"
container_image = "docker.io/library/{{ project_name | default('chatbot') }}:latest"
