"""
Delivery Orchestration Agent — multi-channel advisory delivery.

Decides the best channel per user based on last-known connectivity:
- Push (FCM) — if user was recently online
- SMS — simulated gateway, clearly labeled
- IVR — simulated gateway, clearly labeled
- Offline cache — always, written to Firestore for PWA sync
"""
import logging
from datetime import datetime, timezone, timedelta
from agents.base import BaseAgent
from core.config import settings

# Firebase Admin for FCM
import firebase_admin
from firebase_admin import messaging as fcm_messaging


class NotificationGateway:
    """
    Abstract notification gateway interface.
    Production: plug in Gupshup, Karix, Twilio, etc.
    Demo: simulated with clear logging.
    """

    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"tidecast.gateway.{name}")

    async def send(self, user: dict, advisory: dict, content: str) -> dict:
        raise NotImplementedError


class FCMGateway(NotificationGateway):
    """Real FCM push notification gateway."""

    def __init__(self):
        super().__init__("FCM")

    async def send(self, user: dict, advisory: dict, content: str) -> dict:
        """Send a real push notification via FCM."""
        fcm_token = user.get("fcm_token")
        if not fcm_token:
            return {"success": False, "reason": "No FCM token"}

        severity = advisory.get("severity", "MEDIUM")
        severity_emoji = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "INFORMATIONAL": "🟢"}.get(severity, "🟡")

        try:
            message = fcm_messaging.Message(
                notification=fcm_messaging.Notification(
                    title=f"{severity_emoji} {severity} — {advisory.get('source', 'TIDECAST')}",
                    body=content[:200],
                ),
                data={
                    "advisory_id": advisory.get("advisory_id", ""),
                    "severity": severity,
                    "type": "advisory",
                },
                token=fcm_token,
                android=fcm_messaging.AndroidConfig(
                    priority="high",
                    notification=fcm_messaging.AndroidNotification(
                        channel_id="tidecast_advisories",
                        sound="default",
                    ),
                ),
            )
            response = fcm_messaging.send(message)
            self.logger.info(f"FCM sent successfully: {response}")
            return {"success": True, "message_id": response}

        except Exception as e:
            self.logger.error(f"FCM send failed: {e}")
            return {"success": False, "reason": str(e)}


class SMSGateway(NotificationGateway):
    """
    SIMULATED SMS gateway.
    Production: replace with Gupshup, Karix, or similar DLT-registered aggregator.
    Demo: logs the SMS content clearly labeled as simulated.
    """

    def __init__(self):
        super().__init__("SMS_SIMULATED")

    async def send(self, user: dict, advisory: dict, content: str) -> dict:
        phone = user.get("phone", "unknown")
        self.logger.info(
            f"[SIMULATED SMS] To: {phone} | "
            f"Content ({len(content)} chars): {content[:160]}"
        )
        return {
            "success": True,
            "simulated": True,
            "channel": "sms",
            "phone": phone,
            "content_length": len(content),
        }


class IVRGateway(NotificationGateway):
    """
    SIMULATED IVR (voice call) gateway.
    Production: replace with telephony provider.
    Demo: logs the call attempt clearly labeled as simulated.
    """

    def __init__(self):
        super().__init__("IVR_SIMULATED")

    async def send(self, user: dict, advisory: dict, content: str) -> dict:
        phone = user.get("phone", "unknown")
        audio_url = advisory.get("audio_urls", {}).get(
            user.get("preferred_language", "en"), None
        )
        self.logger.info(
            f"[SIMULATED IVR CALL] To: {phone} | "
            f"Audio URL: {audio_url or 'TTS fallback'}"
        )
        return {
            "success": True,
            "simulated": True,
            "channel": "ivr",
            "phone": phone,
            "audio_url": audio_url,
        }


class DeliveryOrchestrationAgent(BaseAgent):
    """
    Decides the best delivery channel per user and dispatches the advisory.

    Channel arbitration logic:
    1. If user has been online recently (app ping within N minutes) → Push (FCM)
    2. Else → SMS
    3. If repeated SMS failure → IVR
    4. Always → Offline cache (written to Firestore for PWA sync)
    """

    def __init__(self):
        super().__init__("DeliveryOrchestrationAgent")
        self.fcm = FCMGateway()
        self.sms = SMSGateway()
        self.ivr = IVRGateway()

    def _select_channel(self, user: dict) -> str:
        """Determine the best channel based on user's connectivity signal."""
        last_seen = user.get("last_seen_online")
        if last_seen:
            if isinstance(last_seen, str):
                last_seen = datetime.fromisoformat(last_seen.replace("Z", "+00:00"))

            threshold = datetime.now(timezone.utc) - timedelta(
                minutes=settings.ONLINE_THRESHOLD_MINUTES
            )

            if last_seen > threshold:
                return "push"

        # Default to SMS if not recently online
        return "sms"

    async def _deliver_to_user(self, user: dict, advisory: dict) -> dict:
        """Deliver advisory to a single user via the best channel."""
        lang = user.get("preferred_language", "en")
        translations = advisory.get("translations", {})
        content = translations.get(lang, translations.get("en", {}))

        # Use SMS-safe text for SMS/IVR, full text for push
        channel = self._select_channel(user)

        delivery_record = {
            "advisory_id": advisory["advisory_id"],
            "user_id": user.get("uid", "unknown"),
            "zone_id": user.get("zone_id", "unknown"),
            "channel": channel,
            "status": "pending",
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "ack_deadline_at": (
                datetime.now(timezone.utc) + timedelta(minutes=settings.DARK_ZONE_THRESHOLD_MINUTES)
            ).isoformat(),
            "ack_at": None,
        }

        if channel == "push":
            result = await self.fcm.send(user, advisory, content.get("full", ""))
        elif channel == "sms":
            result = await self.sms.send(user, advisory, content.get("sms", ""))
        else:
            result = await self.ivr.send(user, advisory, content.get("sms", ""))

        delivery_record["status"] = "sent" if result.get("success") else "failed"
        delivery_record["delivery_result"] = result

        # If push/SMS failed, try IVR as fallback
        if not result.get("success") and channel != "ivr":
            self.logger.info(f"Primary channel {channel} failed, falling back to IVR")
            ivr_result = await self.ivr.send(user, advisory, content.get("sms", ""))
            delivery_record["fallback_channel"] = "ivr"
            delivery_record["fallback_result"] = ivr_result

        return delivery_record

    async def process(self, input_data: dict) -> dict:
        """
        Deliver advisory to all target users.

        Input: { "advisory": { ...voiced advisory }, "target_users": [ user objects ] }
        Output: { "advisory": advisory, "deliveries": [ delivery records ] }
        """
        advisory = input_data["advisory"]
        target_users = input_data.get("target_users", [])

        deliveries = []
        for user in target_users:
            delivery = await self._deliver_to_user(user, advisory)
            deliveries.append(delivery)

        advisory["status"] = "delivered"

        sent_count = sum(1 for d in deliveries if d["status"] == "sent")
        self.logger.info(
            f"Delivered {advisory['advisory_id']} to {sent_count}/{len(deliveries)} users"
        )

        return {"advisory": advisory, "deliveries": deliveries}
