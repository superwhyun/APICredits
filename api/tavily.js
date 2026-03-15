import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).json({ error: 'API Key is required' });
    }

    try {
        const response = await axios.get('https://api.tavily.com/usage', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            timeout: 15000
        });

        res.status(200).json(response.data);
    } catch (error) {
        const apiError = error.response?.data;
        console.error('Tavily Proxy Error:', JSON.stringify(apiError || error.message));

        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch Tavily usage',
            message: apiError?.detail || apiError?.message || error.message,
            details: apiError
        });
    }
}
