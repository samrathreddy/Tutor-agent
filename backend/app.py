import os
import sys
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from utils.errors import APIError, GeminiAPIError
from agents.tutor_agent import TutorAgent

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure CORS with specific allowed origins
CORS(app, resources={
    r"/api/*": {
        "origins": [os.environ.get('FRONTEND_URL')],  # Frontend development
        "methods": ["GET", "POST"],  # Allowed methods
        "allow_headers": ["Content-Type"]  # Allowed headers
    }
})

# Initialize the Tutor Agent
tutor_agent = TutorAgent()

# Error handling middleware
@app.errorhandler(Exception)
def handle_exception(e):
    """Global exception handler for all routes."""
    # Log the error for debugging
    print(f"Unhandled error: {str(e)}", file=sys.stderr)
    
    # Return a user-friendly error message
    return jsonify({
        "error": "An error occurred while processing your request. Please try again later.",
        "status": "error"
    }), 500

# Custom error responses
@app.errorhandler(APIError)
def handle_api_error(e):
    """Handler for custom API errors."""
    return jsonify({
        "error": e.message,
        "status": "error"
    }), e.status_code

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the API is running."""
    return jsonify({"status": "healthy", "message": "API is running"}), 200

@app.route('/api/ask', methods=['POST'])
def ask_question():
    """
    Main endpoint to ask questions to the Tutor Agent.
    
    Expected JSON payload:
    {
        "question": "What is the derivative of x^2?",
        "conversation_id": "optional-conversation-id"
    }
    """
    try:
        # Parse the request data
        data = request.json
        print(f"Received data: {data}")  # Debugging line to check incoming data
        if not data or 'question' not in data:
            return jsonify({"error": "Missing required parameter: question", "status": "error"}), 400
        
        question = data['question']
        conversation_id = data.get('conversation_id', None)
        
        # Process the question through the Tutor Agent
        response = tutor_agent.process_question(question, conversation_id)
        
        # Check if there was an error from Gemini API
        if "error" in response and isinstance(response["error"], str) and "Gemini API" in response.get("error", ""):
            raise GeminiAPIError()
        
        return jsonify(response), 200
    
    except GeminiAPIError as e:
        # Re-raise to be caught by the custom error handler
        raise
    except Exception as e:
        # Log the error (in a production environment, use a proper logging system)
        print(f"Error processing question: {str(e)}")
        return jsonify({
            "error": "An error occurred while processing your question. Please try again later.",
            "status": "error"
        }), 500

@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    """Retrieve a list of active conversations."""
    try:
        conversations = tutor_agent.get_conversations()
        return jsonify(conversations), 200
    except Exception as e:
        print(f"Error retrieving conversations: {str(e)}")
        return jsonify({
            "error": "An error occurred while retrieving conversations. Please try again later.",
            "status": "error"
        }), 500
