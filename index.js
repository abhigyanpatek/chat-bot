document.addEventListener('DOMContentLoaded', function() {
  const messageForm = document.getElementById('message-form');
  const userInput = document.getElementById('user-input');
  const chatMessages = document.getElementById('chat-messages');
  
  // Initialize conversation history
  let conversationHistory = [];
  
  // Load existing messages from history if available
  const renderSavedMessages = () => {
    // Skip the first two messages (system prompt)
    for (let i = 2; i < conversationHistory.length; i++) {
      const item = conversationHistory[i];
      if (item.role === 'user') {
        addMessage(item.parts[0].text, 'user', false);
      } else if (item.role === 'model') {
        addMessage(item.parts[0].text, 'bot', false);
      }
    }
  };
  
  // Try to load history from localStorage
  try {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      conversationHistory = JSON.parse(savedHistory);
      renderSavedMessages();
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
    // Reset history if there was an error
    conversationHistory = [];
  }

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
        // Call the Netlify serverless function with history
        const response = await fetch('/.netlify/functions/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            message,
            history: conversationHistory 
          })
        });
        
        const data = await response.json();
        
        // Remove loading indicator
        chatMessages.removeChild(loadingDiv);
        
        if (response.ok) {
          // Add bot response to chat
          addMessage(data.response, 'bot');
          
          // Update conversation history
          conversationHistory = data.history;
          
          // Save to localStorage
          localStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
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
  function addMessage(text, sender, shouldScroll = true) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender + '-message');
    
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.textContent = text;
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom if needed
    if (shouldScroll) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  
  // Add a button to clear history
  const addClearButton = () => {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.textAlign = 'center';
    buttonContainer.style.margin = '10px 0';
    
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear Conversation';
    clearButton.style.padding = '8px 16px';
    clearButton.style.backgroundColor = '#f44336';
    clearButton.style.color = 'white';
    clearButton.style.border = 'none';
    clearButton.style.borderRadius = '4px';
    clearButton.style.cursor = 'pointer';
    
    clearButton.addEventListener('click', () => {
      conversationHistory = [];
      localStorage.removeItem('chatHistory');
      chatMessages.innerHTML = '';
      alert('Conversation history cleared!');
    });
    
    buttonContainer.appendChild(clearButton);
    document.querySelector('form').insertAdjacentElement('afterend', buttonContainer);
  };
  
  addClearButton();
});