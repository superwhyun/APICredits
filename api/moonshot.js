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
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
        };

        const domains = ['api.moonshot.cn', 'api.moonshot.ai'];
        let lastError = null;

        for (const domain of domains) {
            try {
                const response = await axios.get(`https://${domain}/v1/users/me/balance`, { headers });
                return res.status(200).json(response.data);
            } catch (error) {
                lastError = error;
                // If it's not an authentication error, don't just keep trying domains if it's e.g. a network error
                if (error.response?.status !== 401 && error.response?.data?.error?.type !== 'invalid_authentication_error') {
                    break;
                }
            }
        }

        const errorData = lastError.response?.data || {};
        res.status(lastError.response?.status || 500).json({
            error: `Moonshot Proxy Error: ${errorData.error?.message || lastError.message}`,
            details: errorData,
            note: 'Tried both api.moonshot.cn and api.moonshot.ai. Please check if your API key is correct.'
        });
    } catch (error) {
        console.error('Moonshot Proxy Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch Moonshot AI credit info',
            details: error.response?.data || error.message
        });
    }
}
