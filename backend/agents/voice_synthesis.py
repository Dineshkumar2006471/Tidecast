"""Voice Synthesis Agent — Google Cloud Text-to-Speech for multi-language audio."""
import hashlib
from agents.base import BaseAgent
from core.config import settings

from google.cloud import texttospeech
from google.cloud import storage


class VoiceSynthesisAgent(BaseAgent):
    """
    Generates audio versions of translated advisories using Google Cloud TTS.

    - One audio file per language per advisory
    - Cached by content hash to avoid re-synthesis of identical text
    - Stored in Cloud Storage for CDN delivery
    """

    def __init__(self):
        super().__init__("VoiceSynthesisAgent")
        self.tts_client = texttospeech.TextToSpeechClient()
        self.storage_client = storage.Client(project=settings.GCP_PROJECT_ID)
        self.bucket = self.storage_client.bucket(settings.FIREBASE_STORAGE_BUCKET)

    def _content_hash(self, text: str, lang: str) -> str:
        """Generate a hash for caching — same text+lang = same audio."""
        return hashlib.sha256(f"{lang}:{text}".encode()).hexdigest()[:16]

    def _check_cache(self, content_hash: str) -> str | None:
        """Check if audio already exists in Cloud Storage."""
        blob_name = f"audio/{content_hash}.mp3"
        blob = self.bucket.blob(blob_name)
        if blob.exists():
            return blob.public_url
        return None

    async def _synthesize_speech(self, text: str, lang: str) -> bytes:
        """Synthesize speech using Cloud TTS."""
        voice_config = settings.TTS_VOICE_MAP.get(lang, settings.TTS_VOICE_MAP["en"])

        synthesis_input = texttospeech.SynthesisInput(text=text)

        voice = texttospeech.VoiceSelectionParams(
            language_code=voice_config["language_code"],
            name=voice_config["name"],
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=0.9,  # Slightly slower for clarity
            pitch=0.0,
        )

        response = self.tts_client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config,
        )

        return response.audio_content

    async def _upload_audio(self, audio_content: bytes, content_hash: str) -> str:
        """Upload audio to Cloud Storage and return the URL."""
        blob_name = f"audio/{content_hash}.mp3"
        blob = self.bucket.blob(blob_name)
        blob.upload_from_string(audio_content, content_type="audio/mpeg")
        # The dedicated audio bucket is readable by the public so advisory
        # audio works in the signed-in PWA without object ACL mutations.
        return blob.public_url

    async def process(self, input_data: dict) -> dict:
        """
        Generate audio for all translated versions of an advisory.

        Input: { "advisory": { ...advisory with translations } }
        Output: { "advisory": { ...advisory, audio_urls: { lang: url } } }
        """
        advisory = input_data["advisory"]
        translations = advisory.get("translations", {})
        audio_urls = {}

        for lang, texts in translations.items():
            full_text = texts.get("full", "")
            if not full_text:
                continue

            content_hash = self._content_hash(full_text, lang)

            # Check cache first
            cached_url = self._check_cache(content_hash)
            if cached_url:
                audio_urls[lang] = cached_url
                self.logger.info(f"Cache hit for {lang}: {content_hash}")
                continue

            # Synthesize and upload
            try:
                self.logger.info(f"Synthesizing audio for {lang}...")
                audio_content = await self._synthesize_speech(full_text, lang)
                url = await self._upload_audio(audio_content, content_hash)
                audio_urls[lang] = url
                self.logger.info(f"Audio generated for {lang}: {url}")
            except Exception as e:
                self.logger.error(f"TTS failed for {lang}: {e}")
                audio_urls[lang] = None

        advisory["audio_urls"] = audio_urls
        advisory["status"] = "voiced"

        self.logger.info(
            f"Generated audio for {advisory['advisory_id']} in "
            f"{sum(1 for v in audio_urls.values() if v)} languages"
        )

        return {"advisory": advisory}
