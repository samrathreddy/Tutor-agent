import json
import os
from typing import Dict, Any, Optional

class PhysicsConstants:
    """Tool for looking up physics constants."""
    
    def __init__(self):
        """Initialize the physics constants tool by loading the constants from JSON."""
        self.name = "PhysicsConstants"
        self._load_constants()
    
    def _load_constants(self) -> None:
        """Load constants from the JSON file."""
        constants_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                    'data', 'physics_constants.json')
        try:
            with open(constants_path, 'r') as f:
                self.constants = json.load(f)
        except Exception as e:
            print(f"Error loading physics constants: {str(e)}")
            self.constants = {}
    
    def execute(self, constant_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Look up a physics constant by name.
        
        Args:
            constant_name: The name/symbol of the constant to look up (e.g., 'c' for speed of light)
            
        Returns:
            Dictionary containing:
            - success: Boolean indicating if the lookup was successful
            - constant: The constant information if found
            - available_constants: List of available constants if no specific constant requested
            - error: Error message if any
        """
        try:
            # If no constant name provided, return list of available constants
            if not constant_name:
                return {
                    "success": True,
                    "constant": None,
                    "available_constants": {
                        symbol: {
                            "description": info["description"],
                            "symbol": info["symbol"]
                        }
                        for symbol, info in self.constants.items()
                    }
                }
            
            # Look up specific constant
            if constant_name in self.constants:
                return {
                    "success": True,
                    "constant": self.constants[constant_name],
                    "available_constants": None
                }
            else:
                return {
                    "success": False,
                    "error": f"Constant '{constant_name}' not found",
                    "available_constants": list(self.constants.keys())
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Error looking up constant: {str(e)}"
            } 