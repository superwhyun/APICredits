import axios from 'axios';

// prepaid/balance response: { changes: [...], total: { val } }
// - All amounts are USD cents.
// - changes: PURCHASE/REFUND are negative (credit added), SPEND is positive (credit consumed).
// - total is the sum of changes, so a NEGATIVE total means credit remaining.
//   Remaining balance in dollars = -total.val / 100
const centsTotalToBalance = (total) => {
    const raw = typeof total === 'object' && total !== null
        ? parseFloat(total.val ?? total.amount ?? 0)
        : parseFloat(total ?? 0);
    if (isNaN(raw)) return null;
    return -raw / 100;
};

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
                const balRes = await axios.get(`${BASE_URL}/v1/billing/teams/${team.id}/prepaid/balance`, { headers });
                const balance = centsTotalToBalance(balRes.data?.total);
                logs.push(`prepaid/balance team=${team.id} total=${JSON.stringify(balRes.data?.total)} -> $${balance}`);

                if (balance !== null) {
                    if (!bestResult || balance > bestResult.balance) {
                        bestResult = { balance, team, note: 'prepaid credit balance' };
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
