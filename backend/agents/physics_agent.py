"""
Physics Agent for handling physics-related questions.
"""
import sys
from typing import Dict, Any, Optional
from .base_agent import BaseAgent
from tools.calculator import Calculator
from tools.knowledge_base import KnowledgeBase
from tools.physics_constants import PhysicsConstants
from utils.gemini_client import GeminiClient
from utils.errors import GeminiAPIError

class PhysicsAgent(BaseAgent):
    """
    Specialist agent for handling physics questions.
    
    This agent can use tools like a calculator, physics constants lookup, and a 
    physics-specific knowledge base to solve physics problems.
    """
    
    def __init__(self):
        """Initialize the Physics Agent with its tools."""
        super().__init__(name="Physics Agent")
        
        # Register tools
        self.register_tool(Calculator())
        self.register_tool(KnowledgeBase(subject="physics"))
        self.register_tool(PhysicsConstants())
        
        # Initialize Gemini client for generating responses
        self.gemini_client = GeminiClient()
    
    def process_question(self, question: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a physics question and return a response.
        
        Args:
            question: The physics question to process
            context: Optional context information
            
        Returns:
            A dictionary containing the response
            
        Raises:
            GeminiAPIError: If there's an issue with the Gemini API
        """
        try:
            # Store context for use in other methods
            self._current_context = context
            
            # First, determine if we need to use tools
            tool_analysis = self._analyze_tool_need(question)
            
            # Check if we need to look up constants
            if tool_analysis.get('use_constants', False):
                try:
                    constant_name = tool_analysis.get('constant_name')
                    constants_result = self.use_tool('PhysicsConstants', constant_name=constant_name)
                    
                    if constants_result.get('success', False):
                        # Generate a response that includes the constant information
                        return self._generate_response_with_constant(question, constants_result)
                except Exception as e:
                    print(f"Error using physics constants: {str(e)}", file=sys.stderr)
            
            # If we need to use a calculator, do so
            if tool_analysis.get('use_calculator', False):
                try:
                    expression = tool_analysis.get('expression', '')
                    if expression:
                        calc_result = self.use_tool('Calculator', expression=expression)
                        
                        if calc_result.get('success', False):
                            return self._generate_response_with_calculation(question, calc_result)
                except Exception as e:
                    print(f"Error using calculator: {str(e)}", file=sys.stderr)
            
            # For all other cases, use the knowledge base
            try:
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
            
            # Fallback to direct AI response
            conversation_history = self._format_conversation_history(context)
            prompt = f"Answer this physics question with step-by-step explanation: {question}\n Previous Context: {conversation_history}"
            response = self.gemini_client.generate_text(
                prompt=prompt,
                system_instruction="You are a helpful physics tutor. Provide clear explanations with relevant physics principles. When there is conversation history, make sure your response maintains context with previous exchanges.",
                temperature=0.7
            )
            
            return {
                "agent": self.name,
                "response": response,
                "tools_used": [],
                "confidence": 0.8
            }
            
        except GeminiAPIError:
            raise
        except Exception as e:
            print(f"Error in Physics Agent: {str(e)}", file=sys.stderr)
            return {
                "agent": self.name,
                "response": "I'm sorry, I couldn't process your physics question properly.",
                "tools_used": [],
                "confidence": 0.5,
                "error": str(e)
            }
    
    def _analyze_tool_need(self, question: str) -> Dict[str, Any]:
        """
        Analyze if the question requires specific tools.
        
        Args:
            question: The question to analyze
            
        Returns:
            A dictionary with analysis results
            
        Raises:
            GeminiAPIError: If there's an issue with the Gemini API
        """
        system_instruction = """
        In complete you are a tutor for physics and mathematics. Developed by Samrath. Here is his linkedin profile: https://www.linkedin.com/in/samrath-reddy/.
        Provide about details only when asked dont provide unnecesaary when not asked.
        Avoid saying you are google based llm.
        You are a physics question analyzer.
        Determine if the question requires:
        1. Calculation
        2. Physics constants lookup
        3. Just explanation
        
        IMPORTANT: Your entire response MUST be a valid JSON object and nothing else.
        Do not include any explanatory text before or after the JSON.
        Do not use markdown formatting for the JSON.
        
        Respond with a JSON object containing:
        1. "use_calculator": true/false
        2. "expression": the expression to calculate (if applicable, or null if not needed)
        3. "use_constants": true/false
        4. "constant_name": the name of the constant to look up (if applicable, or null if not needed)
        5. "reasoning": brief explanation of your decision
        """
        
        try:
            response = self.gemini_client.generate_text(
                prompt=f"Analyze this physics question: {question}",
                system_instruction=system_instruction,
                temperature=0.1
            )
            
            required_fields = ["use_calculator", "expression", "use_constants", "constant_name", "reasoning"]
            return self.gemini_client.parse_json_response(response, required_fields)
                
        except GeminiAPIError:
            raise
        except Exception as e:
            print(f"Error analyzing tool need: {str(e)}", file=sys.stderr)
            return {
                "use_calculator": False,
                "expression": None,
                "use_constants": False,
                "constant_name": None,
                "reasoning": "Could not analyze the question properly."
            }
    
    def _generate_response_with_constant(self, question: str, constants_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a response that includes constant information.
        
        Args:
            question: The original question
            constants_result: The result from the physics constants tool
            
        Returns:
            A dictionary containing the response
            
        Raises:
            GeminiAPIError: If there's an issue with the Gemini API
        """
        constant = constants_result.get('constant', {})
        
        context = getattr(self, '_current_context', None)
        conversation_history = self._format_conversation_history(context) if context else ""
        
        prompt = f"""
        Question: {question}
        Constant Information:
        - Name: {constant.get('description', '')}
        - Symbol: {constant.get('symbol', '')}
        - Value: {constant.get('value', '')}
        - Unit: {constant.get('unit', '')}
        {conversation_history}
        
        Please provide a clear explanation of this constant in the context of the question,
        including its significance in physics and how it's typically used."""
        
        system_instruction = """
        You are a physics tutor.
        Explain the physics constant clearly, including:
        1. Its significance in physics
        2. Common applications
        3. Related equations or principles
        4. Historical context if relevant
        Be educational in your response.
        """
        
        response = self.gemini_client.generate_text(
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=0.7
        )
        
        return {
            "agent": self.name,
            "response": response,
            "tools_used": ["PhysicsConstants"],
            "constant_info": constant,
            "confidence": 0.95
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
        """
        result = calc_result.get('result', '')
        expression = calc_result.get('expression', '')
        
        context = getattr(self, '_current_context', None)
        conversation_history = self._format_conversation_history(context) if context else ""
        
        prompt = f"""
        Question: {question}
        Calculation performed: {expression}
        Result: {result}
        {conversation_history}
        
        Please provide a clear, educational explanation of this result in the context of the question,
        any previous conversation, and include relevant physics principles and concepts."""
        
        system_instruction = """
        You are a physics tutor.
        Explain the calculation result clearly, showing the steps if relevant.
        Relate the calculation to physics principles and laws.
        Use proper scientific notation and be educational in your response.
        """
        
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