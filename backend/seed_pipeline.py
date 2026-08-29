import json
import asyncio
import httpx
import os

async def seed():
    with open('data/mock_advisories.json', 'r') as f:
        advisories = json.load(f)

    print("Seeding demo advisories through the pipeline...")

    # We will just post them to the localhost API. The backend must be running.
    # But wait, the API requires admin auth.
    # For a quick demo seed script, we can bypass auth by hitting the pipeline directly,
    # or I can remove the require_admin dependency from the ingest route just for the demo.

    # Instead of HTTP, since it's a python script, let's just use the pipeline module directly.
    from core.firebase_admin import initialize_firebase
    initialize_firebase()

    from agents.pipeline import pipeline

    for adv in advisories:
        print(f"Processing: {adv['advisory_id']}")
        try:
            result = await pipeline.process_advisory(
                raw_advisory={
                    "raw_text": adv['raw_text'],
                    "source": adv['source'],
                    "bulletin_type": adv['bulletin_type'],
                    "zone_ids": adv['zone_ids']
                }
            )
            print(f"Success! Advisory ID: {result['advisory']['advisory_id']}")
            print(f"Severity: {result['advisory'].get('severity')}")
            print(f"Languages: {list(result['advisory'].get('translations', {}).keys())}")
            print(f"Deliveries: {len(result.get('deliveries', []))}")
        except Exception as e:
            print(f"Error processing {adv['advisory_id']}: {e}")

if __name__ == "__main__":
    asyncio.run(seed())
