import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import ConversationSidebar from './ConversationSidebar';
import Message from './Message';
import ApiService from '../services/api';

/**
 * ChatPage component for the main chat interface.
 * Handles sending questions to the backend and displaying responses.
 */
function ChatPage() {
  // State for the chat
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [errorOpen, setErrorOpen] = useState(false);

  // Handle conversation selection
  const handleSelectConversation = async (selectedId) => {
    setConversationId(selectedId);
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.getConversationMessages(selectedId);
      setMessages(response.messages);
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      setError(error.message || 'Failed to load conversation messages');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reference to the messages container for auto-scrolling
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Show error notification when error is set
  useEffect(() => {
    if (error) {
      setErrorOpen(true);
    }
  }, [error]);

  // Check API health on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        await ApiService.healthCheck();
      } catch (error) {
        setError(error.message || 'Cannot connect to the backend server. Please make sure it is running.');
      }
    };
    
    checkApiHealth();
    
    // Initialize conversation ID
    if (!conversationId) {
      setConversationId(uuidv4());
    }
  }, [conversationId]);

  /**
   * Handle sending a question to the backend.
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Add user message to the chat
    const userMessage = {
      content: inputValue,
      role: 'user',
      timestamp: Date.now()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Send the question to the API
      const response = await ApiService.askQuestion(inputValue, conversationId);
      
      // Add assistant response to the chat
      const assistantMessage = {
        content: response.response,
        role: 'assistant',
        agent: response.agent,
        subject: response.subject,
        toolsUsed: response.tools_used,
        timestamp: Date.now()
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      
      // Update conversation ID if needed
      if (response.conversation_id && !conversationId) {
        setConversationId(response.conversation_id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Display specific error message from the backend
      setError(error.message || 'Failed to get a response. Please try again later.');
      
      // Add error message to the chat as a system message
      const errorMessage = {
        content: `Error: ${error.message || 'Failed to get a response. Please try again later.'}`,
        role: 'system',
        timestamp: Date.now()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle key press events in the input field.
   */
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Close the error notification
   */
  const handleCloseError = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setErrorOpen(false);
  };  return (
    <Container maxWidth={false} sx={{ p: 0 }}>
      <Box sx={{ display: 'flex' }}>
        <ConversationSidebar
          onSelectConversation={handleSelectConversation}
          currentConversationId={conversationId}
        />
        
        <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${260}px)` } }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Chat with Multi-Agent Tutor
          </Typography>
          
          <Paper elevation={3} className="chat-container">
            {/* Chat messages area */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <Typography variant="body1">
                Ask me any question about math, physics for now!
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                For example: "What is the derivative of x²?" or "Explain Newton's laws of motion."
              </Typography>
            </div>
          ) : (
            messages.map((message, index) => (
              <Message
                key={index}
                content={message.content}
                role={message.role}
                agent= {message.subject == "followup" ? "Followup" : message.agent}
                toolsUsed={message.toolsUsed}
                timestamp={message.timestamp}
              />
            ))
          )}
          
          {isLoading && (
            <div className="loading-indicator">
              <CircularProgress size={30} />
            </div>
          )}
          
          {/* Invisible element for auto-scrolling */}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Chat input area */}
        <div className="chat-input">
          <TextField
            fullWidth
            placeholder="Ask a question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
          >
            Send
          </Button>
        </div>          </Paper>
        </Box>
      </Box>
      
      {/* Error notification */}
      <Snackbar
        open={errorOpen}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          sx={{ width: '100%' }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseError}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {error}
        </Alert>      </Snackbar>
    </Container>
  );
}

export default ChatPage;