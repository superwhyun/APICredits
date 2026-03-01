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
        const url = `https://api.runpod.io/graphql?api_key=${apiKey}`;
        const response = await axios.post(
            url,
            {
                query: `
                    query {
                        myself {
                            clientBalance
                        }
                    }
                `
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        const data = response.data;

        if (data.errors) {
            const firstError = data.errors[0];
            return res.status(400).json({
                error: 'RunPod API Error',
                message: firstError.message,
                code: firstError.extensions?.code || 'BAD_REQUEST',
                details: data.errors
            });
        }

        // Return expected format: { balance: 12.34 }
        const balanceValue = data.data?.myself?.clientBalance;
        if (balanceValue === undefined) {
            return res.status(200).json({
                balance: 0,
                note: 'Balance field not found in response',
                debug: data.data
            });
        }

        res.status(200).json({
            balance: balanceValue
        });
    } catch (error) {
        const apiError = error.response?.data;
        console.error('RunPod Proxy Error:', JSON.stringify(apiError || error.message));
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch RunPod credit info',
            message: apiError?.errors?.[0]?.message || error.message,
            details: apiError
        });
    }
}
