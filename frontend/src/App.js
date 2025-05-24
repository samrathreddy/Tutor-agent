import React, { useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import ChatPage from './components/ChatPage';
import AboutPage from './components/AboutPage';

// Theme
import { getTheme } from './theme';

function App() {
  // Use system preference for initial theme mode
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(prefersDarkMode ? 'dark' : 'light');

  // Generate theme based on mode
  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden', // Prevent body scrolling
          bgcolor: 'background.default',
          color: 'text.primary',
          transition: 'background-color 0.3s, color 0.3s',
        }}
      >
        <Header mode={mode} onToggleTheme={toggleTheme} />
        <Box
          component="main"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            overflow: 'hidden', // Hide overflow
            position: 'relative',
          }}
        >
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App; 