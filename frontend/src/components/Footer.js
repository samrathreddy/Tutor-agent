import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { useTheme } from '@mui/material/styles';

/**
 * Footer component for the application.
 * Displays copyright information and links.
 */
function Footer() {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          © {currentYear} Multi-Agent Tutor. All rights reserved.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            '& a': {
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': {
                color: 'primary.main',
              },
            },
          }}
        >
          <Link href="#" variant="body2">
            Privacy Policy
          </Link>
          <Link href="#" variant="body2">
            Terms of Service
          </Link>
          <Link href="#" variant="body2">
            Contact
          </Link>
        </Box>
      </Box>
    </Box>
  );
}

export default Footer; 