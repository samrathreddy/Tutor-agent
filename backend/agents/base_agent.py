"""
Base Agent class that defines the interface for all agents in the system.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseAgent(ABC):
    """
    Abstract base class for all agents in the system.
    
    This class defines the interface that all agents must implement.
    """
    
    def __init__(self, name: str):
        """
        Initialize a new agent.
        
        Args:
            name: The name of the agent
        """
        self.name = name
        self.tools = []
    
    @abstractmethod
    def process_question(self, question: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a question and return a response.
        
        Args:
            question: The question to process
            context: Optional context information
            
        Returns:
            A dictionary containing the response
        """
        pass
    
    def register_tool(self, tool: Any) -> None:
        """
        Register a tool with the agent.
        
        Args:
            tool: The tool to register
        """
        self.tools.append(tool)
        
    def use_tool(self, tool_name: str, **kwargs) -> Any:
        """
        Use a registered tool.
        
        Args:
            tool_name: The name of the tool to use
            **kwargs: Arguments to pass to the tool
            
        Returns:
            The result of the tool operation
            
        Raises:
            ValueError: If the tool is not registered with this agent
        """
        for tool in self.tools:
            if tool.__class__.__name__ == tool_name:
                return tool.execute(**kwargs)
        
        raise ValueError(f"Tool '{tool_name}' not registered with agent '{self.name}'")
    
    def get_available_tools(self) -> List[str]:
        """
        Get a list of tools available to this agent.
        
        Returns:
            A list of tool names
        """
        return [tool.__class__.__name__ for tool in self.tools] 