document.addEventListener('DOMContentLoaded', function() {
  const messageForm = document.getElementById('message-form');
  const userInput = document.getElementById('user-input');
  const chatMessages = document.getElementById('chat-messages');

  // Handle form submission
  messageForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const message = userInput.value.trim();
    
    if (message !== '') {
      // Add user message to chat
      addMessage(message, 'user');
      
      // Clear input field
      userInput.value = '';
      
      // Show loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.classList.add('message', 'bot-message');
      loadingDiv.innerHTML = '<div class="message-content">Thinking...</div>';
      chatMessages.appendChild(loadingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      try {
        // Call the Netlify serverless function
        const response = await fetch('/.netlify/functions/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        // Remove loading indicator
        chatMessages.removeChild(loadingDiv);
        
        if (response.ok) {
          // Add bot response to chat
          addMessage(data.response, 'bot');
        } else {
          throw new Error(data.error || 'Failed to get response');
        }
      } catch (error) {
        // Remove loading indicator
        chatMessages.removeChild(loadingDiv);
        
        // Show error message
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        console.error('Error:', error);
      }
    }
  });

  // Add message to chat
  function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender + '-message');
    
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.textContent = text;
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});