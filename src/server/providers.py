"""Provider interface for the runtime LLM (A2/A4 in docs/ai-design.md).

Swapping providers means adding a class here and pointing LLM_PROVIDER at it;
app.py and the prompt/grounding logic never change.
"""

from __future__ import annotations

import os
from abc import ABC, abstractmethod


class Provider(ABC):
    @abstractmethod
    def complete(self, system: str, user: str) -> str:
        """Return the model's plain-text reply, or raise on failure."""


class ClaudeProvider(Provider):
    def __init__(self) -> None:
        import anthropic  # imported lazily so a missing package only breaks this provider

        self._client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from the environment
        self._model = os.environ.get("LLM_MODEL") or "claude-opus-5"

    def complete(self, system: str, user: str) -> str:
        response = self._client.messages.create(
            model=self._model,
            max_tokens=600,
            system=system,
            output_config={"effort": "low"},  # short, grounded rewrite of numbers already computed
            messages=[{"role": "user", "content": user}],
        )
        for block in response.content:
            if block.type == "text":
                return block.text
        return ""


class GroqProvider(Provider):
    def __init__(self) -> None:
        import groq  # imported lazily so a missing package only breaks this provider

        self._client = groq.Groq()  # reads GROQ_API_KEY from the environment
        # Groq's free-tier model lineup changes often (llama-3.3-70b-versatile, current as of
        # this file's own comments a moment ago, is already gone). Check console.groq.com or
        # GET /openai/v1/models for what your key can actually reach, and override with LLM_MODEL.
        self._model = os.environ.get("LLM_MODEL") or "openai/gpt-oss-120b"

    def complete(self, system: str, user: str) -> str:
        response = self._client.chat.completions.create(
            model=self._model,
            max_tokens=600,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        return response.choices[0].message.content or ""


_PROVIDERS = {"claude": ClaudeProvider, "groq": GroqProvider}

# The env var each provider's API key lives in, so app.py can report /api/health
# and a clear "not set" error without hardcoding one provider's variable name.
REQUIRED_ENV_VAR = {"claude": "ANTHROPIC_API_KEY", "groq": "GROQ_API_KEY"}


def active_provider_name() -> str:
    return (os.environ.get("LLM_PROVIDER") or "claude").lower()


def is_configured() -> bool:
    key = REQUIRED_ENV_VAR.get(active_provider_name())
    return bool(key and os.environ.get(key))


def get_provider(name: str | None = None) -> Provider:
    key = (name or active_provider_name()).lower()
    try:
        return _PROVIDERS[key]()
    except KeyError:
        raise ValueError(f"Unknown LLM_PROVIDER '{key}'; known providers: {', '.join(_PROVIDERS)}") from None
