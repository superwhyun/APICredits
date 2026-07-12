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

    let total = 0;
    let bucketCount = 0;
    let page = null;

    // Costs API returns max 180 daily buckets per page — follow pagination
    // so long ranges (e.g. balance anchor set months ago) are fully summed.
    do {
      let url = `https://api.openai.com/v1/organization/costs?start_time=${startTs}&limit=180`;
      if (endTs) url += `&end_time=${endTs}`;
      if (page) url += `&page=${encodeURIComponent(page)}`;

      const response = await axios.get(url, { headers, timeout: 15000 });
      const body = response.data;

      if (body?.data) {
        bucketCount += body.data.length;
        body.data.forEach(bucket => {
          bucket.results?.forEach(r => {
            if (r.amount?.value) total += parseFloat(r.amount.value);
          });
        });
      }

      page = body?.has_more ? body?.next_page : null;
    } while (page);

    res.status(200).json({ total, debug: `Fetched ${bucketCount} buckets` });

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
