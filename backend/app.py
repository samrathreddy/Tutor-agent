import os
import sys
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from utils.errors import APIError, GeminiAPIError
from agents.tutor_agent import TutorAgent
from utils.db import MongoDB
from utils.json_encoder import MongoJSONEncoder
from bson import ObjectId
import datetime
from flask_limiter.errors import RateLimitExceeded
from utils.rate_limiter import init_limiter

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.json_encoder = MongoJSONEncoder

# Initialize rate limiter
rate_limiter = init_limiter(app)

# Configure CORS with specific allowed origins
CORS(app, resources={
    r"/api/v1*": {
        "origins": [os.environ.get('FRONTEND_URL')],
        "methods": ["GET", "POST", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize the Tutor Agent and MongoDB
tutor_agent = TutorAgent()
db = MongoDB.get_instance()

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

# Rate limit error handler
@app.errorhandler(RateLimitExceeded)
def handle_rate_limit_error(e):
    """Handler for rate limit exceeded errors."""
    return jsonify({
        "error": "Rate limit exceeded. Please try again later.",
        "status": "error",
        "retry_after": e.retry_after
    }), 429

# Custom error responses
@app.errorhandler(APIError)
def handle_api_error(e):
    """Handler for custom API errors."""
    return jsonify({
        "error": e.message,
        "status": "error"
    }), e.status_code

@app.route('/api/v1/health', methods=['GET'])
@rate_limiter.limit_health_check
def health_check():
    """Health check endpoint to verify the API is running."""
    return jsonify({"status": "healthy", "message": "API is running"}), 200

@app.route('/api/v1/ask', methods=['POST'])
@rate_limiter.limit_ai_requests
def ask_question():
    """
    Main endpoint to ask questions to the Tutor Agent.
    
    Expected JSON payload:
    {
        "question": "What is the derivative of x^2?",
        "conversation_id": "optional-conversation-id",
        "user_id": "required-user-id"
    }
    """
    try:
        data = request.json
        if not data or 'question' not in data or 'user_id' not in data:
            return jsonify({"error": "Missing required parameters: question and user_id", "status": "error"}), 400
        
        question = data['question']
        user_id = data['user_id']
        conversation_id = data['conversation_id']
        
        # Ensure user exists
        user = db.get_or_create_user(user_id)
        if not user:
            return jsonify({"error": "Failed to create or retrieve user", "status": "error"}), 500
        
        # Create new conversation if none exists
        conversation = None
        if not conversation_id:
            conversation = db.create_conversation(user_id, title=question[:50] + "...")
            if not conversation:
                return jsonify({"error": "Failed to create new conversation", "status": "error"}), 500
            conversation_id = conversation["conversation_id"]
        # Process the question through the Tutor Agent
        response = tutor_agent.process_question(question, user_id, conversation_id)
        
        if "error" in response and isinstance(response["error"], str) and "Gemini API" in response.get("error", ""):
            raise GeminiAPIError()
        
        # Add user message to conversation
        user_message = {
            "user_id": user_id,
            "content": question,
            "role": "user",
            "timestamp": datetime.datetime.utcnow()
        }
        conversation = db.add_message_to_conversation(conversation_id, user_message)
        if not conversation:
            return jsonify({"error": "Failed to store user message", "status": "error"}), 500
        
        # Add assistant message to conversation
        assistant_message = {
            "user_id": user_id,
            "content": response["response"],
            "role": "assistant",
            "agent": response.get("agent"),
            "subject": response.get("subject"),
            "tools_used": response.get("tools_used"),
            "timestamp": datetime.datetime.utcnow()
        }
        conversation = db.add_message_to_conversation(conversation_id, assistant_message)
        if not conversation:
            return jsonify({"error": "Failed to store assistant message", "status": "error"}), 500
        
        # Add conversation_id to the response
        response["conversation_id"] = conversation_id
        return jsonify(response), 200
        
    except Exception as e:
        print(f"Error processing question: {str(e)}")
        return jsonify({
            "error": "An error occurred while processing your question. Please try again later.",
            "status": "error"
        }), 500

@app.route('/api/v1/conversations', methods=['GET'])
@rate_limiter.limit_conversations_list
def get_conversations():
    """Retrieve a list of active conversations for a specific user."""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "Missing required parameter: user_id", "status": "error"}), 400
        
        # Ensure user exists
        db.get_or_create_user(user_id)
        conversations = db.get_user_conversations_metadata(user_id)
        return jsonify(conversations), 200
    except Exception as e:
        print(f"Error retrieving conversations: {str(e)}")
        return jsonify({
            "error": "An error occurred while retrieving conversations. Please try again later.",
            "status": "error"
        }), 500

@app.route('/api/v1/conversations/<conversation_id>', methods=['GET'])
@rate_limiter.limit_conversation_messages
def get_conversation_messages(conversation_id):
    """Retrieve messages for a specific conversation."""
    try:
        # Log the request details for debugging
        print(f"Fetching conversation. ID: {conversation_id}")
        
        # Validate user_id presence
        user_id = request.args.get('user_id')
        if not user_id:
            print("Missing user_id in request")
            return jsonify({
                "error": "Missing required parameter: user_id",
                "status": "error",
                "code": "MISSING_USER_ID"
            }), 400

        # Log user details
        print(f"User ID: {user_id}")

        # Validate user exists
        user = db.get_or_create_user(user_id)
        if not user:
            print(f"Failed to validate user: {user_id}")
            return jsonify({
                "error": "User not found or could not be created",
                "status": "error",
                "code": "INVALID_USER"
            }), 401

        # Get conversation with messages
        conversation = db.get_conversation_messages(conversation_id, user_id)
        if not conversation:
            print(f"Conversation not found. ID: {conversation_id}, User: {user_id}")
            return jsonify({
                "error": "Conversation not found or access denied",
                "status": "error",
                "code": "CONVERSATION_NOT_FOUND"
            }), 404

        # Log successful retrieval
        print(f"Successfully retrieved conversation: {conversation_id}")
        return jsonify({
            "status": "success",
            "data": conversation
        }), 200

    except Exception as e:
        print(f"Error retrieving conversation messages: {str(e)}")
        print(f"Conversation ID: {conversation_id}")
        print(f"User ID: {user_id if 'user_id' in locals() else 'Not provided'}")
        return jsonify({
            "error": "An error occurred while retrieving messages",
            "status": "error",
            "code": "SERVER_ERROR"
        }), 500

@app.route('/api/v1/conversations/<conversation_id>', methods=['DELETE'])
@rate_limiter.limit_conversation_delete
def delete_conversation(conversation_id):
    """Delete a specific conversation."""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "Missing required parameter: user_id", "status": "error"}), 400
        
        success = db.delete_conversation(conversation_id, user_id)
        if not success:
            return jsonify({
                "error": "Conversation not found or access denied",
                "status": "error"
            }), 404
        
        return jsonify({"status": "success", "message": "Conversation deleted successfully"}), 200
    except Exception as e:
        print(f"Error deleting conversation: {str(e)}")
        return jsonify({
            "error": "An error occurred while deleting the conversation. Please try again later.",
            "status": "error"
        }), 500
