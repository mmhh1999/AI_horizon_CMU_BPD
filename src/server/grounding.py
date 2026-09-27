"""Number-grounding check from docs/ai-design.md: 'every number in the text must
appear in the input JSON (otherwise regenerate or use the template); no new facts.'
"""

import json
import re

_NUMBER = re.compile(r"-?\d[\d,]*\.?\d*")


def _numbers(text: str) -> set[str]:
    return {m.replace(",", "").rstrip(".") for m in _NUMBER.findall(text)}


def check(text: str, facts: dict) -> bool:
    """True if every number written in `text` also appears in `facts`."""
    allowed = _numbers(json.dumps(facts))
    return _numbers(text) <= allowed
