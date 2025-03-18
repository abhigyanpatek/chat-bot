require('dotenv').config();
const OpenAI = require('openai');

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Get request body
        const { message, history = [] } = JSON.parse(event.body);

        if (!message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Message is required' })
            };
        }

        // Initialize OpenAI client with Gemini API compatibility
        const openai = new OpenAI({
            apiKey: process.env.GEMINI_API_KEY,
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
        });

        // Format history for OpenAI API format
        let messages = [
            {
                role: "system",
                content: `You are a specialized assistant dedicated solely to the food domain. 
        Your expertise includes recipes, ingredients, cooking techniques, nutrition, culinary trends, food science, and restaurant recommendations. 
        Ensure that every response remains strictly focused on these topics. 
        Your responses must be clear, precise, and directly relevant to the user's food-related query. 
        Avoid including extraneous information not related to food. 
        If a query is ambiguous, ask concise follow-up questions for clarification. 
        If a query falls outside the food domain, respond politely with a message such as: 'I'm sorry, but I specialize in food-related topics. For assistance with this matter, please consider contacting the appropriate specialist or resource.' 
        Ensure that your tone remains friendly and professional. 
        Maintain a professional yet approachable demeanor at all times. 
        Your language should be courteous and supportive, ensuring that users feel comfortable interacting with you, even when their query is beyond your expertise.`
            }
        ];

        // Format chat history for OpenAI format if it exists
        if (history && history.length > 0) {
            // Skip the first two system messages and convert to OpenAI format
            for (let i = 2; i < history.length; i++) {
                const item = history[i];
                messages.push({
                    role: item.role === 'model' ? 'assistant' : item.role,
                    content: item.parts[0].text
                });
            }
        }

        // Add the current user message
        messages.push({ role: "user", content: message });

        // Call the OpenAI compatible API with streaming
        const stream = await openai.chat.completions.create({
            model: "gemini-1.5-flash",
            messages: messages,
            stream: true
        });

        // Collect chunks and full response
        let fullResponse = '';
        let chunks = [];

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                fullResponse += content;
                chunks.push(content);
            }
        }

        // Format updated history in Gemini format for compatibility with existing app
        const updatedHistory = history.length === 0
            ? [
                { role: 'user', parts: [{ text: "Hi" }] },
                { role: 'model', parts: [{ text: "How can I help you today?" }] }
            ]
            : [...history];

        // Add the new messages to history
        updatedHistory.push(
            { role: "user", parts: [{ text: message }] },
            { role: "model", parts: [{ text: fullResponse }] }
        );

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chunks: chunks,
                response: fullResponse,
                history: updatedHistory
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process the request', details: error.message })
        };
    }
}; 