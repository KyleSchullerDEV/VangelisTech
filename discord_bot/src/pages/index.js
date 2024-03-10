import { useState } from 'react';

export default function Home() {
  const [conversationId, setConversationId] = useState('');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the form from submitting in the traditional way

    const res = await fetch('/api/felicity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId, message }),
    });

    if (res.ok) {
      const data = await res.json();
      setResponse(data.response);
    } else {
      console.error('Error:', res.status);
      setResponse('Failed to get a response. Please check the console for errors.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>AI Assistant Tester</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div>
          <label htmlFor="conversationId" style={{ marginRight: '10px' }}>Conversation ID:</label>
          <input
            type="text"
            id="conversationId"
            value={conversationId}
            onChange={(e) => setConversationId(e.target.value)}
            style={{ marginRight: '10px' }}
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="message" style={{ marginRight: '10px' }}>Message:</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="4"
            style={{ marginRight: '10px', width: '300px' }}
          ></textarea>
        </div>
        <button type="submit" style={{ marginTop: '10px' }}>Send</button>
      </form>
      {response && (
        <div>
          <h2>Response:</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
