import OpenAI from "openai";

const { Client } = require("pg");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
});
client.connect();

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const { message, conversationId } = req.body;
    
    // Retrieve conversation history from Postgres
    const result = await client.query(
      "SELECT * FROM conversations WHERE conversation_id = $1",
      [conversationId]
    );
    const conversationHistory = result.rows[0]?.history || [];
    
    // Generate response using GPT-3.5 API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        ...conversationHistory,
        { role: "user", content: message },
      ],
    });
    
    const response = completion.data.choices[0].message.content;
    
    // Update conversation history in Postgres
    const newHistory = [...conversationHistory, { role: "user", content: message }, { role: "assistant", content: response }];
    await client.query(
      "INSERT INTO conversations (conversation_id, history) VALUES ($1, $2) ON CONFLICT (conversation_id) DO UPDATE SET history = $2",
      [conversationId, JSON.stringify(newHistory)]
    );
    
    res.status(200).json({ response });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};