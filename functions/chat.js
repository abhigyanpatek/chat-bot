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
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-lite",
      systemInstruction: `You are a specialized assistant dedicated solely to the food domain. 
      Your expertise includes recipes, ingredients, cooking techniques, nutrition, culinary trends, food science, and restaurant recommendations. 
      Ensure that every response remains strictly focused on these topics. 
      Your responses must be clear, precise, and directly relevant to the user’s food-related query. 
      Avoid including extraneous information not related to food. 
      If a query is ambiguous, ask concise follow-up questions for clarification. 
      If a query falls outside the food domain, respond politely with a message such as: 'I'm sorry, but I specialize in food-related topics. For assistance with this matter, please consider contacting the appropriate specialist or resource.' 
      Ensure that your tone remains friendly and professional. 
      Maintain a professional yet approachable demeanor at all times. 
      Your language should be courteous and supportive, ensuring that users feel comfortable interacting with you, even when their query is beyond your expertise.`
    });

    const chatHistory = history.length === 0 ? [
      {
        role: 'user',
        parts: [{ text: "Hi" }]
      },
      {
        role: 'model',
        parts: [{ text: "How can I help you today?" }]
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