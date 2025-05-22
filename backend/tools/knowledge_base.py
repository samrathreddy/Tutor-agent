from typing import Dict, Any
from .base_tool import BaseTool
from utils.gemini_client import GeminiClient

class KnowledgeBase(BaseTool):
    """
    A tool for retrieving information from a knowledge base using Gemini.
    """
    
    def __init__(self, subject: str = "general"):
        super().__init__(
            name="KnowledgeBase",
            description=f"Retrieves information about {subject} topics."
        )
        self.subject = subject
        self.gemini_client = GeminiClient()
    
    def execute(self, query: str) -> Dict[str, Any]:
        """
        Execute a knowledge lookup.
        
        Args:
            query: The query to look up information for
            
        Returns:
            A dictionary containing the result and additional information
        """
        try:
            system_instruction = f"""
            You are a specialized knowledge base for {self.subject} topics.
            Provide accurate, concise, and educational information in response to queries.
            Include relevant formulas, definitions, and examples where appropriate.
            If the query is outside your expertise, clearly state that.
            Format your response in a clear, structured way suitable for students.
            """
            
            # Generate response using Gemini
            response = self.gemini_client.generate_text(
                prompt=query,
                system_instruction=system_instruction,
                temperature=0.2  # Lower temperature for more factual responses
            )
            
            return {
                "success": True,
                "information": response,
                "query": query,
                "subject": self.subject
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "query": query
            } 