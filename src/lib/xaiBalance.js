// Shared xAI prepaid-balance math. Used by both the Vercel proxy (api/xai.js)
// and the Chrome-extension direct path (src/App.jsx).
//
// GET /v1/billing/teams/{id}/prepaid/balance -> { changes: [...], total: { val } }
// - All amounts are USD cents.
// - PURCHASE/REFUND changes are negative (credit added), SPEND is positive.
// - total is the settled ledger, so a NEGATIVE total means credit remaining.
// - SPEND entries are NOT real-time: xAI posts one SPEND per calendar month,
//   covering the PREVIOUS month's usage, around the 10th-12th of the next month.
//   Usage since the last settled month is therefore missing from `total` and
//   must be fetched from POST /v1/billing/teams/{id}/usage and subtracted.

export const XAI_MANAGEMENT_BASE_URL = 'https://management-api.x.ai';

export const centsTotalToBalance = (total) => {
    const raw = typeof total === 'object' && total !== null
        ? parseFloat(total.val ?? total.amount ?? 0)
        : parseFloat(total ?? 0);
    if (isNaN(raw)) return null;
    return -raw / 100;
};

const pad2 = (n) => String(n).padStart(2, '0');

// xAI analytics API expects "YYYY-MM-DD HH:MM:SS" in the requested timezone (we use UTC).
export const formatUtcDateTime = (date) =>
    `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())} ` +
    `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}:${pad2(date.getUTCSeconds())}`;

const parseChangeTs = (change) => {
    const ts = Date.parse(change?.createTs ?? change?.createTime ?? '');
    return isNaN(ts) ? null : ts;
};

// A SPEND posted in month M settles usage for month M-1, so the first
// unsettled month is M itself. Returns the UTC start of that month, the start
// of the earliest change's month when no SPEND exists yet, or null when the
// ledger is empty.
export const unsettledUsageStart = (changes = []) => {
    let latestSpendTs = null;
    let earliestTs = null;

    for (const change of changes) {
        const ts = parseChangeTs(change);
        if (ts === null) continue;
        if (earliestTs === null || ts < earliestTs) earliestTs = ts;
        if (change.changeOrigin !== 'SPEND') continue;
        if (latestSpendTs === null || ts > latestSpendTs) latestSpendTs = ts;
    }

    const anchorTs = latestSpendTs ?? earliestTs;
    if (anchorTs === null) return null;

    const anchor = new Date(anchorTs);
    return new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
};

export const buildUsageRequest = (start, end = new Date()) => ({
    analyticsRequest: {
        timeRange: {
            startTime: formatUtcDateTime(start),
            endTime: formatUtcDateTime(end),
            timezone: 'Etc/GMT',
        },
        timeUnit: 'TIME_UNIT_MONTH',
        values: [{ name: 'usd', aggregation: 'AGGREGATION_SUM' }],
        groupBy: [],
        filters: [],
    },
});

// Response: { timeSeries: [{ dataPoints: [{ timestamp, values: [usd] }] }] }
export const sumUsageUsd = (usageResponse) => {
    const series = usageResponse?.timeSeries ?? [];
    return series.reduce((total, s) => {
        const points = s?.dataPoints ?? [];
        return total + points.reduce((acc, p) => {
            const v = Number(p?.values?.[0]);
            return isNaN(v) ? acc : acc + v;
        }, 0);
    }, 0);
};

// Fetches prepaid balance + unsettled usage for one team.
// `get(url)` / `post(url, body)` must resolve to the parsed response body.
// Never throws on the usage step: a failure there degrades to the settled
// balance with `usageError` set so the UI can flag it.
export const fetchPrepaidBalance = async ({ get, post, teamId }) => {
    const base = `${XAI_MANAGEMENT_BASE_URL}/v1/billing/teams/${teamId}`;
    const ledger = await get(`${base}/prepaid/balance`);
    const settledBalance = centsTotalToBalance(ledger?.total);
    if (settledBalance === null) return null;

    const usageStart = unsettledUsageStart(ledger?.changes);
    let pendingUsage = 0;
    let usageError = null;

    if (usageStart) {
        try {
            const usage = await post(`${base}/usage`, buildUsageRequest(usageStart));
            pendingUsage = sumUsageUsd(usage);
        } catch (e) {
            usageError = e?.response?.status ? `HTTP ${e.response.status}` : (e?.message || 'unknown error');
        }
    }

    return {
        balance: settledBalance - pendingUsage,
        settledBalance,
        pendingUsage,
        pendingUsageSince: usageStart ? usageStart.toISOString() : null,
        usageError,
    };
};
