"""Risk Classification Agent — uses Gemini to classify advisory severity."""
from agents.base import BaseAgent
from core.config import settings

import vertexai
from vertexai.generative_models import GenerativeModel


class ClassificationAgent(BaseAgent):
    """
    Takes a normalized advisory and classifies its severity using Gemini.
    Mirrors IMD's 4-stage cyclone warning protocol.

    Severity levels:
    - CRITICAL: Immediate life threat (cyclone landfall, tsunami)
    - HIGH: Serious danger (high waves, severe weather)
    - MEDIUM: Caution advised (moderate conditions, PFZ with caveats)
    - INFORMATIONAL: Safe / all-clear / general info
    """

    def __init__(self):
        super().__init__("ClassificationAgent")
        vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_REGION)
        self.model = GenerativeModel(settings.GEMINI_MODEL)

    async def process(self, input_data: dict) -> dict:
        """
        Classify advisory severity using Gemini.

        Input: { "advisory": { normalized advisory object } }
        Output: { "advisory": { ...advisory, severity: str, severity_rationale: str } }
        """
        advisory = input_data["advisory"]

        prompt = f"""You are a maritime safety classification system. Classify the following fishing advisory bulletin into exactly ONE severity level.

SEVERITY LEVELS (based on IMD's cyclone warning protocol):
- CRITICAL: Immediate life threat. Cyclone landfall imminent, tsunami warning, storm surge expected. All fishermen must return to shore immediately.
- HIGH: Serious danger. High waves (>2m), severe weather approaching, strong winds (>60 kmph). Fishermen should not venture into sea.
- MEDIUM: Caution advised. Moderate sea conditions, potential fishing zones with some risk factors. Exercise caution.
- INFORMATIONAL: Safe conditions. All-clear notices, normal weather, favorable fishing zones.

ADVISORY BULLETIN:
Source: {advisory['source']}
Type: {advisory['bulletin_type']}
Text: {advisory['raw_text']}

Respond in EXACTLY this JSON format, nothing else:
{{"severity": "CRITICAL|HIGH|MEDIUM|INFORMATIONAL", "rationale": "one sentence explaining why"}}"""

        try:
            response = await self.model.generate_content_async(prompt)
            response_text = response.text.strip()

            # Parse Gemini response — handle markdown code blocks
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            import json
            result = json.loads(response_text)

            severity = result.get("severity", "MEDIUM").upper()
            if severity not in ["CRITICAL", "HIGH", "MEDIUM", "INFORMATIONAL"]:
                severity = "MEDIUM"

            advisory["severity"] = severity
            advisory["severity_rationale"] = result.get("rationale", "Classified by AI")
            advisory["status"] = "classified"

            self.logger.info(
                f"Classified {advisory['advisory_id']} as {severity}: "
                f"{advisory['severity_rationale']}"
            )

        except Exception as e:
            # Fallback: classify by bulletin type if Gemini fails
            self.logger.warning(f"Gemini classification failed, using fallback: {e}")
            fallback_map = {
                "CYCLONE_WARNING": "CRITICAL",
                "TSUNAMI_WARNING": "CRITICAL",
                "HIGH_WAVE_ALERT": "HIGH",
                "STORM_WARNING": "HIGH",
                "PFZ_ADVISORY": "MEDIUM",
                "ALL_CLEAR": "INFORMATIONAL",
                "GENERAL": "MEDIUM",
            }
            advisory["severity"] = fallback_map.get(advisory.get("bulletin_type", ""), "MEDIUM")
            advisory["severity_rationale"] = "Classified by bulletin type (Gemini unavailable)"
            advisory["status"] = "classified"

        return {"advisory": advisory}
