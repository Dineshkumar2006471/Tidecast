"""Admin API routes — dashboard stats, zone status, logs."""
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

from core.auth import require_admin
from core.firebase_admin import db
from agents.verification import evaluate_acknowledgment_deadlines

logger = logging.getLogger("tidecast.api.admin")
router = APIRouter()


@router.get("/admin/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(require_admin)):
    """
    Aggregate dashboard stats:
    - Total active advisories
    - Overall reach percentage
    - Overall ack percentage
    - Dark zone count
    - Recent activity
    """
    try:
        # This request is polled by the dashboard. It is also the reliable
        # request-driven trigger for the two-minute dark-zone deadline on Cloud Run.
        evaluate_acknowledgment_deadlines()

        # Count active advisories
        advisories = list(db.collection("advisories").order_by(
            "created_at", direction="DESCENDING"
        ).limit(50).stream())

        # Count deliveries and acks
        deliveries = list(db.collection("deliveries").limit(500).stream())
        total_deliveries = len(deliveries)
        total_sent = sum(1 for d in deliveries if d.to_dict().get("status") in ["sent", "delivered", "acknowledged"])
        total_acked = sum(1 for d in deliveries if d.to_dict().get("status") == "acknowledged")

        # Count dark zones
        dark_zones = list(db.collection("zones").where("is_dark", "==", True).stream())

        # Total users
        users = list(db.collection("users").where("role", "==", "fisherman").limit(500).stream())

        reach_pct = round((total_sent / max(total_deliveries, 1)) * 100, 1)
        ack_pct = round((total_acked / max(total_sent, 1)) * 100, 1)

        return {
            "active_advisories": len(advisories),
            "total_users": len(users),
            "total_deliveries": total_deliveries,
            "reach_percentage": reach_pct,
            "ack_percentage": ack_pct,
            "dark_zone_count": len(dark_zones),
            "dark_zones": [d.to_dict().get("name", d.id) for d in dark_zones],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Dashboard stats failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/zones/status")
async def get_zone_status(user: dict = Depends(require_admin)):
    """Get status of all zones including dark zone flags."""
    try:
        evaluate_acknowledgment_deadlines()
        zones = db.collection("zones").stream()
        zone_list = []
        zone_stats = {}
        for zone in zones:
            data = zone.to_dict()
            data["zone_id"] = zone.id
            zone_stats[zone.id] = {"sent": 0, "acknowledged": 0}
            zone_list.append(data)

        for delivery in db.collection("deliveries").limit(500).stream():
            delivery_data = delivery.to_dict()
            zone_id = delivery_data.get("zone_id")
            if zone_id not in zone_stats:
                continue
            status = delivery_data.get("status")
            if status in ["sent", "delivered", "acknowledged"]:
                zone_stats[zone_id]["sent"] += 1
            if status == "acknowledged":
                zone_stats[zone_id]["acknowledged"] += 1

        for zone in zone_list:
            stats = zone_stats[zone["zone_id"]]
            zone["ack_rate"] = round(
                (stats["acknowledged"] / max(stats["sent"], 1)) * 100,
                1,
            )

        return {"zones": zone_list, "count": len(zone_list)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/logs")
async def get_delivery_logs(
    limit: int = 50,
    zone_id: str = None,
    status: str = None,
    user: dict = Depends(require_admin),
):
    """Get delivery logs with optional filtering."""
    try:
        query = db.collection("deliveries").order_by(
            "sent_at", direction="DESCENDING"
        ).limit(limit)

        docs = query.stream()
        logs = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            # Apply client-side filters (Firestore has limited compound query support)
            if zone_id and data.get("zone_id") != zone_id:
                continue
            if status and data.get("status") != status:
                continue
            logs.append(data)

        return {"logs": logs, "count": len(logs)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/seed-demo-data")
async def seed_demo_data(user: dict = Depends(require_admin)):
    """Seed Firestore with demo zones and mock data for the hackathon demo."""
    import json
    from core.config import settings

    try:
        # Seed zones from GeoJSON
        with open(settings.ZONES_GEOJSON_PATH, "r") as f:
            geojson = json.load(f)

        for feature in geojson["features"]:
            props = feature["properties"]
            zone_id = props["zone_id"]
            db.collection("zones").document(zone_id).set({
                "name": props["name"],
                "state": props["state"],
                "coastal_district": props["coastal_district"],
                # Firestore does not support nested arrays, so preserve the
                # GeoJSON geometry as a string rather than its coordinate tree.
                "geometry_type": feature["geometry"]["type"],
                "geometry_json": json.dumps(feature["geometry"]),
                "is_dark": False,
                "last_updated": datetime.now(timezone.utc).isoformat(),
            })

        # Create demo admin user if not exists
        admin_ref = db.collection("users").document(user["uid"])
        admin_ref.set({
            "uid": user["uid"],
            "email": user.get("email"),
            "name": "Admin",
            "role": "admin",
            "onboarded": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }, merge=True)

        return {
            "success": True,
            "zones_seeded": len(geojson["features"]),
            "message": "Demo data seeded successfully",
        }

    except Exception as e:
        logger.error(f"Seed failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
