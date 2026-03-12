from generator.core import ProjectGenerator


def test_list_templates_not_empty():
    g = ProjectGenerator(templates_dir="templates")
    assert "chatbot" in g.list_templates()
