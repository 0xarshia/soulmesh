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
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const prompt = `girl/boy im flirting with said this in messages "${message}" and put your answer in json of "Answer1 to 6" come with 3 positive answer options from soft to more hardcore and closer use young gen slangs(important) never talk like robot and boring boomer talk like gen z and playfull also never talk like you talking with ranadom human and formal (ALWAYS ACT LIKE YOU DONT NEED THEM AND BE COOL DONT BE THIRSTY AND DESEPRETE AT ALL  COST DONT EVEN LEAN INTO IT SO NO USE OF EMOJIES AT ALL DONT LOOK SIMP YOU ARE COOL HUMAN WITH MILIONS OF OPTION DONT ACT DESEPRATE) and 3 negative (not in terms of being rude just rejecting the said thing) answers`;

    const response = await fetch(`https://api.sensay.io/v1/replicas/${replicaId}/chat/completions`, {
      method: 'POST',
      headers: {
        'X-ORGANIZATION-SECRET': organizationSecret,
        'X-USER-ID': userId,
        'Content-Type': 'application/json',
        'X-API-Version': '2025-03-25'
      },
      body: JSON.stringify({
        content: prompt,
        skip_chat_history: false,
        source: "discord",
        discord_data: {
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
