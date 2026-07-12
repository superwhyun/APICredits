import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Key, ShieldCheck, LayoutDashboard, Info } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import CreditCard from './components/CreditCard';
import axios from 'axios';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', icon: 'zap' },
  { id: 'xai', name: 'x.ai (Grok)', icon: 'cpu' },
  { id: 'moonshot', name: 'Moonshot AI', icon: 'moon' },
  { id: 'runpod', name: 'RunPod', icon: 'zap' },
  { id: 'tavily', name: 'Tavily', icon: 'database' },
  { id: 'openrouter', name: 'OpenRouter', icon: 'zap' }
];

const isExtension = typeof globalThis.chrome !== 'undefined' && globalThis.chrome.runtime?.id;
const isLocalDev = typeof window !== 'undefined' &&
  (window.location.hostname.includes('localhost') ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.'));

const fetchTavilyUsage = async (apiKey) => {
  const response = await fetch('https://api.tavily.com/usage', {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.detail || data?.message || `Request failed with status ${response.status}`);
    error.response = { data, status: response.status };
    throw error;
  }

  return { data };
};

export default function App() {
  const [keys, setKeys] = useState(() => {
    const saved = localStorage.getItem('api_keys');
    return saved ? JSON.parse(saved) : { openai: '', xai: '', moonshot: '', runpod: '', tavily: '', openrouter: '' };
  });

  const [openaiCache, setOpenaiCache] = useState(() => {
    const saved = localStorage.getItem('openai_monthly_cache');
    return saved ? JSON.parse(saved) : {};
  });

  // OpenAI has no balance API — the user records their current balance once
  // (from platform.openai.com Billing) and we subtract costs accrued since then.
  const [openaiAnchor, setOpenaiAnchor] = useState(() => {
    const saved = localStorage.getItem('openai_balance_anchor');
    return saved ? JSON.parse(saved) : null;
  });
  const [anchorInput, setAnchorInput] = useState('');

  const [data, setData] = useState({ openai: null, xai: null, moonshot: null, runpod: null, tavily: null, openrouter: null });
  const [loading, setLoading] = useState({ openai: false, xai: false, moonshot: false, runpod: false, tavily: false, openrouter: false });
  const [progressMessages, setProgressMessages] = useState({ openai: '', xai: '', moonshot: '', runpod: '', tavily: '', openrouter: '' });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('api_keys', JSON.stringify(keys));
  }, [keys]);

  // Initial fetch on mount
  useEffect(() => {
    refreshAll();

    console.log('App Mode:', { isExtension, isLocalDev, host: window.location.hostname });

    // Fix extension popup size
    if (isExtension) {
      document.body.style.width = '800px';
      document.body.style.height = '600px';
      document.documentElement.style.width = '800px';
      document.documentElement.style.height = '600px';
      document.body.style.overflowY = 'auto';
      document.body.style.overflowX = 'hidden';
      document.documentElement.style.overflowY = 'auto';
      document.documentElement.style.overflowX = 'hidden';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sum of OpenAI costs (USD) between two unix timestamps, following pagination.
  const fetchOpenAICostsTotal = async (apiKey, startTs, endTs) => {
    if (isExtension || isLocalDev) {
      let total = 0;
      let page = null;
      do {
        let url = `https://api.openai.com/v1/organization/costs?start_time=${startTs}&limit=180`;
        if (endTs) url += `&end_time=${endTs}`;
        if (page) url += `&page=${encodeURIComponent(page)}`;
        const response = await axios.get(url, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const body = response.data;
        if (body?.data) {
          body.data.forEach(bucket => {
            bucket.results?.forEach(r => {
              if (r.amount?.value) total += parseFloat(r.amount.value);
            });
          });
        }
        page = body?.has_more ? body?.next_page : null;
      } while (page);
      return total;
    }
    const response = await axios.post(`/api/openai`, { apiKey, startTime: startTs, endTime: endTs });
    return response.data.total;
  };

  const fetchOpenAIData = async (forceHistory = false, anchorOverride = undefined) => {
    const providerId = 'openai';
    if (!keys[providerId]) return;

    const anchor = anchorOverride !== undefined ? anchorOverride : openaiAnchor;
    setLoading(prev => ({ ...prev, [providerId]: true }));
    let currentCache = forceHistory ? {} : { ...openaiCache };
    const now = new Date();

    try {
      // 1. Check/Fetch missing history (last 5 months)
      for (let i = 5; i >= 1; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = d.toLocaleString('ko-KR', { month: 'long' });

        if (currentCache[monthKey] === undefined) {
          setProgressMessages(prev => ({ ...prev, [providerId]: `${monthLabel} 요금 가져오는 중...` }));

          const startTs = Math.floor(d.getTime() / 1000);
          const endTs = Math.floor(new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() / 1000);

          currentCache[monthKey] = await fetchOpenAICostsTotal(keys[providerId], startTs, endTs);
          localStorage.setItem('openai_monthly_cache', JSON.stringify(currentCache));
          setOpenaiCache({ ...currentCache });
        }
      }

      // 2. Fetch current month always
      setProgressMessages(prev => ({ ...prev, [providerId]: `이번 달 요금 가져오는 중...` }));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthTotal = await fetchOpenAICostsTotal(keys[providerId], Math.floor(startOfMonth.getTime() / 1000));

      // 3. Remaining balance = anchor amount - costs accrued since the anchor
      let balance = null;
      let sinceAnchorUsage = null;
      if (anchor?.amount != null && anchor?.ts) {
        setProgressMessages(prev => ({ ...prev, [providerId]: `잔액 계산 중...` }));
        sinceAnchorUsage = await fetchOpenAICostsTotal(keys[providerId], anchor.ts);
        balance = anchor.amount - sinceAnchorUsage;
      }

      setData(prev => ({
        ...prev,
        [providerId]: {
          current_month_total: currentMonthTotal,
          history: currentCache,
          balance,
          anchor,
          since_anchor_usage: sinceAnchorUsage
        }
      }));
    } catch (error) {
      console.error(`Error fetching openai:`, error);
      setData(prev => ({ ...prev, [providerId]: { error: 'Failed to fetch usage', message: error.message } }));
    } finally {
      setLoading(prev => ({ ...prev, [providerId]: false }));
      setProgressMessages(prev => ({ ...prev, [providerId]: '' }));
    }
  };

  const fetchData = async (providerId) => {
    if (providerId === 'openai') {
      return fetchOpenAIData();
    }

    if (!keys[providerId]) return;

    setLoading(prev => ({ ...prev, [providerId]: true }));
    try {
      let response;
      const apiKey = keys[providerId];
      if (providerId === 'tavily' && (isExtension || isLocalDev)) {
        response = await fetchTavilyUsage(apiKey);
      } else if (isExtension || isLocalDev) {
        const headers = { 'Authorization': `Bearer ${apiKey}` };

        if (providerId === 'xai' && !isExtension) {
          response = await axios.post('/api/xai', { apiKey });
        } else if (providerId === 'xai') {
          const baseMgmtUrl = 'https://management-api.x.ai';
          let teams = [];
          try {
            const validRes = await axios.get(`${baseMgmtUrl}/auth/management-keys/validation`, { headers });
            if (validRes.data.team) teams.push(validRes.data.team);
            if (validRes.data.teams) teams = [...teams, ...validRes.data.teams];
            if (validRes.data.teamId) teams.push({ id: validRes.data.teamId, name: validRes.data.teamName || 'Professional Team' });
          } catch {
            // Ignore validation lookup failures and try fallback endpoints.
          }

          if (teams.length === 0) {
            try {
              const teamsRes = await axios.get(`${baseMgmtUrl}/v1/teams`, { headers });
              const foundTeams = teamsRes.data.teams || (Array.isArray(teamsRes.data) ? teamsRes.data : [teamsRes.data]);
              if (foundTeams) teams = Array.isArray(foundTeams) ? foundTeams : [foundTeams];
            } catch {
              // Ignore team discovery failures and continue with other endpoints.
            }
          }

          const uniqueTeams = Array.from(new Map(teams.filter(t => t && t.id).map(t => [t.id, t])).values());
          let bestResult = null;

          // prepaid/balance: all amounts are USD cents. PURCHASE/REFUND changes are
          // negative (credit added), SPEND is positive, so a NEGATIVE total means
          // credit remaining. Remaining dollars = -total.val / 100
          const centsTotalToBalance = (total) => {
            const raw = typeof total === 'object' && total !== null
              ? parseFloat(total.val ?? total.amount ?? 0)
              : parseFloat(total ?? 0);
            if (isNaN(raw)) return null;
            return -raw / 100;
          };

          for (const team of uniqueTeams) {
            // 1. Prepaid credit balance
            try {
              const balRes = await axios.get(`${baseMgmtUrl}/v1/billing/teams/${team.id}/prepaid/balance`, { headers });
              const balance = centsTotalToBalance(balRes.data?.total);
              if (balance !== null) {
                if (!bestResult || balance > bestResult.balance) {
                  bestResult = { balance, team, note: 'prepaid credit balance' };
                }
                continue;
              }
            } catch { /* ignore */ }

            // 2. Prepaid unavailable (pure postpaid team) -> current spend vs limit
            try {
              const spendingRes = await axios.get(`${baseMgmtUrl}/v1/billing/teams/${team.id}/postpaid/spending-limits`, { headers });
              if (spendingRes.data.spending_limits?.monthly_limit > 0) {
                const spend = Number(spendingRes.data.spending_limits?.current_spend || 0);
                const limit = Number(spendingRes.data.spending_limits?.monthly_limit);
                bestResult = { balance: spend, team: team, isPostpaid: true, limit: limit };
                break;
              }
            } catch { /* ignore */ }
          }
          response = { data: bestResult || { balance: 0, team: uniqueTeams[0], note: 'No prepaid balance or spending limit found in any team.' } };
        } else if (providerId === 'moonshot') {
          response = await axios.get('https://api.moonshot.ai/v1/users/me/balance', { headers });
        } else if (providerId === 'runpod') {
          const gqlResponse = await axios.post(
            `https://api.runpod.io/graphql?api_key=${apiKey}`,
            { query: `query { myself { clientBalance } }` },
            { headers: { 'Content-Type': 'application/json' } }
          );
          if (gqlResponse.data.errors) throw new Error(gqlResponse.data.errors[0].message);
          response = { data: { balance: Number(gqlResponse.data.data?.myself?.clientBalance || 0) } };
        } else if (providerId === 'openrouter') {
          response = await axios.get('https://openrouter.ai/api/v1/credits', { headers });
        }
      } else {
        response = await axios.post(`/api/${providerId}`, { apiKey });
      }

      setData(prev => ({ ...prev, [providerId]: response.data }));
    } catch (error) {
      console.error(`Error fetching ${providerId}:`, error);
      setData(prev => ({ ...prev, [providerId]: error.response?.data || { error: 'Failed to fetch', message: error.message } }));
    } finally {
      setLoading(prev => ({ ...prev, [providerId]: false }));
    }
  };

  const refreshAll = () => {
    PROVIDERS.forEach(p => fetchData(p.id));
  };

  return (
    <div className={`min-h-screen bg-[#0c0c0e] text-[#e2e2e7] transition-colors duration-500 font-inter ${isExtension ? 'w-[800px] h-[600px] overflow-y-auto overflow-x-hidden' : ''}`}>
      <nav className="border-b border-white/5 bg-white/2 backdrop-blur-xl sticky top-0 z-50 overflow-hidden">
        <div className={`${isExtension ? 'w-full' : 'max-w-6xl'} mx-auto px-6 h-16 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              AI Credit Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={refreshAll}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
              title="Refresh All"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-all ${showSettings ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className={`${isExtension ? 'w-full px-4' : 'max-w-6xl mx-auto px-6'} ${isExtension ? 'py-4' : 'py-12'}`}>
        <AnimatePresence>
          {showSettings && (
            <Motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-12"
            >
              <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <Key size={20} className="text-blue-500" />
                  <h2 className="text-lg font-semibold">API Settings</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {PROVIDERS.map(p => (
                    <div key={p.id} className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 px-1">{p.name} Key</label>
                      <input
                        type="password"
                        value={keys[p.id]}
                        onChange={(e) => setKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                        className="w-full bg-[#16161a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                        placeholder="sk-..."
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-white/5">
                  <label className="text-sm font-medium text-gray-400 px-1">OpenAI 현재 잔액 (기준점)</label>
                  <p className="text-[10px] text-gray-600 px-1 mt-1 leading-relaxed">
                    OpenAI는 잔액 조회 API를 제공하지 않습니다. platform.openai.com → Billing에서 현재 잔액을 확인해 입력하면,
                    이후 사용량을 차감해 잔액을 계산합니다. 크레딧을 충전하면 다시 설정하세요.
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={anchorInput}
                      onChange={(e) => setAnchorInput(e.target.value)}
                      className="w-40 bg-[#16161a] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                      placeholder="예: 42.50"
                    />
                    <button
                      onClick={() => {
                        const amount = parseFloat(anchorInput);
                        if (isNaN(amount) || amount < 0) {
                          alert('올바른 금액을 입력해주세요.');
                          return;
                        }
                        const anchor = { amount, ts: Math.floor(Date.now() / 1000) };
                        localStorage.setItem('openai_balance_anchor', JSON.stringify(anchor));
                        setOpenaiAnchor(anchor);
                        setAnchorInput('');
                        fetchOpenAIData(false, anchor);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-xs transition-colors"
                    >
                      잔액 기준 설정
                    </button>
                    {openaiAnchor && (
                      <>
                        <span className="text-xs text-gray-500">
                          현재 기준: <span className="text-blue-400 font-mono">${Number(openaiAnchor.amount).toFixed(2)}</span>
                          {' '}({new Date(openaiAnchor.ts * 1000).toLocaleDateString('ko-KR')})
                        </span>
                        <button
                          onClick={() => {
                            localStorage.removeItem('openai_balance_anchor');
                            setOpenaiAnchor(null);
                            fetchOpenAIData(false, null);
                          }}
                          className="text-xs text-red-400/70 hover:text-red-300 underline"
                        >
                          해제
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <ShieldCheck size={14} className="text-green-500" />
                      Keys are stored locally in your browser.
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('OpenAI 캐시를 초기화하시겠습니까? 모든 월별 데이터를 새로 가져옵니다.')) {
                          localStorage.removeItem('openai_monthly_cache');
                          setOpenaiCache({});
                          alert('캐시가 초기화되었습니다. 새로고침 시 데이터를 다시 가져옵니다.');
                        }
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      Clear OpenAI Cache
                    </button>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="bg-white text-black px-6 py-2 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${isExtension ? 'lg:grid-cols-2 gap-4' : 'lg:grid-cols-4 gap-8'} items-stretch`}>
          {PROVIDERS.map(provider => (
            <CreditCard
              key={provider.id}
              provider={provider}
              data={data[provider.id]}
              loading={loading[provider.id]}
              progressMessage={progressMessages[provider.id]}
              onRefresh={() => fetchData(provider.id)}
              isExtension={isExtension}
            />
          ))}
        </div>

        {!keys.openai && !keys.xai && !keys.moonshot && !keys.runpod && !keys.tavily && !keys.openrouter && !showSettings && (
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-24 text-center space-y-4"
          >
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Info className="text-blue-500" size={32} />
            </div>
            <h3 className="text-2xl font-bold">Welcome to AI Credit Dashboard</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Please enter your API keys in settings to monitor your usage across different AI providers.
            </p>
            <button
              onClick={() => setShowSettings(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-semibold transition-all shadow-xl shadow-blue-600/20"
            >
              Setup API Keys
            </button>
          </Motion.div>
        )}
      </main>

      {!isExtension && (
        <footer className="py-12 border-t border-white/5 text-center text-sm text-gray-600">
          <p>© 2026 Premium AI Credit Tracker • Private & Secure</p>
        </footer>
      )}
    </div>
  );
}
