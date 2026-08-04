from typing import List


def build_policy_prompt(
    company_name: str,
    policy_type: str,
    tone: str,
    requirements: List[str],
) -> str:
    requirements_text = "\n".join(
        f"- {requirement}" for requirement in requirements
    )

    prompt = f"""
You are an experienced HR policy writer.

Create a complete {tone.lower()} {policy_type} policy for {company_name}.

Organization requirements:
{requirements_text}

Include these sections:
1. Policy title
2. Purpose
3. Scope
4. Eligibility
5. Policy guidelines
6. Employee responsibilities
7. Manager responsibilities
8. Compliance
9. Review and approval

Write clearly and professionally.
Return only the completed policy document.
"""

    return prompt.strip()