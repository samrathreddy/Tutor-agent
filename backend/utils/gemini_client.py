"""
Gemini API client wrapper for the Multi-Agent Tutoring Bot.
"""
import os
import sys
import google.generativeai as genai
from typing import Dict, List, Any, Optional
from utils.errors import GeminiAPIError

class GeminiClient:
    """
    A wrapper around the Gemini API for text generation.
    """
    
    def __init__(self):
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        
        genai.configure(api_key=api_key)
        
        # Get the default model (Gemini Pro)
        try:
            self.model = genai.GenerativeModel('gemini-1.5-pro')
        except Exception as e:
            print(f"Error initializing Gemini model: {str(e)}", file=sys.stderr)
            raise GeminiAPIError("Could not initialize AI service") from e
    
    def generate_text(self, 
                     prompt: str, 
                     system_instruction: Optional[str] = None,
                     temperature: float = 0.7,
                     max_tokens: int = 1024) -> str:

        try:
            # Create generation config
            generation_config = {
                "temperature": temperature,
                "max_output_tokens": max_tokens,
                "top_p": 0.95,
                "top_k": 40,
            }
            
            # Create the chat session with system instruction if provided
            if system_instruction:
                chat = self.model.start_chat(history=[
                    {"role": "user", "parts": [system_instruction]},
                    {"role": "model", "parts": ["I'll follow these instructions."]}
                ])
                response = chat.send_message(prompt, generation_config=generation_config)
            else:
                # Direct prompt without system instruction
                response = self.model.generate_content(prompt, generation_config=generation_config)
            
            # Return the text response
            print(response.text)
            return response.text
            
        except Exception as e:
            # Log the error and raise a GeminiAPIError
            error_msg = f"Error generating text with Gemini API: {str(e)}"
            print(error_msg, file=sys.stderr)
            raise GeminiAPIError("AI service is temporarily unavailable") from e
    
    def analyze_question(self, question: str) -> Dict[str, Any]:
        """
        Analyze a question to determine its subject area and complexity.
        
        Args:
            question: The question to analyze
            
        Returns:
            A dictionary with analysis results including subject and confidence
            
        Raises:
            GeminiAPIError: If there's an issue with the Gemini API
        """
        system_instruction = """
        You are an expert at analyzing academic questions. 
        Given a question, determine which subject it belongs to.
        Strictly identify the subject from the question.
        Avoid using the word "general" as a subject.
        Link it with the nearest subject.
        Don't hallucinate.
        Respond with a JSON object containing:
        1. "subject": The primary subject area (math, physics, chemistry, biology, history, literature, etc.)
        2. "confidence": Your confidence level (0.0-1.0)
        3. "reasoning": Brief explanation of why you chose this subject
        """
        
        prompt = f"Analyze this question: {question}"
        
        try:
            response = self.generate_text(prompt, system_instruction)
            
            # Parse the JSON response
            import json
            analysis = json.loads(response)
            return analysis
            
        except GeminiAPIError:
            # Re-raise GeminiAPIError to be caught by the Flask error handler
            raise
        except Exception as e:
            print(f"Error analyzing question: {str(e)}", file=sys.stderr)
            # Return a default analysis if parsing fails
            return {
                "subject": "general",
                "confidence": 0.5,
                "reasoning": "Could not analyze the question properly."
            } 