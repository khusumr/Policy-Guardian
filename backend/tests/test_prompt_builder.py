import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from prompt_builder import build_policy_prompt


def test_predefined_policy_type_uses_policy_type_as_subject():
    prompt = build_policy_prompt(
        company_name="Acme Corp",
        policy_type="Security Policy",
        tone="Professional",
        requirements=["Use MFA."],
    )

    assert 'titled "Security Policy"' in prompt


def test_custom_section_uses_title_as_subject():
    prompt = build_policy_prompt(
        company_name="Acme Corp",
        policy_type="Custom Section",
        tone="Professional",
        requirements=["No pets in the server room."],
        title="Office Pet Policy",
    )

    assert 'titled "Office Pet Policy"' in prompt
    assert "Custom Section" not in prompt


def test_custom_section_without_title_falls_back_to_policy_type():
    # main.py's PolicyRequest validation should prevent this in practice,
    # but the prompt builder itself shouldn't produce something worse than
    # the pre-fix behavior if it's ever called without a title.
    prompt = build_policy_prompt(
        company_name="Acme Corp",
        policy_type="Custom Section",
        tone="Professional",
        requirements=["Something."],
    )

    assert 'titled "Custom Section"' in prompt
