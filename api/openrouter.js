import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API Key is required' });

  const headers = { 'Authorization': `Bearer ${apiKey}` };

  try {
    const url = 'https://openrouter.ai/api/v1/credits';
    console.log(`OpenRouter Proxy Request: ${url}`);

    const response = await axios.get(url, {
      headers,
      timeout: 15000
    });

    res.status(200).json(response.data);

  } catch (error) {
    const apiError = error.response?.data;
    console.error('OpenRouter Proxy Error:', JSON.stringify(apiError || error.message));

    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch OpenRouter usage',
      message: apiError?.error?.message || error.message,
      details: apiError
    });
  }
}
