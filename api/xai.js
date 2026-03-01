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

        // Management API Base URL
        const BASE_URL = 'https://management-api.x.ai';

        // 1. Discover Teams
        let teams = [];
        try {
            const validRes = await axios.get(`${BASE_URL}/auth/management-keys/validation`, { headers });
            if (validRes.data.team) teams.push(validRes.data.team);
            if (validRes.data.teams) teams = [...teams, ...validRes.data.teams];
            if (validRes.data.teamId) teams.push({ id: validRes.data.teamId, name: validRes.data.teamName || 'Professional Team' });
        } catch (e) { }

        if (teams.length === 0) {
            try {
                const teamsRes = await axios.get(`${BASE_URL}/v1/teams`, { headers });
                const foundTeams = teamsRes.data.teams || (Array.isArray(teamsRes.data) ? teamsRes.data : [teamsRes.data]);
                if (foundTeams) teams = Array.isArray(foundTeams) ? foundTeams : [foundTeams];
            } catch (e) { }
        }

        // Deduplicate
        const uniqueTeams = Array.from(new Map(teams.filter(t => t && t.id).map(t => [t.id, t])).values());

        if (uniqueTeams.length === 0) {
            return res.status(200).json({ balance: 0, note: 'No teams discovered. Ensure this is a Management API Key.' });
        }

        // 2. Search for balance across all teams
        let bestResult = null;
        let logs = [];

        for (const team of uniqueTeams) {
            const endpoints = [
                `/v1/billing/teams/${team.id}/prepaid/balance`,
                `/v1/billing/teams/${team.id}/balance`,
                `/v1/billing/teams/${team.id}/usage`
            ];

            for (const endpoint of endpoints) {
                try {
                    const bRes = await axios.get(`${BASE_URL}${endpoint}`, { headers });
                    const rawData = bRes.data;
                    const keys = Object.keys(rawData).join(', ');
                    logs.push(`SUCCESS: ${endpoint} (Keys: ${keys})`);

                    let b = 0;
                    if (rawData.total !== undefined) {
                        const t = rawData.total;
                        const val = typeof t === 'object' ? (t.amount || t.val || 0) : t;
                        b = parseFloat(val);
                    } else {
                        b = rawData.balance || rawData.available_balance || rawData.amount || 0;
                    }

                    if (b !== 0) {
                        const absB = Math.abs(b);
                        const displayBalance = absB > 100000 ? absB / 1000000 : (absB > 1000 ? absB / 100 : absB);

                        const result = {
                            balance: displayBalance,
                            team: team,
                            note: `Balance found via ${endpoint}`,
                            debug: logs
                        };

                        // If it's the prepaid balance endpoint, return immediately as it's most authoritative
                        if (endpoint.includes('prepaid/balance')) return res.status(200).json(result);
                        if (!bestResult || displayBalance > bestResult.balance) bestResult = result;
                    }
                } catch (e) {
                    logs.push(`FAIL: ${endpoint} (${e.response?.status || e.message})`);
                }
            }

            // Check postpaid
            try {
                const spendingRes = await axios.get(`${BASE_URL}/v1/billing/teams/${team.id}/postpaid/spending-limits`, { headers }).catch(() => null);
                if (spendingRes && spendingRes.data.spending_limits?.monthly_limit > 0) {
                    return res.status(200).json({
                        balance: spendingRes.data.spending_limits?.current_spend || 0,
                        limit: spendingRes.data.spending_limits?.monthly_limit,
                        isPostpaid: true,
                        team: team,
                        debug: logs
                    });
                }
            } catch (e) { }
        }

        res.status(200).json({
            balance: bestResult?.balance || 0,
            team: uniqueTeams[0],
            note: bestResult ? undefined : 'No active balance or spending limit found in any team.'
        });
    } catch (error) {
        const errorData = error.response?.data || {};
        const message = errorData.error || errorData.message || error.message;
        console.error('x.ai Proxy Error:', message);
        res.status(error.response?.status || 500).json({
            error: `x.ai Proxy Error: ${message}`,
            details: errorData
        });
    }
}
