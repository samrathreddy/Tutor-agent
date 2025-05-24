import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SendIcon from '@mui/icons-material/Send';
import { useTheme } from '@mui/material/styles';
import ConversationSidebar from './ConversationSidebar';
import Message from './Message';
import ApiService from '../services/api';
import Typography from '@mui/material/Typography';

const DRAWER_WIDTH = 280; // Match the width from ConversationSidebar

// Add throttle utility
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

function ChatPage() {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [errorOpen, setErrorOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // All refs declared together at the top
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const initRef = useRef(false);
  const healthCheckRef = useRef(false);
  const throttledHealthCheck = useRef(throttle(async () => {
    try {
      await ApiService.healthCheck();
    } catch (error) {
      setError(error.message || 'Cannot connect to the backend server. Please make sure it is running.');
    }
  }, 5000)).current;

  // Initialize conversation ID only once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    if (!conversationId) {
    }
  }, []);

  // Check API health on component mount
  useEffect(() => {
    if (healthCheckRef.current) return;
    healthCheckRef.current = true;
    throttledHealthCheck();
  }, []);

  // Handle conversation selection
  const handleSelectConversation = async (selectedId) => {
    setConversationId(selectedId);
    setIsLoading(true);
    setError(null);
    
    try {
      const conversationResponse = await ApiService.getConversationMessages(selectedId);
      setMessages(conversationResponse.messages);
    } catch (error) {
      console.error('Error loading conversation messages:', error);
      setError(error.message || 'Failed to load conversation messages');
    } finally {
      setIsLoading(false);
    }
  };
  
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

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Create new conversation if none exists
    if (!conversationId) {
      const newId = uuidv4();
      setConversationId(newId);
    }
    
    const userMessage = {
      content: inputValue,
      role: 'user',
      timestamp: Date.now()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setError(null);
    
    try {
      // Add a temporary "typing" message
      const tempTypingMessage = {
        content: '',
        role: 'assistant',
        isTyping: true,
        timestamp: Date.now()
      };
      setMessages(prevMessages => [...prevMessages, tempTypingMessage]);

      // Send the question to the API
      const agentResponse = await ApiService.askQuestion(inputValue, conversationId);
      
      // Remove the temporary typing message and add the real response
      const assistantMessage = {
        content: agentResponse.response,
        role: 'assistant',
        agent: agentResponse.agent,
        subject: agentResponse.subject,
        toolsUsed: agentResponse.tools_used,
        timestamp: Date.now()
      };
      
      setMessages(prevMessages => 
        prevMessages
          .filter(msg => !msg.isTyping)
          .concat(assistantMessage)
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to get a response. Please try again later.');
      
      const errorMessage = {
        content: `Error: ${error.message || 'Failed to get a response. Please try again later.'}`,
        role: 'system',
        timestamp: Date.now()
      };
      
      setMessages(prevMessages => 
        prevMessages
          .filter(msg => !msg.isTyping)
          .concat(errorMessage)
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleCloseError = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setErrorOpen(false);
  };

  const handleNewChat = () => {
    const newId = uuidv4();
    setConversationId(newId);
    setMessages([{
      content: "Hi! I'm your Multi-Agent Tutor. I can help you with math and physics questions. What would you like to learn about?",
      role: 'assistant',
      agent: 'Tutor Agent',
      timestamp: Date.now()
    }]);
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100%',
      overflow: 'hidden',
      pt: '64px', // Add padding for header height
    }}>
      <ConversationSidebar
        onSelectConversation={handleSelectConversation}
        currentConversationId={conversationId}
        onNewChat={handleNewChat}
      />
      
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          ml: { xs: 0, md: `${DRAWER_WIDTH}px` }, // Only add margin on desktop
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` }, // Adjust width for mobile
          transition: 'margin-left 0.3s ease', // Smooth transition for drawer
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: { xs: 2, sm: 3 }, // Smaller padding on mobile
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.divider,
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: theme.palette.text.disabled,
            },
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'text.secondary',
                textAlign: 'center',
                gap: 2,
                minHeight: { xs: 300, sm: 400 }, // Smaller minimum height on mobile
                width: '100%',
              }}
            >
              <Box sx={{ 
                width: '100%',
                maxWidth: '600px',
                mx: 'auto',
                px: { xs: 2, sm: 0 }, // Add padding on mobile
              }}>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontSize: { xs: '1.5rem', sm: '2rem' }, // Smaller font on mobile
                    marginBottom: '1rem',
                    fontWeight: 600,
                    color: 'primary.main',
                    transition: 'color 0.3s ease',
                  }}
                >
                  Welcome to Multi-Agent Tutor
                </Typography>
                <Typography variant="h6" sx={{ 
                  mb: 3,
                  fontSize: { xs: '1rem', sm: '1.25rem' }, // Smaller font on mobile
                }}>
                  Ask me any question about math or physics!
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: 'text.secondary',
                  fontSize: { xs: '0.875rem', sm: '1rem' }, // Smaller font on mobile
                }}>
                  For example: "What is the derivative of x²?" or "Explain Newton's laws of motion."
                </Typography>
              </Box>
            </Box>
          ) : (
            messages.map((message, index) => (
              <Message
                key={index}
                content={message.content}
                role={message.role}
                agent={message.subject === "followup" ? "Followup" : message.agent}
                toolsUsed={message.toolsUsed}
                timestamp={message.timestamp}
                isTyping={message.isTyping}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Box
          sx={{
            p: { xs: 1, sm: 2 }, // Smaller padding on mobile
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
            position: 'sticky',
            bottom: 0,
            zIndex: 1,
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              maxWidth: '800px',
              mx: 'auto',
              width: '100%',
              px: { xs: 1, sm: 0 }, // Add padding on mobile
            }}
          >
            <TextField
              fullWidth
              placeholder="Ask a question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isTyping}
              multiline
              maxRows={4}
              inputRef={inputRef}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                  '&.Mui-focused': {
                    '& > fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={isLoading || isTyping || !inputValue.trim()}
              sx={{
                alignSelf: 'flex-end',
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled',
                },
                height: { xs: 48, sm: 56 }, // Smaller button on mobile
                width: { xs: 48, sm: 56 },
                flexShrink: 0,
              }}
            >
              {isLoading || isTyping ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </Box>
        </Box>
      </Box>

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
              <SendIcon fontSize="small" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ChatPage;