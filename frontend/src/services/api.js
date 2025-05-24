import axios from 'axios';
import { getUserId } from '../utils/sessionManager';

// Get the API URL from environment variables or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Throttle utility function
const throttle = (func, limit) => {
  let inThrottle;
  let lastResult;
  return (...args) => {
    if (!inThrottle) {
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
      lastResult = func.apply(this, args);
    }
    return lastResult;
  };
};

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    return new Promise((resolve) => {
      timeout = setTimeout(() => resolve(func.apply(this, args)), wait);
    });
  };
};

/**
 * Service for interacting with the backend API.
 */
const ApiService = {
  /**
   * Send a question to the Tutor Agent.
   * 
   * @param {string} question - The question to ask
   * @param {string} conversationId - Optional conversation ID for context
   * @returns {Promise} - Promise containing the response
   */
  askQuestion: async (question, conversationId = null) => {
    try {
      const userId = getUserId();
      const response = await axios.post(`${API_URL}/ask`, {
        question,
        conversation_id: conversationId,
        user_id: userId
      });
      return response.data;
    } catch (error) {
      console.error('Error asking question:', error);
      throw ApiService._handleError(error);
    }
  },

  /**
   * Get a list of all conversations for the current user.
   * Throttled to prevent excessive API calls.
   * 
   * @returns {Promise} - Promise containing the conversations metadata
   */
  getConversations: throttle(async () => {
    try {
      const userId = getUserId();
      const response = await axios.get(`${API_URL}/conversations`, {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw ApiService._handleError(error);
    }
  }, 2000), // Throttle to one call every 2 seconds

  /**
   * Get all messages for a specific conversation.
   * Throttled to prevent excessive API calls.
   * 
   * @param {string} conversationId - The ID of the conversation
   * @returns {Promise} - Promise containing the conversation data with messages
   */
  getConversationMessages: throttle(async (conversationId) => {
    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('No user ID available');
      }

      console.log(`Fetching messages for conversation: ${conversationId}`);
      const response = await axios.get(`${API_URL}/conversations/${conversationId}`, {
        params: { user_id: userId }
      });
      
      if (response.data.status === 'success') {
        console.log('Successfully fetched conversation messages');
        return response.data.data;
      } else {
        console.error('Error in response:', response.data);
        throw new Error(response.data.error || 'Failed to fetch conversation messages');
      }
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      console.error('Conversation ID:', conversationId);
      
      const errorMessage = error.response?.data?.error || error.message;
      const errorCode = error.response?.data?.code;
      
      // Log the error details
      console.error('Error details:', {
        code: errorCode,
        message: errorMessage,
        status: error.response?.status
      });
      
      switch (errorCode) {
        case 'MISSING_USER_ID':
          throw new Error('User ID is required');
        case 'INVALID_USER':
          throw new Error('Invalid user credentials');
        case 'CONVERSATION_NOT_FOUND':
          throw new Error('Conversation not found or access denied');
        case 'SERVER_ERROR':
          throw new Error('Server error occurred. Please try again later.');
        default:
          if (error.response?.status === 404) {
            throw new Error('Conversation not found or access denied');
          }
          throw new Error(errorMessage || 'Failed to fetch conversation messages');
      }
    }
  }, 1000), // Throttle to one call every second

  /**
   * Delete a conversation.
   * 
   * @param {string} conversationId - The ID of the conversation to delete
   * @returns {Promise} - Promise containing the deletion status
   */
  deleteConversation: async (conversationId) => {
    try {
      const userId = getUserId();
      const response = await axios.delete(`${API_URL}/conversations/${conversationId}`, {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw ApiService._handleError(error);
    }
  },

  /**
   * Check if the API is healthy.
   * Throttled to prevent excessive health checks.
   * 
   * @returns {Promise} - Promise containing the health status
   */
  healthCheck: throttle(async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw ApiService._handleError(error);
    }
  }, 5000), // Throttle to one call every 5 seconds

  /**
   * Helper method to handle API errors consistently.
   * 
   * @private
   * @param {Error} error - The error object from axios
   * @returns {Error} - A formatted error object
   */
  _handleError: (error) => {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    } else if (error.response?.data?.error) {
      return new Error(error.response.data.error);
    } else if (error.message) {
      return new Error(error.message);
    } else {
      return new Error('An unexpected error occurred. Please try again later.');
    }
  }
};

export default ApiService; 