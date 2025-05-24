import React, { useState, useEffect, useRef } from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import ApiService from '../services/api';

const DRAWER_WIDTH = 280;

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

function ConversationSidebar({ onSelectConversation, currentConversationId, onNewChat }) {
  const [conversations, setConversations] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const prevConversationIdRef = useRef(currentConversationId);

  // Create throttled load conversations function
  const throttledLoadConversations = useRef(throttle(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const conversationsData = await ApiService.getConversations();
      setConversations(conversationsData);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, 2000)).current;

  useEffect(() => {
    if (prevConversationIdRef.current !== currentConversationId) {
      prevConversationIdRef.current = currentConversationId;
      throttledLoadConversations();
    }
  }, [currentConversationId]);

  useEffect(() => {
    throttledLoadConversations();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString();
  };

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.default',
      overflow: 'hidden',
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<AddIcon />}
          onClick={onNewChat}
          sx={{
            borderRadius: 2,
            py: 1,
            justifyContent: 'flex-start',
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover'
            }
          }}
        >
          New Chat
        </Button>
      </Box>
      <List sx={{ 
        flex: 1, 
        overflowY: 'auto',
        overflowX: 'hidden',
        px: 1,
        '&::-webkit-scrollbar': {
          width: '4px',
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
        }
      }}>
        {conversations.map((conversation) => (
          <ListItem
            key={conversation.id}
            button
            selected={conversation.id === currentConversationId}
            onClick={() => {
              onSelectConversation(conversation.id);
              if (isMobile) setMobileOpen(false);
            }}
            sx={{
              mb: 0.5,
              borderRadius: 2,
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              },
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <ChatBubbleOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={conversation.title || `Conversation ${conversation.id.slice(0, 6)}...`}
              secondary={formatDate(conversation.created_at)}
              primaryTypographyProps={{
                sx: {
                  fontSize: '0.9rem',
                  fontWeight: conversation.id === currentConversationId ? 600 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'text.primary'
                }
              }}
              secondaryTypographyProps={{
                sx: {
                  fontSize: '0.75rem',
                  color: 'text.secondary'
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ 
            position: 'fixed', 
            left: 16, 
            top: 80,
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Box 
        component="nav" 
        sx={{ 
          width: { md: DRAWER_WIDTH }, 
          flexShrink: { md: 0 },
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100%',
          zIndex: (theme) => theme.zIndex.drawer,
          display: { xs: 'none', md: 'block' },
        }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ 
              keepMounted: true,
              sx: {
                '& .MuiBackdrop-root': {
                  mt: '64px',
                }
              }
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { 
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                bgcolor: 'background.default',
                borderRight: '1px solid',
                borderColor: 'divider',
                mt: '64px',
                height: 'calc(100% - 64px)',
                overflowX: 'hidden',
              },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { 
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                bgcolor: 'background.default',
                borderRight: '1px solid',
                borderColor: 'divider',
                mt: '64px',
                height: 'calc(100% - 64px)',
                overflowX: 'hidden',
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>
    </>
  );
}

export default ConversationSidebar;
