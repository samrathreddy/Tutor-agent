"""
Rate limiting configuration for the API.
"""
import os
from flask import request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from functools import wraps

def get_user_identifier():
    """Custom key function to rate limit by user_id when available."""
    if request.method == "GET":
        user_id = request.args.get('user_id')
    else:
        user_id = request.json.get('user_id') if request.is_json else None
    return user_id or get_remote_address()

class RateLimiterConfig:
    """Class to manage rate limiting configuration."""
    
    def __init__(self, app):
        # Get Redis configuration from environment variables
        redis_host = os.environ.get('REDIS_HOST', 'localhost')
        redis_port = os.environ.get('REDIS_PORT', '6379')
        redis_password = os.environ.get('REDIS_PASSWORD', '')
        redis_db = os.environ.get('REDIS_DB', '0')
        
        # Construct Redis URI
        redis_uri = f"redis://:{redis_password}@{redis_host}:{redis_port}/{redis_db}" if redis_password else f"redis://{redis_host}:{redis_port}/{redis_db}"
        
        self.limiter = Limiter(
            app=app,
            key_func=get_remote_address,
            storage_uri=redis_uri,
            storage_options={"socket_connect_timeout": 30},
            strategy="fixed-window",
            default_limits=["200 per day", "50 per hour"]
        )
    
    def limit_health_check(self, f):
        """Rate limit for health check endpoint."""
        return self.limiter.limit("20 per minute")(f)
    
    def limit_ai_requests(self, f):
        """Rate limit for AI requests."""
        # Apply multiple limits in sequence
        @self.limiter.limit("6 per minute", key_func=get_user_identifier)
        @self.limiter.limit("100 per day", key_func=get_user_identifier)
        @wraps(f)
        def wrapped(*args, **kwargs):
            return f(*args, **kwargs)
        return wrapped
    
    def limit_conversations_list(self, f):
        """Rate limit for listing conversations."""
        return self.limiter.limit("20 per minute", key_func=get_user_identifier)(f)
    
    def limit_conversation_messages(self, f):
        """Rate limit for getting conversation messages."""
        return self.limiter.limit("10 per minute", key_func=get_user_identifier)(f)
    
    def limit_conversation_delete(self, f):
        """Rate limit for deleting conversations."""
        return self.limiter.limit("10 per minute", key_func=get_user_identifier)(f)

def init_limiter(app):
    """Initialize and configure the rate limiter."""
    return RateLimiterConfig(app) 