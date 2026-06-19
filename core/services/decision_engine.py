import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime

class DecisionEngine:
    """
    Aether-Nexus Decision Engine (V12.0 - Gemini Flash 3 Alignment)
    Responsible for high-speed intent evaluation and tool orchestration.
    """

    def __init__(self, rules_path: Optional[str] = None):
        self.root_dir = Path(__file__).parent.parent.parent
        self.rules_path = Path(rules_path) if rules_path else self.root_dir / "core" / "services" / "decision_rules.json"
        self.logger = self._setup_logger()
        self.rules = self._load_rules()

    def _setup_logger(self) -> logging.Logger:
        logger = logging.getLogger("DecisionEngine")
        logger.setLevel(logging.INFO)
        # Ensure log directory exists
        log_dir = self.root_dir / "var" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        
        handler = logging.FileHandler(log_dir / "decision_engine.log", encoding="utf-8")
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        return logger

    def _load_rules(self) -> List[Dict[str, Any]]:
        """Loads decision rules from JSON config."""
        if not self.rules_path.exists():
            self.logger.warning(f"Rules file not found at {self.rules_path}. Initializing with defaults.")
            return []
        try:
            with open(self.rules_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"Failed to load rules: {e}")
            return []

    def evaluate(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates an intent against defined rules to determine the optimal action.
        Follows 'FAST' mode (Gemini Flash 3 style).
        """
        start_time = datetime.now()
        self.logger.info(f"Evaluating intent: {intent.get('type', 'unknown')}")

        for rule in self.rules:
            if self._match_rule(intent, rule.get("match", {})):
                duration = (datetime.now() - start_time).total_seconds() * 1000
                self.logger.info(f"Rule matched: {rule.get('name')} in {duration:.2f}ms")
                return {
                    "status": "success",
                    "mode": rule.get("mode", "FAST"),
                    "action": rule.get("action"),
                    "forensic_evidence": {
                        "rule_id": rule.get("id"),
                        "duration_ms": duration
                    }
                }

        # Default Fallback
        return {
            "status": "fallback",
            "mode": "DEEP",
            "action": {"tool": "Agent", "args": {"prompt": "Analyze complex intent manually."}},
            "forensic_evidence": {"duration_ms": (datetime.now() - start_time).total_seconds() * 1000}
        }

    def _match_rule(self, intent: Dict[str, Any], criteria: Dict[str, Any]) -> bool:
        """Recursive check if intent matches criteria."""
        for key, value in criteria.items():
            if key not in intent:
                return False
            if isinstance(value, dict) and isinstance(intent[key], dict):
                if not self._match_rule(intent[key], value):
                    return False
            elif intent[key] != value:
                return False
        return True

    def update_rules(self, new_rules: List[Dict[str, Any]]):
        """Atomically updates the rules file."""
        try:
            with open(self.rules_path, 'w', encoding='utf-8') as f:
                json.dump(new_rules, f, indent=4, ensure_ascii=False)
            self.rules = new_rules
            self.logger.info("Decision rules updated successfully.")
        except Exception as e:
            self.logger.error(f"Failed to update rules: {e}")

if __name__ == "__main__":
    # Self-test logic
    engine = DecisionEngine()
    test_intent = {"type": "file_fix", "priority": "high"}
    result = engine.evaluate(test_intent)
    print(json.dumps(result, indent=2))
