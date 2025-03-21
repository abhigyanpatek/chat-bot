import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [suggestedQueries, setSuggestedQueries] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);
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
                    // Generate suggestions based on conversation history
                    generateContextAwareSuggestions(history);
                }
            } else {
                // Generate initial suggestions
                generateContextAwareSuggestions();
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            // Generate initial suggestions if there's an error
            generateContextAwareSuggestions();
        }
    }, []);

    // Toggle between expanded and normal view
    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    // Generate context-aware suggestion queries based on conversation history
    const generateContextAwareSuggestions = async (history = []) => {
        try {
            // In a real implementation, this would call an API to get context-aware suggestions
            // based on the conversation history

            // For demonstration, we'll simulate different suggestions based on conversation content
            let suggestions = [];

            if (history.length <= 2) {
                // Initial suggestions for a new conversation
                suggestions = [
                    "General policies",
                    "Payroll and Compensation",
                    "Company's leave policies"
                ];
            } else {
                // Extract the last few exchanges to determine context
                const lastFewMessages = history.slice(-4);
                const conversationText = lastFewMessages
                    .map(msg => msg.parts[0].text.toLowerCase())
                    .join(' ');

                // Check for different contexts in the conversation
                if (conversationText.includes('leave') || conversationText.includes('vacation') || conversationText.includes('time off')) {
                    suggestions = [
                        "How do I apply for leave?",
                        "What holidays does the company observe?",
                        "What's the sick leave policy?"
                    ];
                } else if (conversationText.includes('pay') || conversationText.includes('salary') || conversationText.includes('compensation')) {
                    suggestions = [
                        "When is the next payday?",
                        "How are bonuses calculated?",
                        "What benefits are included in my package?"
                    ];
                } else if (conversationText.includes('policy') || conversationText.includes('policies') || conversationText.includes('rules')) {
                    suggestions = [
                        "What's the work from home policy?",
                        "Tell me about the dress code",
                        "What are the office hours?"
                    ];
                } else {
                    // Default suggestions if no specific context is detected
                    suggestions = [
                        "Tell me about the company culture",
                        "How do I request equipment?",
                        "When is the next company event?"
                    ];
                }
            }

            setSuggestedQueries(suggestions);
        } catch (error) {
            console.error('Error generating suggestions:', error);
            // Fallback suggestions if there's an error
            setSuggestedQueries([
                "Tell me about general policies",
                "Payroll and compensation information",
                "Company's leave policies"
            ]);
        }
    };

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

            // Generate new suggestions based on the updated conversation
            generateContextAwareSuggestions(data.history);

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

    const clearChat = () => {
        setMessages([]);
        setConversationHistory([]);
        setShowChat(false);
        localStorage.removeItem('chatHistory');
        generateContextAwareSuggestions();
    };

    return (
        <div className={`app-container ${isExpanded ? 'expanded' : ''}`}>
            <header className="header">
                <div className="header-icons">
                    <img src="/images/share-icon.svg" alt="Share" className="header-icon" />
                    <img
                        src={isExpanded ? "/images/minimize-icon.svg" : "/images/maximize-icon.svg"}
                        alt={isExpanded ? "Minimize" : "Maximize"}
                        className="header-icon"
                        onClick={toggleExpand}
                    />
                </div>
            </header>

            <main className="main-content">
                {!showChat ? (
                    <div className="greeting-section">
                        <h1 className="greeting">Hi <br />UserName</h1>
                        <p className="subheading">How can I help you today?</p>
                        <div className="animation-container">
                            <img src="/images/chat-animation.gif" alt="Chat Animation" />
                        </div>
                    </div>
                ) : (
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message-container ${msg.sender}-container`}>
                                <div className={`message ${msg.sender}-message`}>
                                    <div className="message-content">{msg.text}</div>
                                </div>
                                <div className="message-time">{msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message-container bot-container">
                                <div className="message bot-message">
                                    <div className="message-content thinking">Thinking...</div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                <div className="input-section">
                    {suggestedQueries.length > 0 && (
                        <div className="suggested-queries">
                            {suggestedQueries.map((query, index) => (
                                <button
                                    key={index}
                                    className={showChat ? "query-suggestion" : "option-button"}
                                    onClick={() => handleOptionClick(query)}
                                >
                                    {showChat ? query : <span>{query}</span>}
                                </button>
                            ))}
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
                <div className="footer-item" onClick={clearChat}>
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