import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Chip from '@mui/material/Chip';
/**
 * Component for displaying a single message in the chat.
 * 
 * @param {Object} props - Component props
 * @param {string} props.content - Message content
 * @param {string} props.role - Message role ('user', 'assistant', or 'system')
 * @param {string} props.agent - Agent name (for assistant messages)
 * @param {Array} props.toolsUsed - Tools used by the agent
 * @param {string} props.timestamp - Message timestamp
 */
function Message({ content, role, agent, toolsUsed, timestamp }) {
  // Format the timestamp
  const formattedTime = new Date(timestamp).toLocaleTimeString();
  
  // Determine CSS classes based on message role
  let messageClass = '';
  if (role === 'user') {
    messageClass = 'message user-message';
  } else if (role === 'assistant') {
    messageClass = 'message assistant-message';
  } else if (role === 'system') {
    messageClass = 'message system-message';
  }
  
  // Check if this is an error message
  const isErrorMessage = role === 'system' && content.toLowerCase().includes('error');
  
  // Get agent badge class
  const getAgentBadgeClass = () => {
    if (agent && agent.toLowerCase().includes('math')) {
      return 'agent-badge math-agent';
    } else if (agent && agent.toLowerCase().includes('physics')) {
      return 'agent-badge physics-agent';
    }
    return 'agent-badge';
  };
  
  return (
    <div className={messageClass}>
      
      {/* Message content with Markdown support */}
      <div className={`markdown-content ${isErrorMessage ? 'error-content' : ''}`}>
        <ReactMarkdown
          components={{
            // Custom rendering for code blocks with syntax highlighting
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={atomDark}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      
      {/* Message metadata */}
      <div className="message-meta">
        <div>
          {role === 'assistant' && agent && (
            <span className={getAgentBadgeClass()}>{agent}</span>
          )}
          {role === 'system' && isErrorMessage && (
            <span className="system-badge error-badge">Error</span>
          )}
          {role === 'system' && !isErrorMessage && (
            <span className="system-badge">System</span>
          )}
          {role === 'assistant' && toolsUsed && toolsUsed.length > 0 && (
            <div className="tool-usage">
              Tools used: {toolsUsed.join(', ')}
            </div>
          )}
        </div>
        <span>{formattedTime}</span>
      </div>
    </div>
  );
}

export default Message; 