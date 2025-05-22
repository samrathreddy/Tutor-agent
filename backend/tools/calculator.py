"""
Calculator tool for performing mathematical operations.
"""
import sympy
from typing import Any, Dict, Union
from .base_tool import BaseTool

class Calculator(BaseTool):
    """
    A tool for performing mathematical calculations using SymPy.
    """
    
    def __init__(self):
        """Initialize the Calculator tool."""
        super().__init__(
            name="Calculator",
            description="Performs mathematical calculations, including algebra, calculus, and more."
        )
    
    def execute(self, expression: str) -> Dict[str, Any]:
        """
        Execute a mathematical calculation.
        
        Args:
            expression: The mathematical expression to evaluate
            
        Returns:
            A dictionary containing the result and additional information
        """
        try:
            # Create a safe evaluation environment
            # This uses SymPy's sympify to safely evaluate mathematical expressions
            result = sympy.sympify(expression)
            
            # Determine the type of result for better formatting
            result_type = self._determine_result_type(result)
            
            # Format the result based on its type
            formatted_result = self._format_result(result)
            
            return {
                "success": True,
                "result": formatted_result,
                "result_type": result_type,
                "expression": expression
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "expression": expression
            }
    
    def _determine_result_type(self, result: Any) -> str:
        """
        Determine the type of the result for better formatting.
        
        Args:
            result: The result from SymPy
            
        Returns:
            A string describing the type of result
        """
        if isinstance(result, sympy.core.numbers.Integer):
            return "integer"
        elif isinstance(result, sympy.core.numbers.Rational):
            return "fraction"
        elif isinstance(result, sympy.core.numbers.Float):
            return "decimal"
        elif isinstance(result, sympy.Symbol):
            return "symbol"
        elif isinstance(result, sympy.Expr):
            return "expression"
        elif isinstance(result, sympy.Matrix):
            return "matrix"
        else:
            return "other"
    
    def _format_result(self, result: Any) -> Union[str, float, int]:
        """
        Format the result for better readability.
        
        Args:
            result: The result from SymPy
            
        Returns:
            A formatted version of the result
        """
        # For simple numeric results, convert to Python native types
        if isinstance(result, (sympy.core.numbers.Integer, sympy.core.numbers.Float)):
            return float(result) if isinstance(result, sympy.core.numbers.Float) else int(result)
        
        # For fractions, show both the fraction and decimal representation
        elif isinstance(result, sympy.core.numbers.Rational):
            decimal = float(result)
            return f"{result} ≈ {decimal:.6g}"
        
        # For matrices, format them nicely
        elif isinstance(result, sympy.Matrix):
            return str(result)
        
        # For expressions, convert to LaTeX for better display
        elif isinstance(result, sympy.Expr):
            return {
                "text": str(result),
                "latex": sympy.latex(result)
            }
        
        # Default case
        else:
            return str(result) 