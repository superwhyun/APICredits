import axios from 'axios';
import { XAI_MANAGEMENT_BASE_URL, fetchPrepaidBalance } from '../src/lib/xaiBalance.js';

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
        const BASE_URL = XAI_MANAGEMENT_BASE_URL;

        // 1. Discover Teams
        let teams = [];
        try {
            const validRes = await axios.get(`${BASE_URL}/auth/management-keys/validation`, { headers });
            if (validRes.data.team) teams.push(validRes.data.team);
            if (validRes.data.teams) teams = [...teams, ...validRes.data.teams];
            if (validRes.data.teamId) teams.push({ id: validRes.data.teamId, name: validRes.data.teamName || 'Professional Team' });
        } catch {
            // Ignore validation lookup failures and try alternative team discovery.
        }

        if (teams.length === 0) {
            try {
                const teamsRes = await axios.get(`${BASE_URL}/v1/teams`, { headers });
                const foundTeams = teamsRes.data.teams || (Array.isArray(teamsRes.data) ? teamsRes.data : [teamsRes.data]);
                if (foundTeams) teams = Array.isArray(foundTeams) ? foundTeams : [foundTeams];
            } catch {
                // Ignore team listing failures and continue with any discovered teams.
            }
        }

        // Deduplicate
        const uniqueTeams = Array.from(new Map(teams.filter(t => t && t.id).map(t => [t.id, t])).values());

        if (uniqueTeams.length === 0) {
            return res.status(200).json({ balance: 0, note: 'No teams discovered. Ensure this is a Management API Key.' });
        }

        // 2. Fetch prepaid balance per team
        let bestResult = null;
        let logs = [];

        for (const team of uniqueTeams) {
            try {
                const result = await fetchPrepaidBalance({
                    teamId: team.id,
                    get: (url) => axios.get(url, { headers }).then(r => r.data),
                    post: (url, body) => axios.post(url, body, { headers }).then(r => r.data),
                });
                logs.push(`prepaid/balance team=${team.id} settled=$${result?.settledBalance} pending=$${result?.pendingUsage} since=${result?.pendingUsageSince} usageError=${result?.usageError}`);

                if (result !== null) {
                    if (!bestResult || result.balance > bestResult.balance) {
                        bestResult = { ...result, team, note: 'prepaid credit balance' };
                    }
                    continue;
                }
            } catch (e) {
                logs.push(`FAIL: prepaid/balance team=${team.id} (${e.response?.status || e.message})`);
            }

            // Prepaid balance unavailable (e.g. pure postpaid team) -> check postpaid spending
            try {
                const spendingRes = await axios.get(`${BASE_URL}/v1/billing/teams/${team.id}/postpaid/spending-limits`, { headers });
                if (spendingRes.data.spending_limits?.monthly_limit > 0) {
                    return res.status(200).json({
                        balance: spendingRes.data.spending_limits?.current_spend || 0,
                        limit: spendingRes.data.spending_limits?.monthly_limit,
                        isPostpaid: true,
                        team: team,
                        debug: logs
                    });
                }
            } catch (e) {
                logs.push(`FAIL: postpaid/spending-limits team=${team.id} (${e.response?.status || e.message})`);
            }
        }

        res.status(200).json({
            ...(bestResult ?? {}),
            balance: bestResult?.balance ?? 0,
            team: bestResult?.team || uniqueTeams[0],
            note: bestResult ? bestResult.note : 'No prepaid balance or spending limit found in any team.',
            debug: logs
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
