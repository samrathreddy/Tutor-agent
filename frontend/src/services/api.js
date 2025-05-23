import axios from 'axios';

// Get the API URL from environment variables or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

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
      const response = await axios.post(`${API_URL}/ask`, {
        question,
        conversation_id: conversationId
      });
      return response.data;
    } catch (error) {
      console.error('Error asking question:', error);
      // Extract error message from the response if available
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to ask question. Please try again later.');
      }
    }
  },

  /**
   * Get a list of all conversations.
   * 
   * @returns {Promise} - Promise containing the conversations
   */
  getConversations: async () => {
    try {
      const response = await axios.get(`${API_URL}/conversations`);
      return response.data;
    } catch (error) {
      console.error('Error getting conversations:', error);
      // Extract error message from the response if available
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to retrieve conversations. Please try again later.');
      }
    }
  },
  /**
   * Get messages for a specific conversation.
   * 
   * @param {string} conversationId - The ID of the conversation
   * @returns {Promise} - Promise containing the conversation messages
   */
  getConversationMessages: async (conversationId) => {
    try {
      const response = await axios.get(`${API_URL}/conversations/${conversationId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to retrieve conversation messages. Please try again later.');
      }
    }
  },

  /**
   * Check if the API is healthy.
   * 
   * @returns {Promise} - Promise containing the health status
   */
  healthCheck: async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      // Extract error message from the response if available
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Health check failed. Please try again later.');
      }
    }
  }
};

export default ApiService; 