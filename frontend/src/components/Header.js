import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '@mui/material/styles';

/**
 * Header component for the application.
 * Displays the app title and navigation links.
 */
function Header({ mode, onToggleTheme }) {
  const theme = useTheme();

  return (
    <AppBar 
      position="fixed"
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="h6" 
            component={RouterLink} 
            to="/"
            sx={{ 
              textDecoration: 'none',
              color: 'text.primary',
              fontWeight: 600,
              letterSpacing: '-0.5px',
              '&:hover': {
                color: 'primary.main',
              }
            }}
          >
            Multi-Agent Tutor
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            component={RouterLink} 
            to="/"
            sx={{ 
              color: 'text.primary',
              '&:hover': {
                color: 'primary.main',
              }
            }}
          >
            Chat
          </Button>
          <Button 
            component={RouterLink} 
            to="/about"
            sx={{ 
              color: 'text.primary',
              '&:hover': {
                color: 'primary.main',
              }
            }}
          >
            About
          </Button>
          <IconButton 
            onClick={onToggleTheme} 
            color="inherit"
            sx={{ 
              ml: 1,
              color: 'text.primary',
              '&:hover': {
                color: 'primary.main',
              }
            }}
          >
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header; 