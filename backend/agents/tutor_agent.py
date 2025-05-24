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
from utils.db import MongoDB

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
        
        # Initialize MongoDB connection
        self.db = MongoDB.get_instance()
    
    def process_question(self, question: str, user_id: str, conversation_id: str ) -> Dict[str, Any]:
        """
        Process a question by delegating to the appropriate specialist agent.
        
        Args:
            question: The question text to process
            user_id: The ID of the user asking the question
            conversation_id: Optional ID for conversation tracking
            
        Returns:
            A dictionary containing the response
            
        Raises:
            GeminiAPIError: If there's an issue with the Gemini API
        """
        try:
            # Create or retrieve conversation from MongoDB
            if not conversation_id:
                # Create new conversation with title based on first message
                conversation = self.db.create_conversation(
                    user_id=user_id,
                    title=self._generate_title(question)
                )
                if not conversation:
                    raise Exception("Failed to create conversation")
                conversation_id = conversation['conversation_id']
            
            # Analyze the question to determine which specialist should handle it
            analysis = self.gemini_client.analyze_question(question)
            if not analysis or not isinstance(analysis, dict):
                raise Exception("Failed to analyze question")
            
            # Map the subject to our specialist agents
            subject = analysis.get('subject', '').lower()
            confidence = analysis.get('confidence', 0.0)
            
            # Add the user question to MongoDB
            # user_message = {
            #     "role": "user",
            #     "content": question,
            #     "user_id": user_id,
            #     "timestamp": time.time()
            # }
            # conversation = self.db.add_message_to_conversation(conversation_id, user_message)
            # if not conversation:
            #     raise Exception("Failed to save user message")
            
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
            if not specialist:
                raise Exception(f"Specialist agent {agent_key} not found")
            
            # Get conversation context from MongoDB
            conversation = self.db.get_conversation_messages(conversation_id, user_id)
            print(f"Conversation: {conversation}")
            if not conversation:
                raise Exception("Failed to retrieve conversation")
            
            # Get the last 3 turns of conversation (up to 6 messages - 3 user, 3 assistant)
            messages = conversation.get('messages', [])
            last_messages = messages[-6:] if len(messages) > 6 else messages
            print("%"*50)
            print("%"*50)
            print("%"*50)
            print(f"Last messages: {last_messages}")
            context = {
                "conversation_id": conversation_id,
                "conversation_history": last_messages,
            }
            
            # Process the question with the specialist agent
            response = specialist.process_question(question, context)
            if not response or not isinstance(response, dict):
                raise Exception("Invalid response from specialist agent")
            
            response_text = response.get("response")
            if not response_text:
                raise Exception("Empty response from specialist agent")
            return {
                "response": response_text,
                "agent": response.get("agent", specialist.name),
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
            
            # Add error message to MongoDB
            if conversation_id:
                error_message = {
                    "role": "system",
                    "content": f"Error: {str(e)}",
                    "user_id": user_id,
                    "timestamp": time.time()
                }
                self.db.add_message_to_conversation(conversation_id, error_message)
            
            # Return an error response
            return {
                "error": str(e),
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
        max_title_length = 50  # Increased from 20 to allow for more meaningful titles
        title = first_message[:max_title_length]
        if len(first_message) > max_title_length:
            title = title.rsplit(' ', 1)[0] + '...'
        return title
    
    def get_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get a list of all conversations for a user.
        
        Args:
            user_id: The ID of the user whose conversations to retrieve
            
        Returns:
            A list of conversation dictionaries
        """
        return self.db.get_user_conversations_metadata(user_id)
    
    def get_conversation(self, conversation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific conversation by ID.
        
        Args:
            conversation_id: The ID of the conversation to retrieve
            user_id: The ID of the user requesting the conversation
            
        Returns:
            The conversation dictionary or None if not found
        """
        return self.db.get_conversation_messages(conversation_id, user_id) 