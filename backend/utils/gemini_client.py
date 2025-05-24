import os
import sys
import json
import re
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
        
        try:
            self.model = genai.GenerativeModel('gemini-2.0-flash')
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
            # print("--------------------------------")
            # print(prompt)
            # print(system_instruction)
            # print(response.text)
            # print("--------------------------------")
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
        print("analyzing question")
        system_instruction = """
        You are an expert at analyzing academic questions. 
        Given a question, determine which subject it belongs to.
        Strictly identify the subject from the question.
        Avoid using the word "general" as a subject.
        Link it with the nearest subject.
        Don't hallucinate.
        If you feel like the query is dependent or incomplete, use subject "followup".
        IMPORTANT: Your entire response MUST be a valid JSON object and nothing else.
        Do not include any explanatory text before or after the JSON.
        Do not use markdown formatting for the JSON.
        The JSON must contain exactly these fields:
        1. "subject": The primary subject area (math, physics, followup etc.)
        2. "confidence": Your confidence level (0.0-1.0)
        3. "reasoning": Brief explanation of why you chose this subject
        
        Example of correct response format:
        {"subject": "physics", "confidence": 0.95, "reasoning": "This question involves concepts of momentum and energy conservation which are physics topics."}
        """
        
        prompt = f"Analyze this question: {question}"
        
        try:
            response = self.generate_text(prompt, system_instruction, temperature=0.1)
            
            # Use the parse_json helper method
            required_fields = ["subject", "confidence", "reasoning"]
            analysis = self.parse_json_response(response, required_fields)
            # print("$"*50)
            # print(analysis)
            # print("$"*50)
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
                "reasoning": "Could not analyze the question properly due to parsing error."
            } 
    
    def parse_json_response(self, response: str, required_fields: List[str] = None) -> Dict[str, Any]:
        """
        Parse a JSON response from Gemini API in a robust way.
        
        Args:
            response: The text response from Gemini
            required_fields: List of field names that must be present in the JSON
            
        Returns:
            A dictionary parsed from the JSON
            
        Raises:
            ValueError: If the JSON doesn't have all required fields or can't be parsed
        """
        try:
            # Clean the response to extract only JSON if there's any extra text
            # Look for text that looks like JSON (between curly braces)
            json_match = re.search(r'(\{.*\})', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response
            
            # Try to parse the JSON
            result = json.loads(json_str)
            
            # Validate that we have all required fields if specified
            if required_fields and not all(key in result for key in required_fields):
                missing_fields = [field for field in required_fields if field not in result]
                raise ValueError(f"Missing required fields in JSON response: {missing_fields}")
                
            return result
            
        except json.JSONDecodeError as json_err:
            print(f"JSON parse error: {str(json_err)}")
            print(f"Attempted to parse: {json_str}")
            raise ValueError(f"Could not parse JSON response: {str(json_err)}") 