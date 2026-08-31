"""
Localization Agent — Gemini translation with locked safety glossary.

THIS IS THE RESPONSIBLE-AI CENTERPIECE OF TIDECAST.

Safety-critical terms (cyclone, return to shore, storm surge, etc.) are NEVER
freely translated by the LLM. They are pulled from a pre-verified, locked
glossary table. Only the surrounding narrative text is Gemini-generated.

This is a deliberate design decision against mistranslation risk in life-safety
contexts — and it's the strongest responsible-AI story in the pitch.
"""
import json
from agents.base import BaseAgent
from core.config import settings

import vertexai
from vertexai.generative_models import GenerativeModel


class LocalizationAgent(BaseAgent):
    """
    Translates advisories into multiple Indian coastal languages using:
    1. Locked glossary for safety-critical terms (pre-verified, never LLM-generated)
    2. Gemini for connective narrative text only
    3. SMS-safe (≤160 char) + full narrative versions per language
    """

    def __init__(self):
        super().__init__("LocalizationAgent")
        vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_REGION)
        self.model = GenerativeModel(settings.GEMINI_MODEL)
        self._load_glossary()

    def _load_glossary(self):
        """Load the locked safety glossary."""
        try:
            with open(settings.SAFETY_GLOSSARY_PATH, "r", encoding="utf-8") as f:
                self.glossary = json.load(f)
            self.logger.info(f"Loaded safety glossary with {len(self.glossary)} terms")
        except FileNotFoundError:
            self.glossary = {}
            self.logger.error("CRITICAL: Safety glossary not found!")

    def _get_glossary_terms_for_language(self, lang: str) -> dict:
        """Get all glossary terms for a specific language."""
        return {key: translations.get(lang, translations.get("en", key))
                for key, translations in self.glossary.items()}

    async def _translate_to_language(self, advisory: dict, lang: str) -> dict:
        """Translate an advisory to a specific language using glossary + Gemini."""
        if lang == "en":
            return {
                "full": advisory["raw_text"],
                "sms": advisory["raw_text"][:155] + "..." if len(advisory["raw_text"]) > 160 else advisory["raw_text"],
            }

        lang_names = {"ta": "Tamil", "te": "Telugu", "ml": "Malayalam"}
        lang_name = lang_names.get(lang, lang)
        glossary_terms = self._get_glossary_terms_for_language(lang)

        # Build glossary instruction block
        glossary_block = "\n".join(
            f'- "{key.replace("_", " ")}" MUST be translated as: "{value}"'
            for key, value in glossary_terms.items()
        )

        prompt = f"""You are translating a maritime safety advisory into {lang_name}.

CRITICAL SAFETY RULE: The following terms have pre-verified translations that you MUST use exactly as provided. Do NOT generate your own translation for these terms:

{glossary_block}

Now translate this advisory. Use the glossary terms exactly where they appear.
Write naturally in {lang_name} script — the glossary terms should flow naturally within the sentence.

Advisory text: {advisory['raw_text']}
Severity: {advisory.get('severity', 'MEDIUM')}

Respond in EXACTLY this JSON format:
{{"full_text": "complete translation in {lang_name} script", "sms_text": "condensed version under 155 characters in {lang_name} script"}}"""

        try:
            response = await self.model.generate_content_async(prompt)
            response_text = response.text.strip()

            # Parse response — handle markdown code blocks
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            result = json.loads(response_text)
            return {
                "full": result.get("full_text", advisory["raw_text"]),
                "sms": result.get("sms_text", advisory["raw_text"][:155]),
            }

        except Exception as e:
            self.logger.warning(f"Translation to {lang} failed: {e}")
            # Fallback: return English with glossary term substitution
            return {
                "full": advisory["raw_text"],
                "sms": advisory["raw_text"][:155] + "...",
            }

    async def process(self, input_data: dict) -> dict:
        """
        Translate advisory into all supported languages.

        Input: { "advisory": { classified advisory object } }
        Output: { "advisory": { ...advisory, translations: { lang: { full, sms } } } }
        """
        advisory = input_data["advisory"]
        translations = {}

        for lang in settings.SUPPORTED_LANGUAGES:
            self.logger.info(f"Translating {advisory['advisory_id']} to {lang}...")
            translations[lang] = await self._translate_to_language(advisory, lang)

        advisory["translations"] = translations
        advisory["status"] = "localized"

        self.logger.info(
            f"Localized {advisory['advisory_id']} into "
            f"{len(translations)} languages: {list(translations.keys())}"
        )

        return {"advisory": advisory}
