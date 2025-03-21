import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const messagesEndRef = useRef(null);

    // Load conversation history from localStorage on initial render
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('chatHistory');
            if (savedHistory) {
                const history = JSON.parse(savedHistory);
                setConversationHistory(history);

                // Convert history to messages format for display
                const displayMessages = history.slice(2).map(item => ({
                    text: item.parts[0].text,
                    sender: item.role === 'user' ? 'user' : 'bot'
                }));

                if (displayMessages.length > 0) {
                    setMessages(displayMessages);
                    setShowChat(true);
                }
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current && messages.length > 0) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const userMessage = { text: message, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setShowChat(true);

        const userInput = message;
        setMessage('');
        setIsLoading(true);

        try {
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

            // Add bot response to messages
            const botMessage = { text: data.response, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);

            // Update conversation history
            setConversationHistory(data.history);

            // Save to localStorage
            localStorage.setItem('chatHistory', JSON.stringify(data.history));

        } catch (error) {
            console.error('Error in chat:', error);
            const errorMessage = { text: 'Sorry, there was an error processing your request.', sender: 'bot' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOptionClick = async (option) => {
        // Handle predefined options the same way as manual input
        setMessage(option);
        const event = { preventDefault: () => { } };
        await handleSubmit(event);
    };

    return (
        <div className="app-container">
            <header className="header">
                <img src="/images/share-icon.svg" alt="Share" className="share-icon" />
            </header>

            <main className="main-content">
                {!showChat ? (
                    <div className="greeting-section">
                        <h1 className="greeting">Hi <br />UserName</h1>
                        <p className="subheading">How can I help you today?</p>
                        <div className="animation-container">
                            <img src="/images/chat-animation.png" alt="Chat Animation" />
                        </div>
                    </div>
                ) : (
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}-message`}>
                                <div className="message-content">{msg.text}</div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message bot-message">
                                <div className="message-content thinking">Thinking...</div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                <div className="chat-options">
                    {!showChat && (
                        <div className="option-buttons">
                            <button
                                className="option-button"
                                onClick={() => handleOptionClick("Tell me about general policies")}
                            >
                                <span>General policies</span>
                            </button>
                            <button
                                className="option-button"
                                onClick={() => handleOptionClick("Tell me about payroll and compensation")}
                            >
                                <span>Payroll and Compensation</span>
                            </button>
                            <button
                                className="option-button"
                                onClick={() => handleOptionClick("What are the company's leave policies?")}
                            >
                                <span>Company's leave policies</span>
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="message-input">
                        <div className="add-attachment">
                            <img src="/images/plus-icon.svg" alt="Add attachment" />
                        </div>
                        <div className="input-field">
                            <input
                                type="text"
                                placeholder="Message here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <button type="submit" className="send-button" disabled={isLoading}>
                            <img src="/images/send-icon.svg" alt="Send" />
                        </button>
                    </form>
                </div>
            </main>

            <footer className="footer">
                <div className="footer-item">
                    <img src="/images/home-icon.svg" alt="Home" />
                </div>
                <div className="footer-item">
                    <img src="/images/annotation-check-icon.svg" alt="Tasks" />
                </div>
            </footer>
        </div>
    );
}

export default App; 