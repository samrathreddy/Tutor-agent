import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';

const DRAWER_WIDTH = 280;

function ConversationSidebar({ 
  onSelectConversation, 
  currentConversationId, 
  onNewChat, 
  conversations = [],
  isLoading = false
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
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

  const getConversationTitle = (conversation) => {
    if (!conversation) return 'New Conversation';
    if (conversation.title) {
      return conversation.title.length > 30 
        ? conversation.title.substring(0, 30) + '...'
        : conversation.title;
    }
    return `Conversation ${conversation._id.substring(0, 6)}...`;
  };

  const LoadingSkeleton = () => (
    <>
      {[1, 2, 3].map((i) => (
        <ListItem key={i} sx={{ mb: 0.5, borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Skeleton variant="circular" width={24} height={24} />
          </ListItemIcon>
          <ListItemText
            primary={<Skeleton width="80%" />}
            secondary={<Skeleton width="40%" />}
          />
        </ListItem>
      ))}
    </>
  );

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      borderRight: '1px solid',
      borderColor: 'divider',
      pt: '64px', // Add padding for header height
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        position: 'sticky',
        top: '64px', // Position below header
        bgcolor: 'background.paper',
        zIndex: 1,
      }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
          onClick={() => {
            onNewChat();
            if (isMobile) setMobileOpen(false);
          }}
          disabled={isLoading}
          sx={{
            borderRadius: 2,
            py: 1.5,
            justifyContent: 'flex-start',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
              bgcolor: 'primary.dark',
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
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {conversations.map((conversation) => (
              <ListItem
                key={conversation._id}
                button
                selected={conversation._id === currentConversationId}
                onClick={() => {
                  onSelectConversation(conversation._id);
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
                  primary={getConversationTitle(conversation)}
                  secondary={formatDate(conversation.timestamp)}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: '0.9rem',
                      fontWeight: conversation._id === currentConversationId ? 600 : 400,
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
            {conversations.length === 0 && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No conversations yet
                </Typography>
              </Box>
            )}
          </>
        )}
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
          onClick={() => setMobileOpen(!mobileOpen)}
          sx={{ 
            position: 'fixed',
            left: 16,
            top: 16,
            zIndex: (theme) => theme.zIndex.drawer + 2,
            display: { md: 'none' }
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          position: 'relative',
          zIndex: (theme) => theme.zIndex.drawer,
          [`& .MuiDrawer-paper`]: { 
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            position: 'fixed',
            height: '100%',
            top: 0,
            border: 'none', // Remove default border
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

export default ConversationSidebar;
