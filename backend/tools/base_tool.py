"""
Base Tool class that defines the interface for all tools in the system.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseTool(ABC):
    """
    Abstract base class for all tools in the system.
    
    This class defines the interface that all tools must implement.
    """
    
    def __init__(self, name: str, description: str):
        """
        Initialize a new tool.
        
        Args:
            name: The name of the tool
            description: A description of what the tool does
        """
        self.name = name
        self.description = description
    
    @abstractmethod
    def execute(self, **kwargs) -> Any:
        """
        Execute the tool's functionality.
        
        Args:
            **kwargs: Arguments specific to the tool
            
        Returns:
            The result of the tool execution
        """
        pass
    
    def get_info(self) -> Dict[str, str]:
        """
        Get information about the tool.
        
        Returns:
            A dictionary containing the tool's name and description
        """
        return {
            "name": self.name,
            "description": self.description
        } 