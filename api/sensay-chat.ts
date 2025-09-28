export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API credentials from environment variables
  const organizationSecret = process.env.SENSAY_ORGANIZATION_SECRET;
  const userId = process.env.SENSAY_USER_ID;
  const replicaId = process.env.SENSAY_REPLICA_ID;

  if (!organizationSecret || !userId || !replicaId) {
    console.error('Missing required environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { content, skip_chat_history = false, source = "discord", discord_data } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const response = await fetch(`https://api.sensay.io/v1/replicas/${replicaId}/chat/completions`, {
      method: 'POST',
      headers: {
        'X-ORGANIZATION-SECRET': organizationSecret,
        'X-USER-ID': userId,
        'Content-Type': 'application/json',
        'X-API-Version': '2025-03-25'
      },
      body: JSON.stringify({
        content,
        skip_chat_history,
        source,
        discord_data: discord_data || {
          channel_id: "string",
          channel_name: "string",
          author_id: "string",
          author_name: "string",
          message_id: "string",
          created_at: "string",
          server_id: "string",
          server_name: "string"
        }
      })
    });

    if (!response.ok) {
      console.error('Sensay API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'External API error',
        status: response.status 
      });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('API handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
