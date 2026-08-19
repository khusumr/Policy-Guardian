from typing import List


def build_policy_prompt(
    company_name: str,
    policy_type: str,
    tone: str,
    requirements: List[str],
    title: str | None = None,
) -> str:
    requirements_text = "\n".join(
        f"- {requirement}" for requirement in requirements
    )

    # "Custom Section" isn't itself a topic — it's just the category for
    # anything that doesn't fit the predefined policy types. Without a
    # real subject, the AI has nothing concrete to write about (it would
    # otherwise be told to write a "Custom Section policy", which means
    # nothing). The caller-supplied title is the actual subject in that
    # case; for predefined types, policy_type already is the subject.
    subject = title if (policy_type == "Custom Section" and title) else policy_type

    prompt = f"""
You are an experienced HR policy writer.

Create a complete {tone.lower()} policy titled "{subject}" for {company_name}.

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