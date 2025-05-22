import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

/**
 * Footer component for the application.
 * Displays copyright information and links.
 */
function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Typography variant="body2" color="text.secondary" align="center">
        {'© '}
        {new Date().getFullYear()}{' '}
        <Link color="inherit" href="https://github.com/yourusername/tutor-agent">
          Multi-Agent Tutoring Bot
        </Link>{' '}
        | Powered by Gemini API
      </Typography>
    </Box>
  );
}

export default Footer; 