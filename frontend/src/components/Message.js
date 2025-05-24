import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
/**
 * Component for displaying a single message in the chat.
 * 
 * @param {Object} props - Component props
 * @param {string} props.content - Message content
 * @param {string} props.role - Message role ('user', 'assistant', or 'system')
 * @param {string} props.agent - Agent name (for assistant messages)
 * @param {Array} props.toolsUsed - Tools used by the agent
 * @param {string} props.timestamp - Message timestamp
 * @param {boolean} props.isTyping - Indicates if the agent is typing
 */
function Message({ content, role, agent, toolsUsed, timestamp, isTyping }) {
  const theme = useTheme();
  // Format the timestamp
  const formattedTime = new Date(timestamp).toLocaleTimeString();
  
  // Determine CSS classes based on message role
  let messageClass = '';
  if (role === 'user') {
    messageClass = 'user-message';
  } else if (role === 'assistant') {
    messageClass = 'assistant-message';
  } else if (role === 'system') {
    messageClass = 'system-message';
  }
  
  // Check if this is an error message
  const isErrorMessage = role === 'system' && content.toLowerCase().includes('error');
  
  // Get agent badge class
  const getAgentBadgeClass = () => {
    if (agent && agent.toLowerCase().includes('math')) {
      return 'math-agent';
    } else if (agent && agent.toLowerCase().includes('physics')) {
      return 'physics-agent';
    }
    return 'agent-badge';
  };
  
  const TypingIndicator = () => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center',
      gap: 1,
      color: theme.palette.text.secondary,
      mt: 1
    }}>
      <CircularProgress size={16} thickness={4} />
      <Typography variant="body2">
        {agent ? `${agent} is thinking...` : 'Thinking...'}
      </Typography>
    </Box>
  );
  
  return (
    <Box
      className={messageClass}
      sx={{
        position: 'relative',
        maxWidth: '85%',
        minWidth: '200px',
        p: 2,
        borderRadius: 2,
        ...(role === 'user' ? {
          alignSelf: 'flex-end',
          bgcolor: 'primary.main',
          color: 'white',
        } : role === 'assistant' ? {
          alignSelf: 'flex-start',
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f5f5f5',
          color: 'text.primary',
        } : {
          alignSelf: 'center',
          bgcolor: isErrorMessage ? '#ffebee' : '#fff8e1',
          color: isErrorMessage ? '#c62828' : '#333',
          width: '100%',
          maxWidth: '600px',
        }),
        mb: 2,
      }}
    >
      {role === 'assistant' && agent && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: 1,
          color: theme.palette.mode === 'dark' ? 'primary.main' : 'primary.dark',
        }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {agent}
          </Typography>
          {toolsUsed && toolsUsed.length > 0 && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              using {toolsUsed.join(', ')}
            </Typography>
          )}
        </Box>
      )}

      <Box className="markdown-content">
        {isTyping ? (
          <TypingIndicator />
        ) : (
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={{
              // Custom rendering for code blocks with syntax highlighting
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      margin: '1em 0',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              // Custom rendering for superscript
              sup({ node, children, ...props }) {
                return (
                  <Typography
                    component="sup"
                    variant="inherit"
                    sx={{
                      fontSize: '0.75em',
                      lineHeight: '0',
                      position: 'relative',
                      verticalAlign: 'baseline',
                      top: '-0.5em',
                      mx: '0.1em'
                    }}
                    {...props}
                  >
                    {children}
                  </Typography>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 2,
          pt: 1,
          borderTop: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          opacity: 0.8,
        }}
      >
        <Typography variant="caption" sx={{ color: 'inherit' }}>
          {formattedTime}
        </Typography>
      </Box>
    </Box>
  );
}

export default Message; 