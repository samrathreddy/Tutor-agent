import React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CalculateIcon from '@mui/icons-material/Calculate';
import ScienceIcon from '@mui/icons-material/Science';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { useTheme } from '@mui/material/styles';

/**
 * About page component.
 * Displays information about the Multi-Agent Tutoring Bot.
 */
function AboutPage() {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
        pt: '64px', // Add padding for header height
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
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: 4,
          px: { xs: 2, sm: 3 }, // Responsive padding
        }}
      >
        <Box>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{
              fontSize: { xs: '2rem', sm: '3rem' }, // Responsive font size
              mb: 3
            }}
          >
            About Multi-Agent Tutoring Bot
          </Typography>
          
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
            <Typography variant="body1" paragraph>
              The Multi-Agent Tutoring Bot is an AI-powered educational assistant that uses a sophisticated
              multi-agent architecture to provide specialized tutoring across maths and physics for now.
            </Typography>
            
            <Typography variant="body1" paragraph>
              Unlike traditional chatbots, our system employs multiple specialized agents, each an expert
              in their own domain. When you ask a question, our main Tutor Agent analyzes it and delegates
              to the appropriate specialist (Math Agent, Physics Agent, others coming soon.) to provide the most accurate
              and helpful response.
            </Typography>
            
            <Typography variant="body1" paragraph>
              Each specialist agent can also utilize various tools, such as a calculator or knowledge base,
              to enhance their responses with calculations, formulas, and detailed explanations.
            </Typography>
          </Paper>
          
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem' }, // Responsive font size
              mb: 3
            }}
          >
            Our Specialist Agents
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Math Agent" 
                  avatar={<CalculateIcon color="primary" />}
                  sx={{
                    '& .MuiCardHeader-title': {
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }
                  }}
                />
                <CardContent>
                  <Typography variant="body2">
                    Specializes in all areas of mathematics, from basic arithmetic to advanced calculus.
                    Can perform calculations, solve equations, and explain mathematical concepts with
                    step-by-step solutions.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Physics Agent" 
                  avatar={<ScienceIcon color="primary" />}
                  sx={{
                    '& .MuiCardHeader-title': {
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }
                  }}
                />
                <CardContent>
                  <Typography variant="body2">
                    Expert in physics concepts, formulas, and problem-solving. Can explain complex
                    physical phenomena, solve physics problems, and provide intuitive explanations
                    of physical laws and principles.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem' }, // Responsive font size
              mb: 3
            }}
          >
            How It Works
          </Typography>
          
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PsychologyIcon color="primary" sx={{ mr: 2, fontSize: { xs: 32, sm: 40 } }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                Multi-Agent Architecture
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              1. You ask a question in the chat interface.
            </Typography>
            
            <Typography variant="body1" paragraph>
              2. The main Tutor Agent analyzes your question to determine its subject area.
            </Typography>
            
            <Typography variant="body1" paragraph>
              3. The question is routed to the appropriate specialist agent (Math, Physics, etc.).
            </Typography>
            
            <Typography variant="body1" paragraph>
              4. The specialist agent processes your question, potentially using tools like a calculator
              or knowledge base to formulate a comprehensive response.
            </Typography>
            
            <Typography variant="body1">
              5. You receive a detailed, educational response tailored to your specific question.
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

export default AboutPage; 