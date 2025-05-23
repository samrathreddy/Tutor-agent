import React, { useState, useEffect } from 'react';
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
import ApiService from '../services/api';

const DRAWER_WIDTH = 260;

function ConversationSidebar({ onSelectConversation, currentConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const conversationsData = await ApiService.getConversations();
      setConversations(conversationsData);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const drawerContent = (
    <>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="div">
          Conversations
        </Typography>
      </Box>
      <Divider />
      <List>
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
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.light,
                '&:hover': {
                  backgroundColor: theme.palette.primary.light,
                },
              },
            }}
          >
            <ListItemIcon>
              <ChatBubbleOutlineIcon />
            </ListItemIcon>
            <ListItemText
              primary={`Conversation ${conversation.id.slice(0, 6)}...`}
              secondary={formatDate(conversation.created_at)}
            />
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ position: 'absolute', left: 16, top: 16 }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
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
