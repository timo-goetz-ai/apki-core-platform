def build_tasks() -> list[dict]:
    return [
        {"name": "analyze_prompt", "agent": "researcher"},
        {"name": "draft_response", "agent": "writer"},
    ]
