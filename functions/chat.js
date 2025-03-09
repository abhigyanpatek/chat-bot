require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async function(event, context) {
  // Check for POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { message, history = [] } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // Initialize Gemini API with API key from environment variable
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    // Create initial system message if history is empty
    const chatHistory = history.length === 0 ? [
      {
        role: "user",
        parts: [{ text: "You are a helpful assistant." }],
      },
      {
        role: "model",
        parts: [{ text: "I'm a helpful assistant created by Google. How can I help you today?" }],
      }
    ] : history;

    // Create a chat session with the provided history
    const chat = model.startChat({
      history: chatHistory,
    });

    // Send the user's message and get a response
    const result = await chat.sendMessage(message);
    const botResponse = result.response.text();

    // Add the new message and response to history
    const updatedHistory = [
      ...chatHistory,
      { role: "user", parts: [{ text: message }] },
      { role: "model", parts: [{ text: botResponse }] }
    ];

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        response: botResponse,
        history: updatedHistory 
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process the request' })
    };
  }
};