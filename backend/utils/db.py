from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
import os
import json
from .json_encoder import mongo_json_serializer
from datetime import datetime

load_dotenv()

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'tutor_agent')

class MongoDB:
    _instance = None
    _client = None
    _db = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        if MongoDB._client is None:
            MongoDB._client = MongoClient(MONGODB_URI)
            MongoDB._db = MongoDB._client[DATABASE_NAME]
            # Create indexes for better query performance
            self._create_indexes()

    def _create_indexes(self):
        """Create necessary indexes for better query performance."""
        try:
            self.db.users.create_index("user_id", unique=True)
            self.db.conversations.create_index([("conversation_id", 1), ("user_id", 1)], unique=True)
            print("MongoDB indexes created successfully")
        except Exception as e:
            print(f"Error creating MongoDB indexes: {str(e)}")

    @property
    def db(self):
        return MongoDB._db

    def _serialize_document(self, doc):
        """Helper method to serialize MongoDB document."""
        if doc is None:
            return None
        if isinstance(doc.get('_id'), ObjectId):
            doc['_id'] = str(doc['_id'])
        return doc

    def get_or_create_user(self, user_id):
        """Get or create a user document."""
        try:
            user = self.db.users.find_one({"user_id": user_id})
            if not user:
                user = {
                    "user_id": user_id,
                    "conversation_ids": [],
                    "created_at": datetime.utcnow(),
                    "last_active": datetime.utcnow()
                }
                result = self.db.users.insert_one(user)
                if result.inserted_id:
                    print(f"Created new user with ID: {user_id}")
                    user['_id'] = result.inserted_id
            return self._serialize_document(user)
        except Exception as e:
            print(f"Error in get_or_create_user: {str(e)}")
            return None

    def get_user_conversations_metadata(self, user_id):
        """Get metadata for all conversations of a user."""
        try:
            conversations = list(self.db.conversations.find(
                {"user_id": user_id},
                {
                    "conversation_id": 1,
                    "title": 1,
                    "last_message": 1,
                    "updated_at": 1,
                    "created_at": 1
                }
            ).sort("updated_at", -1))
            
            return [self._serialize_document(conv) for conv in conversations]
        except Exception as e:
            print(f"Error in get_user_conversations_metadata: {str(e)}")
            return []

    def get_conversation_messages(self, conversation_id, user_id):
        """Get messages for a specific conversation."""
        try:
            # First verify that the user has access to this conversation
            user = self.db.users.find_one({"user_id": user_id})
            if not user:
                print(f"User not found: {user_id}")
                return None

            # Try to find the conversation using either _id or conversation_id
            conversation = self.db.conversations.find_one({
                "$or": [
                    {"_id": ObjectId(conversation_id)},
                    {"conversation_id": conversation_id}
                ],
                "user_id": user_id
            })

            if not conversation:
                print(f"Conversation not found or access denied. ID: {conversation_id}, User: {user_id}")
                return None

            return self._serialize_document(conversation)
        except Exception as e:
            print(f"Error in get_conversation_messages: {str(e)}")
            print(f"Attempted to find conversation with ID: {conversation_id}")
            return None

    def create_conversation(self, user_id, title=None):
        """Create a new conversation."""
        try:
            conversation_id = ObjectId()
            conversation = {
                "_id": conversation_id,
                "conversation_id": str(conversation_id),
                "user_id": user_id,
                "title": title or "New Conversation",
                "messages": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insert the conversation
            result = self.db.conversations.insert_one(conversation)
            if not result.inserted_id:
                print("Failed to insert conversation")
                return None
                
            # Add the conversation ID to user's list
            update_result = self.db.users.update_one(
                {"user_id": user_id},
                {
                    "$push": {"conversation_ids": conversation_id},
                    "$set": {"last_active": datetime.utcnow()}
                }
            )
            
            if update_result.modified_count == 0:
                print(f"Failed to update user {user_id} with new conversation")
                # Rollback conversation creation
                self.db.conversations.delete_one({"_id": result.inserted_id})
                return None
            
            print(f"Created new conversation: {conversation_id} for user: {user_id}")
            return self._serialize_document(conversation)
        except Exception as e:
            print(f"Error in create_conversation: {str(e)}")
            return None

    def add_message_to_conversation(self, conversation_id, message_data):
        """Add a message to a conversation."""
        try:
            # First verify the conversation exists
            conversation = self.db.conversations.find_one({
                "conversation_id": conversation_id
            })
            
            if not conversation:
                print(f"Conversation not found: {conversation_id}")
                return None
            
            message_data["timestamp"] = datetime.utcnow()
            
            # Add the message and update the conversation
            result = self.db.conversations.update_one(
                {"conversation_id": conversation_id},
                {
                    "$push": {"messages": message_data},
                    "$set": {
                        "updated_at": datetime.utcnow(),
                        "last_message": {
                            "content": message_data.get("content", ""),
                            "role": message_data.get("role", "user"),
                            "timestamp": message_data["timestamp"]
                        }
                    }
                }
            )
            
            if result.modified_count == 0:
                print(f"Failed to add message to conversation: {conversation_id}")
                return None
                
            print(f"Added message to conversation: {conversation_id}")
            updated_conversation = self.db.conversations.find_one({"conversation_id": conversation_id})
            return self._serialize_document(updated_conversation)
            
        except Exception as e:
            print(f"Error in add_message_to_conversation: {str(e)}")
            return None

    def update_conversation_title(self, conversation_id, title):
        """Update the title of a conversation."""
        try:
            result = self.db.conversations.update_one(
                {"conversation_id": conversation_id},
                {
                    "$set": {
                        "title": title,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            print(f"Updated title for conversation: {conversation_id}")
            return result.modified_count > 0
        except Exception as e:
            print(f"Error in update_conversation_title: {str(e)}")
            return False

    def delete_conversation(self, conversation_id, user_id):
        """Delete a conversation and remove it from user's list."""
        try:
            # Remove from user's list first
            self.db.users.update_one(
                {"user_id": user_id},
                {
                    "$pull": {"conversation_ids": conversation_id},
                    "$set": {"last_active": datetime.utcnow()}
                }
            )
            
            # Then delete the conversation
            result = self.db.conversations.delete_one({
                "conversation_id": conversation_id,
                "user_id": user_id
            })
            print(f"Deleted conversation: {conversation_id} for user: {user_id}")
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error in delete_conversation: {str(e)}")
            return False

    def close(self):
        if MongoDB._client:
            MongoDB._client.close()
            MongoDB._client = None
            MongoDB._db = None 