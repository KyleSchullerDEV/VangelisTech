import { createClient } from 'redis';
import OpenAI from "openai";
import { NextResponse } from "next/server";

// Initialize the OpenAI client with your API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Connect to your Redis instance with Redis Labs connection details
const redisClient = createClient({
  password: process.env.REDIS_PASSWORD, // Use environment variable for the password
  socket: {
    host: process.env.REDIS_HOST, // Use environment variable for the host
    port: process.env.REDIS_PORT, // Use environment variable for the port, ensure it's a number if required
  }
});
redisClient.connect();

export const runtime = "edge";

// The rest of the serverless function remains the same
export default async function handler(req) {
  // Allow only POST requests
  if (req.method !== "POST") {
    return new NextResponse(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  try {
    // Extracting the message and conversation ID from the request body
    const { message, conversationId } = await req.json();

    // Retrieve conversation history from Redis
    const conversationHistoryJson = await redisClient.get(conversationId);
    const conversationHistory = conversationHistoryJson ? JSON.parse(conversationHistoryJson) : [];

    // Generate response using the OpenAI Chat API
    const response = await callOpenAI(conversationHistory, message);

    // Update conversation history in Redis
    const newHistory = [...conversationHistory, { role: "user", content: message }, { role: "assistant", content: response }];
    await redisClient.set(conversationId, JSON.stringify(newHistory));

    // Return the AI's response
    return new NextResponse(JSON.stringify({ response }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

// Function to call OpenAI and return the response
async function callOpenAI(conversationHistory, message) {
  try {
    // Adjust the request as needed for your use case
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or whichever model you're using
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        ...conversationHistory.map(({ role, content }) => ({ role, content })),
        { role: "user", content: message },
      ],
    });

    // Extract the response text from the completion object
    const responseText = completion.data.choices[0].message.content;
    return responseText;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return "I encountered an error while processing your request."; // Fallback response
  }
}
