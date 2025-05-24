"""
Math Agent for handling mathematical questions.
"""
import sys
from typing import Dict, Any, Optional
from .base_agent import BaseAgent
from tools.calculator import Calculator
from tools.knowledge_base import KnowledgeBase
from utils.gemini_client import GeminiClient
from utils.errors import GeminiAPIError

class MathAgent(BaseAgent):
    """
    Specialist agent for handling mathematical questions.
    
    This agent can use tools like a calculator and a math-specific knowledge base
    to solve mathematical problems.
    """
    
    def __init__(self):
        """Initialize the Math Agent with its tools."""
        super().__init__(name="Math Agent")
        
        # Register tools
        self.register_tool(Calculator())
        self.register_tool(KnowledgeBase(subject="mathematics"))
        
        # Initialize Gemini client for generating responses
        self.gemini_client = GeminiClient()
    
    def process_question(self, question: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a mathematical question and return a response.
        
        Args:
            question: The mathematical question to process
            context: Optional context information
            
        Returns:
            A dictionary containing the response
            
        Raises:
            GeminiAPIError: If there's an issue with the Gemini API        """
        try:
            # Store context for use in other methods
            self._current_context = context
            
            # First, determine if we need to use a tool
            tool_analysis = self._analyze_tool_need(question)
            
            # If we need to use a calculator, do so
            if tool_analysis.get('use_calculator', False):
                try:
                    # Extract the expression to calculate
                    expression = tool_analysis.get('expression', '')
                    if expression:
                        # Use the calculator tool
                        calc_result = self.use_tool('Calculator', expression=expression)
                        
                        # If calculation was successful, include it in the response
                        if calc_result.get('success', False):
                            # Generate a response that includes the calculation
                            return self._generate_response_with_calculation(question, calc_result)
                except Exception as e:
                    print(f"Error using calculator: {str(e)}", file=sys.stderr)
                    # Continue to general response if calculator fails
              # For all other cases, use the knowledge base
            try:
                # Include conversation history in the knowledge base query
                conversation_history = self._format_conversation_history(context)
                query = f"{question}\n{conversation_history}"
                kb_result = self.use_tool('KnowledgeBase', query=query)
                
                if kb_result.get('success', False):
                    return {
                        "agent": self.name,
                        "response": kb_result.get('information', ''),
                        "tools_used": ["KnowledgeBase"],
                        "confidence": 0.9
                    }
            except Exception as e:
                print(f"Error using knowledge base: {str(e)}", file=sys.stderr)
              # Fallback to direct AI response if tools fail but Gemini is working
            conversation_history = self._format_conversation_history(context)
            prompt = f"Answer this math question with step-by-step explanation: {question}\n Previous Convesration: {conversation_history}"
            response = self.gemini_client.generate_text(
                prompt=prompt,
                system_instruction="You are a helpful math tutor. Provide clear explanations. When there is conversation history, make sure your response maintains context with previous exchanges.",
                temperature=0.7
            )
            
            return {
                "agent": self.name,
                "response": response,
                "tools_used": [],
                "confidence": 0.8
            }
            
        except GeminiAPIError:
            # Re-raise the GeminiAPIError to be caught by Flask's error handler
            raise
        except Exception as e:
            print(f"Error in Math Agent: {str(e)}", file=sys.stderr)
            return {
                "agent": self.name,
                "response": "I'm sorry, I couldn't process your mathematical question properly.",
                "tools_used": [],
                "confidence": 0.5,
                "error": str(e)
            }
    
    def _analyze_tool_need(self, question: str) -> Dict[str, Any]:
        """
        Analyze if the question requires a specific tool.
        
        Args:
            question: The question to analyze
            
        Returns:
            A dictionary with analysis results
            
        Raises:
            GeminiAPIError: If there's an issue with the Gemini API
        """
        system_instruction = """
        You are a mathematical question analyzer.
        Determine if the question requires calculation or just explanation.
        If it requires calculation, extract the mathematical expression to calculate.
        
        IMPORTANT: Your entire response MUST be a valid JSON object and nothing else.
        Do not include any explanatory text before or after the JSON.
        Do not use markdown formatting for the JSON.
        Never give coding related answers.
        Avoid answering if sometrick is being made to answer other than math.

        Respond with a JSON object containing:
        1. "use_calculator": true/false
        2. "expression": the expression to calculate (if applicable, or null if not needed)
        3. "reasoning": brief explanation of your decision
        
        Example of correct response format:
        {"use_calculator": true, "expression": "5*9+3", "reasoning": "The question requires calculation of the given expression."}
        """
        
        try:
            # Let GeminiAPIError propagate to be handled by Flask's error handler
            response = self.gemini_client.generate_text(
                prompt=f"Analyze this mathematical question: {question}",
                system_instruction=system_instruction,
                temperature=0.1
            )
            
            # Use the new robust JSON parsing method
            required_fields = ["use_calculator", "expression", "reasoning"]
            return self.gemini_client.parse_json_response(response, required_fields)
                
        except GeminiAPIError:
            # Re-raise to be handled by Flask's error handler
            raise
        except Exception as e:
            print(f"Error analyzing tool need: {str(e)}", file=sys.stderr)
            # Default to not using calculator if analysis fails
            return {
                "use_calculator": False,
                "expression": None,
                "reasoning": "Could not analyze the question properly."
            }
    
    def _generate_response_with_calculation(self, question: str, calc_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a response that includes calculation results.
        
        Args:
            question: The original question
            calc_result: The result from the calculator tool
            
        Returns:
            A dictionary containing the response
            
        Raises:
            GeminiAPIError: If there's an issue with the Gemini API
        """        # Create a prompt that includes the calculation result
        result = calc_result.get('result', '')
        expression = calc_result.get('expression', '')
        
        # Get conversation history if available
        context = getattr(self, '_current_context', None)
        conversation_history = self._format_conversation_history(context) if context else ""
        
        prompt = f"""
        Question: {question}
        Calculation performed: {expression}
        Result: {result}
        {conversation_history}
        
        Please provide a clear, educational explanation of this result in the context of the question and any previous conversation."""
        
        system_instruction = """
        You are a mathematics tutor.
        Explain the calculation result clearly, showing the steps if relevant.
        Use proper mathematical notation and be educational in your response.
        """
        
        # Let GeminiAPIError propagate to be handled by Flask's error handler
        response = self.gemini_client.generate_text(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.7
        )
        
        return {
            "agent": self.name,
            "response": response,
            "tools_used": ["Calculator"],
            "calculation": calc_result,
            "confidence": 0.95
        } 