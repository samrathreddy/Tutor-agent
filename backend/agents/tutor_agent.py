"""
Tutor Agent for delegating questions to specialist agents.
"""
import uuid
import time
import sys
from typing import Dict, Any, List, Optional
from .base_agent import BaseAgent
from agents.math_agent import MathAgent
from agents.physics_agent import PhysicsAgent
from utils.gemini_client import GeminiClient
from utils.errors import GeminiAPIError

class TutorAgent(BaseAgent):
    """
    Main Tutor Agent that delegates questions to specialist agents.
    
    This agent analyzes incoming questions and routes them to the appropriate
    specialist agent based on the subject matter.
    """
    
    def __init__(self):
        """Initialize the Tutor Agent with its specialist agents."""
        super().__init__(name="Tutor Agent")
        
        # Initialize specialist agents
        self.specialist_agents = {
            "math": MathAgent(),
            "physics": PhysicsAgent()
        }
        
        # Initialize Gemini client for question analysis
        self.gemini_client = GeminiClient()
        
        # Store conversation history
        self.conversations = {}
    
    def process_question(self, question: str, conversation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a question by delegating to the appropriate specialist agent.
        
        Args:
            question: The question to process
            conversation_id: Optional ID for conversation tracking
            
        Returns:
            A dictionary containing the response
            
        Raises:
            GeminiAPIError: If there's an issue with the Gemini API
        """
        try:
            # Create or retrieve conversation context
            if not conversation_id:
                conversation_id = str(uuid.uuid4())
            
            if conversation_id not in self.conversations:
                self.conversations[conversation_id] = {
                    "id": conversation_id,
                    "created_at": time.time(),
                    "messages": [],
                    "title": self._generate_title(question)  # Add default title based on first message
                }
            
            # Analyze the question to determine which specialist should handle it
            analysis = self.gemini_client.analyze_question(question)
            
            # Map the subject to our specialist agents
            subject = analysis.get('subject', '').lower()
            confidence = analysis.get('confidence', 0.0)
            
            # Add the question to the conversation history
            self.conversations[conversation_id]["messages"].append({
                "role": "user",
                "content": question,
                "timestamp": time.time()
            })
            
            # Select the appropriate agent based on subject
            if subject == "mathematics" or subject == "math":
                agent_key = "math"
            elif subject == "physics":
                agent_key = "physics"
            else:
                # If we don't have a specialist agent for this subject, use the one with highest confidence
                # or default to math if confidence is low
                agent_key = "math" if confidence < 0.7 else "physics"
            
            # Get the specialist agent
            specialist = self.specialist_agents.get(agent_key)
              # Process the question with the specialist agent
            # Get the last 3 turns of conversation (up to 6 messages - 3 user, 3 assistant)
            messages = self.conversations[conversation_id]["messages"]
            last_messages = messages[-6:] if len(messages) > 6 else messages
            
            context = {
                "conversation_id": conversation_id,
                "conversation_history": last_messages,
            }
            print('*'*50)
            print(f"Delegating to {specialist.name} for question: {question}")
            print(f"Context: {context}")
            print('*'*50)
            
            response = specialist.process_question(question, context)
            
            # Add the response to conversation history
            self.conversations[conversation_id]["messages"].append({
                "role": "assistant",
                "content": response.get("response", ""),
                "agent": response.get("agent", ""),
                "timestamp": time.time()
            })
            
            # Return the response with additional metadata
            return {
                "response": response.get("response", ""),
                "agent": response.get("agent", ""),
                "subject": subject,
                "confidence": confidence,
                "conversation_id": conversation_id,
                "tools_used": response.get("tools_used", [])
            }
            
        except GeminiAPIError:
            # Re-raise the GeminiAPIError to be caught by Flask's error handler
            raise
        except Exception as e:
            print(f"Error in Tutor Agent: {str(e)}", file=sys.stderr)
            
            # Add error info to conversation history
            if conversation_id in self.conversations:
                self.conversations[conversation_id]["messages"].append({
                    "role": "system",
                    "content": f"Error: {str(e)}",
                    "timestamp": time.time()
                })
            
            # Return an error response
            return {
                "error": "An error occurred while processing your question",
                "conversation_id": conversation_id,
                "agent": self.name,
                "tools_used": []
            }
    
    def _generate_title(self, first_message: str) -> str:
        """
        Generate a title for a conversation based on the first message.
        
        Args:
            first_message: The first message in the conversation
            
        Returns:
            A string containing a generated title
        """
        # Truncate the message if it's too long
        max_title_length = 20
        title = first_message[:max_title_length]
        if len(first_message) > max_title_length:
            title = title.rsplit(' ', 1)[0] + '...'
        return title
    
    def get_conversations(self) -> List[Dict[str, Any]]:
        """
        Get a list of all conversations.
        
        Returns:
            A list of conversation dictionaries
        """
        return [
            {
                "id": conv_id,
                "created_at": conv["created_at"],
                "message_count": len(conv["messages"]),
                "title": conv["title"]  # Include the title in the response
            }
            for conv_id, conv in self.conversations.items()
        ]
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific conversation by ID.
        
        Args:
            conversation_id: The ID of the conversation to retrieve
            
        Returns:
            The conversation dictionary or None if not found
        """
        return self.conversations.get(conversation_id) 