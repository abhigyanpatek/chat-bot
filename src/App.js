import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
    const [messages, setMessages] = useState([{ text: 'Hi there! How can I help you today with food-related questions?', sender: 'bot' }]);
    const [inputText, setInputText] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const chatMessagesRef = useRef(null);

    // Load conversation history from localStorage on initial render
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('chatHistory');
            if (savedHistory) {
                const history = JSON.parse(savedHistory);
                setConversationHistory(history);

                // Convert history to messages format
                const displayMessages = history.slice(2).map(item => ({
                    text: item.parts[0].text,
                    sender: item.role === 'user' ? 'user' : 'bot'
                }));

                if (displayMessages.length > 0) {
                    setMessages(displayMessages);
                }
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }, []);

    // Auto-scroll to bottom when messages change or during streaming
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages, streamingText]);

    // Function to handle streaming chat with OpenAI compatibility
    const handleChat = async (userInput) => {
        try {
            setIsStreaming(true);
            setStreamingText('');

            const response = await fetch('/.netlify/functions/openai-stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userInput,
                    history: conversationHistory
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Simulate streaming by displaying chunks one by one
            let displayedText = '';
            for (const chunk of data.chunks) {
                displayedText += chunk;
                setStreamingText(displayedText);
                // Add a small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 30));
            }

            // After streaming completes, add the message to the list
            const botMessage = { text: data.response, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);

            // Update conversation history
            setConversationHistory(data.history);

            // Save to localStorage
            localStorage.setItem('chatHistory', JSON.stringify(data.history));

            // Clear streaming text and state
            setStreamingText('');
            setIsStreaming(false);
        } catch (error) {
            console.error('Error in chat:', error);
            const errorMessage = { text: 'Sorry, there was an error processing your request.', sender: 'bot' };
            setMessages(prev => [...prev, errorMessage]);
            setIsStreaming(false);
            setStreamingText('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMessage = { text: inputText, sender: 'user' };
        setMessages([...messages, userMessage]);
        const userInput = inputText;
        setInputText('');

        // Call the chat function
        await handleChat(userInput);
    };

    const clearChat = () => {
        setMessages([{ text: 'Hi there! How can I help you today with food-related questions?', sender: 'bot' }]);
        setConversationHistory([]);
        localStorage.removeItem('chatHistory');
        setStreamingText('');
        setIsStreaming(false);
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>Food ChatBot</h2>
                <button className="clear-button" onClick={clearChat}>Clear Chat</button>
            </div>
            <div className="chat-messages" ref={chatMessagesRef}>
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.sender}-message`}>
                        <div className="message-content">{message.text}</div>
                    </div>
                ))}
                {isStreaming && (
                    <div className="message bot-message">
                        <div className="message-content streaming">{streamingText || 'Thinking...'}</div>
                    </div>
                )}
            </div>
            <div className="chat-input">
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ask me about food..."
                        autoComplete="off"
                        disabled={isStreaming}
                    />
                    <button type="submit" disabled={isStreaming}>Send</button>
                </form>
            </div>
        </div>
    );
}

export default App; 