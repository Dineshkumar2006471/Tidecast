"""Test doubles for cloud services that must not be contacted during unit tests."""
import sys
from types import ModuleType
from unittest.mock import MagicMock


firebase_admin = MagicMock()
firebase_admin._apps = []
sys.modules["firebase_admin"] = firebase_admin
for service in ("auth", "credentials", "firestore", "messaging", "storage"):
    sys.modules[f"firebase_admin.{service}"] = MagicMock()

# API route imports require the pipeline singleton, but API unit tests do not run it.
pipeline_module = ModuleType("agents.pipeline")
pipeline_module.pipeline = MagicMock()
sys.modules["agents.pipeline"] = pipeline_module
