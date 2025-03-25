import os
from jinja2 import Environment, FileSystemLoader

def load_jinja_template(template_name: str, **kwargs) -> str:
    """
    Loads and renders a Jinja2 template from the 'prompts' folder.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # Typically, your prompts folder might be up two levels: adjust as needed.
    # e.g.   project_root/prompts/extraction_prompt.jinja2
    # So we move up from .../src/utils/template_utils.py
    prompts_dir = os.path.normpath(os.path.join(base_dir, "..", "..", "prompts"))

    env = Environment(loader=FileSystemLoader(prompts_dir))
    template = env.get_template(template_name)
    return template.render(**kwargs)
