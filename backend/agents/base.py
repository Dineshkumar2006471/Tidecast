"""Base Agent contract — every TIDECAST agent implements this interface."""
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any


class BaseAgent(ABC):
    """
    Base class for all TIDECAST pipeline agents.

    Each agent has:
    - A name for logging/tracing
    - process(input) → output with structured logging
    - Input/output validation
    - Error handling with traceable stage info
    """

    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"tidecast.agent.{name}")

    @abstractmethod
    async def process(self, input_data: dict) -> dict:
        """Process input and return output. Must be implemented by subclass."""
        pass

    def validate_input(self, input_data: dict, required_keys: list[str]) -> bool:
        """Validate that required keys are present in input."""
        missing = [k for k in required_keys if k not in input_data]
        if missing:
            self.logger.error(f"Missing required input keys: {missing}")
            return False
        return True

    async def run(self, input_data: dict) -> dict:
        """Execute the agent with logging and error handling."""
        start = datetime.now(timezone.utc)
        self.logger.info(f"▶ {self.name} starting...")

        try:
            result = await self.process(input_data)
            elapsed = (datetime.now(timezone.utc) - start).total_seconds()
            self.logger.info(f"✓ {self.name} completed in {elapsed:.2f}s")
            result["_agent"] = self.name
            result["_elapsed_seconds"] = elapsed
            result["_timestamp"] = datetime.now(timezone.utc).isoformat()
            return result

        except Exception as e:
            elapsed = (datetime.now(timezone.utc) - start).total_seconds()
            self.logger.error(f"✗ {self.name} failed after {elapsed:.2f}s: {str(e)}")
            raise
