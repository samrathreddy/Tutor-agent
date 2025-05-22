import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import SchoolIcon from '@mui/icons-material/School';
import Box from '@mui/material/Box';

/**
 * Header component for the application.
 * Displays the app title and navigation links.
 */
function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
        <SchoolIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Multi-Agent Tutor
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            Chat
          </Button>
          <Button color="inherit" component={RouterLink} to="/about">
            About
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header; 