import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
    const [messages, setMessages] = useState([{ text: 'Hi there! How can I help you today with food-related questions?', sender: 'bot' }]);
    const [inputText, setInputText] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
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

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMessage = { text: inputText, sender: 'user' };
        setMessages([...messages, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            // Call to Netlify function
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: inputText,
                    history: conversationHistory
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const botMessage = { text: data.response, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);

            // Update conversation history
            setConversationHistory(data.history);

            // Save to localStorage
            localStorage.setItem('chatHistory', JSON.stringify(data.history));
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = { text: 'Sorry, there was an error processing your request.', sender: 'bot' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([{ text: 'Hi there! How can I help you today with food-related questions?', sender: 'bot' }]);
        setConversationHistory([]);
        localStorage.removeItem('chatHistory');
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
                {isLoading && (
                    <div className="message bot-message">
                        <div className="message-content thinking">Thinking...</div>
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
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading}>Send</button>
                </form>
            </div>
        </div>
    );
}

export default App; 