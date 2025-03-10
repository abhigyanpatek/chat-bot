require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async function(event, context) {
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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

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

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(message);
    const botResponse = result.response.text();

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