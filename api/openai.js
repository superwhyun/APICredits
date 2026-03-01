import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, startTime, endTime } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API Key is required' });

  const headers = { 'Authorization': `Bearer ${apiKey}` };

  try {
    const now = new Date();

    // Use provided timestamps or default to current month
    let startTs = startTime;
    let endTs = endTime;

    if (!startTs) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startTs = Math.floor(startOfMonth.getTime() / 1000);
    }

    // Build URL with optional end_time and limit 180 (max allowed)
    let url = `https://api.openai.com/v1/organization/costs?start_time=${startTs}&limit=180`;
    if (endTs) {
      url += `&end_time=${endTs}`;
    }

    console.log(`OpenAI Proxy Request: ${url}`);

    let total = 0;
    const response = await axios.get(url, {
      headers,
      timeout: 15000
    });

    if (response.data?.data) {
      response.data.data.forEach(bucket => {
        bucket.results?.forEach(r => {
          if (r.amount?.value) total += parseFloat(r.amount.value);
        });
      });
    }

    res.status(200).json({ total, debug: `Fetched ${response.data?.data?.length || 0} buckets` });

  } catch (error) {
    const apiError = error.response?.data;
    console.error('OpenAI Proxy Error:', JSON.stringify(apiError || error.message));

    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch usage',
      message: apiError?.error?.message || error.message,
      details: apiError
    });
  }
}
