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
import { getUserId } from '../utils/sessionManager';

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
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [errorOpen, setErrorOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState([]);
  
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

  // Load user's conversations on mount
  useEffect(() => {
    const loadUserConversations = async () => {
      if (isLoadingConversations) return;
      
      try {
        setIsLoadingConversations(true);
        const response = await ApiService.getConversations();
        setConversations(response);
        
        // If there are conversations, select the most recent one
        if (response && response.length > 0) {
          const mostRecent = response[0];
          setConversationId(mostRecent._id);
          await loadConversationMessages(mostRecent._id);
        } else {
          // If no conversations exist, start a new one
          handleNewChat();
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        setError(error.message || 'Failed to load conversations');
      } finally {
        setIsLoadingConversations(false);
      }
    };

    loadUserConversations();
  }, []);

  // Check API health on component mount
  useEffect(() => {
    if (healthCheckRef.current) return;
    healthCheckRef.current = true;
    throttledHealthCheck();
  }, []);

  // Function to load conversation messages
  const loadConversationMessages = async (convId) => {
    try {
      const messagesResponse = await ApiService.getConversationMessages(convId);
      setMessages(messagesResponse.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError(error.message || 'Failed to load messages');
    }
  };

  // Handle conversation selection
  const handleSelectConversation = async (selectedId) => {
    if (!selectedId || isLoading) return;
    
    setConversationId(selectedId);
    setIsLoading(true);
    setError(null);
    
    try {
      await loadConversationMessages(selectedId);
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

  // Refresh conversations list
  const refreshConversations = async () => {
    if (isLoadingConversations) return;
    
    try {
      setIsLoadingConversations(true);
      const updatedConversations = await ApiService.getConversations();
      setConversations(updatedConversations);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
      setError(error.message || 'Failed to refresh conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;
    
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
      
      if (agentResponse.conversation_id && !conversationId) {
        setConversationId(agentResponse.conversation_id);
      }
      
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

      // Refresh conversations list after sending a message
      await refreshConversations();
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
    setConversationId(null);  // Set to null to let backend create a new conversation
    setMessages([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      overflow: 'hidden',
      bgcolor: 'background.default',
      pt: '64px', // Add padding for header
      boxSizing: 'border-box',
    }}>
      <ConversationSidebar
        onSelectConversation={handleSelectConversation}
        currentConversationId={conversationId}
        onNewChat={handleNewChat}
        conversations={conversations}
        isLoading={isLoadingConversations}
      />
      
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 64px)', // Adjust height to account for header
          position: 'relative',
          ml: { xs: 0, md: 0 },
          width: { 
            xs: '100%',
            md: `calc(100% - ${DRAWER_WIDTH}px)`
          },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            pt: { xs: 2, md: 2 }, // Reset to normal padding
            pb: 2,
            position: 'relative',
            left: { xs: 0, md: 0 },
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
                minHeight: { xs: 300, sm: 400 },
                width: '100%',
                mt: { xs: 4, md: 0 }, // Remove top margin on desktop
              }}
            >
              <Box sx={{ 
                width: '100%',
                maxWidth: '600px',
                mx: 'auto',
                px: { xs: 2, sm: 0 },
              }}>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontSize: { xs: '1.5rem', sm: '2rem' },
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
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                }}>
                  Ask me any question about math or physics!
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: 'text.secondary',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                }}>
                  For example: "What is the derivative of x²?" or "Explain Newton's laws of motion."
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ 
              width: '100%', 
              maxWidth: '800px', 
              mx: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}>
              {messages.map((message, index) => (
                <Message
                  key={index}
                  content={message.content}
                  role={message.role}
                  agent={message.subject && !["mathematics", "physics"].includes(message.subject.toLowerCase()) ? "Other" : message.agent}
                  toolsUsed={message.toolsUsed}
                  timestamp={message.timestamp}
                  isTyping={message.isTyping}
                />
              ))}
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Box
          sx={{
            p: { xs: 1, sm: 2 },
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
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
              px: { xs: 1, sm: 0 },
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
                height: { xs: 48, sm: 56 },
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