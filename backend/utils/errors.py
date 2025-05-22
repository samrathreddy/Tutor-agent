"""
Custom exceptions for the Multi-Agent Tutoring Bot.
"""

class APIError(Exception):
    """Base exception class for API errors."""
    def __init__(self, message, status_code=500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class GeminiAPIError(APIError):
    """Exception raised for Gemini API errors."""
    def __init__(self, message="There was an issue with our AI service. Please try again later."):
        super().__init__(message, status_code=503) 