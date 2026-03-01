import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Key, ShieldCheck, Moon, Sun, LayoutDashboard, Database, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreditCard from './components/CreditCard';
import axios from 'axios';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', icon: 'zap' },
  { id: 'xai', name: 'x.ai (Grok)', icon: 'cpu' },
  { id: 'moonshot', name: 'Moonshot AI', icon: 'moon' },
  { id: 'runpod', name: 'RunPod', icon: 'zap' }
];

export default function App() {
  const [keys, setKeys] = useState(() => {
    const saved = localStorage.getItem('api_keys');
    return saved ? JSON.parse(saved) : { openai: '', xai: '', moonshot: '', runpod: '' };
  });

  const [openaiCache, setOpenaiCache] = useState(() => {
    const saved = localStorage.getItem('openai_monthly_cache');
    return saved ? JSON.parse(saved) : {};
  });

  const [data, setData] = useState({ openai: null, xai: null, moonshot: null });
  const [loading, setLoading] = useState({ openai: false, xai: false, moonshot: false });
  const [progressMessages, setProgressMessages] = useState({ openai: '', xai: '', moonshot: '' });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('api_keys', JSON.stringify(keys));
  }, [keys]);

  // Initial fetch on mount
  useEffect(() => {
    refreshAll();
  }, []);

  const fetchOpenAIData = async (forceHistory = false) => {
    const providerId = 'openai';
    if (!keys[providerId]) return;

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

          const response = await axios.post(`/api/openai`, {
            apiKey: keys[providerId],
            startTime: startTs,
            endTime: endTs
          });

          currentCache[monthKey] = response.data.total;
          localStorage.setItem('openai_monthly_cache', JSON.stringify(currentCache));
          setOpenaiCache({ ...currentCache });
        }
      }

      // 2. Fetch current month always
      setProgressMessages(prev => ({ ...prev, [providerId]: `이번 달 요금 가져오는 중...` }));
      const response = await axios.post(`/api/openai`, { apiKey: keys[providerId] });

      setData(prev => ({
        ...prev,
        [providerId]: {
          current_month_total: response.data.total,
          history: currentCache
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
      const response = await axios.post(`/api/${providerId}`, { apiKey: keys[providerId] });
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
    <div className="min-h-screen bg-[#0c0c0e] text-[#e2e2e7] transition-colors duration-500 font-inter">
      <nav className="border-b border-white/5 bg-white/2 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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

      <main className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence>
          {showSettings && (
            <motion.div
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
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
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
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
          {PROVIDERS.map(provider => (
            <CreditCard
              key={provider.id}
              provider={provider}
              data={data[provider.id]}
              loading={loading[provider.id]}
              progressMessage={progressMessages[provider.id]}
              onRefresh={() => fetchData(provider.id)}
            />
          ))}
        </div>

        {!keys.openai && !keys.xai && !keys.moonshot && !showSettings && (
          <motion.div
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
          </motion.div>
        )}
      </main>

      <footer className="py-12 border-t border-white/5 text-center text-sm text-gray-600">
        <p>© 2026 Premium AI Credit Tracker • Private & Secure</p>
      </footer>
    </div>
  );
}
