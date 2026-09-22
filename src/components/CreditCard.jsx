import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertCircle, TrendingUp, Wallet, Zap, Cpu, Moon, Info, Database, Triangle } from 'lucide-react';

const ICON_MAP = {
    zap: Zap,
    cpu: Cpu,
    moon: Moon,
    database: Database,
    triangle: Triangle
};

export default function CreditCard({ provider, data, loading, progressMessage, onRefresh, isExtension }) {
    const Icon = ICON_MAP[provider.icon] || Zap;
    const [isExpanded, setIsExpanded] = React.useState(false);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <RefreshCw className="animate-spin text-blue-500" size={32} />
                    <div className="text-center">
                        <p className="text-sm text-gray-500 font-medium">Fetching details...</p>
                        {progressMessage && (
                            <p className="text-[10px] text-blue-400 mt-2 font-mono animate-pulse">{progressMessage}</p>
                        )}
                    </div>
                </div>
            );
        }

        if (!data) {
            return (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                    <AlertCircle className="text-gray-600" size={32} />
                    <p className="text-sm text-gray-500">No data available. Please check your API key.</p>
                </div>
            );
        }

        if (data.error) {
            // Error bodies can arrive as a string, or as a nested object (e.g. an
            // OpenAI/OpenRouter-style { message, code } shape). Rendering an object
            // directly as a React child throws and unmounts the whole app, so always
            // reduce to a string here.
            const toErrorText = (value, fallback) => {
                if (typeof value === 'string') return value;
                if (value && typeof value === 'object') return value.message || JSON.stringify(value);
                return fallback;
            };
            const errorTitle = toErrorText(data.error, 'Failed to fetch');
            const errorDetail = toErrorText(data.message, 'Check your permissions.');

            return (
                <div className={`${isExtension ? 'p-2' : 'p-4'} rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-2`}>
                    <AlertCircle size={isExtension ? 14 : 18} className="shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                        <p className="font-semibold">{errorTitle}</p>
                        {!isExtension && <p className="opacity-80 leading-relaxed text-[10px]">{errorDetail}</p>}
                    </div>
                </div>
            );
        }

        // Provider Specific Rendering
        if (provider.id === 'openai') {
            const currentMonth = data.current_month_total || 0;
            const historyMap = data.history || {};

            const historyArray = Object.entries(historyMap).map(([key, value]) => ({
                month: key,
                total: value
            })).sort((a, b) => b.month.localeCompare(a.month));

            const totalHistory = historyArray.reduce((acc, curr) => acc + curr.total, 0);
            const totalAggregated = currentMonth + totalHistory;
            const hasBalance = data.balance !== null && data.balance !== undefined;

            return (
                <div className={isExtension ? 'space-y-3' : 'space-y-6'}>
                    <div className="flex justify-between items-end">
                        <div className="flex-1">
                            {hasBalance ? (
                                <>
                                    {!isExtension && <p className="text-xs text-green-400 uppercase tracking-widest mb-1 font-bold">Available Balance</p>}
                                    <h3 className={isExtension ? 'text-2xl font-bold' : 'text-4xl font-bold'}>${Number(data.balance).toFixed(2)}</h3>
                                    {!isExtension && data.anchor && (
                                        <p className="text-[9px] text-gray-500 mt-1 italic">
                                            {new Date(data.anchor.ts * 1000).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })} 기준 ${Number(data.anchor.amount).toFixed(2)} − 이후 사용 ${Number(data.since_anchor_usage || 0).toFixed(2)}
                                            {data.anchor.dayStartTs == null && <span className="text-amber-400/80"> (기준을 다시 설정하면 당일 이중 차감이 사라집니다)</span>}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    {!isExtension && <p className="text-xs text-blue-400 uppercase tracking-widest mb-1 font-bold italic">Total Aggregated Usage</p>}
                                    <h3 className={isExtension ? 'text-2xl font-bold' : 'text-4xl font-bold'}>${Number(totalAggregated).toFixed(2)}</h3>
                                    {!isExtension && (
                                        <p className="text-[9px] text-amber-400/70 mt-1 italic">설정에서 현재 잔액을 입력하면 남은 금액이 표시됩니다.</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className={isExtension ? 'space-y-2' : 'space-y-4'}>
                        <div className={`${isExtension ? 'p-3' : 'p-4'} rounded-2xl bg-white/5 border border-white/5 space-y-2`}>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-gray-500">{isExtension ? 'This Month' : '이번 달 실시간 (API)'}</span>
                                <span className={`${isExtension ? 'text-blue-400' : 'text-blue-400'} font-mono font-bold`}>${Number(currentMonth).toFixed(2)}</span>
                            </div>
                            <div className={`flex justify-between items-center text-[10px] border-t border-white/5 ${isExtension ? 'pt-2' : 'pt-3'}`}>
                                <span className="text-gray-500">{isExtension ? 'Cached' : '과거 누적 (Cached)'}</span>
                                <span className="text-gray-400 font-mono font-semibold">${Number(totalHistory).toFixed(2)}</span>
                            </div>
                            {hasBalance && (
                                <div className={`flex justify-between items-center text-[10px] border-t border-white/5 ${isExtension ? 'pt-2' : 'pt-3'}`}>
                                    <span className="text-gray-500">{isExtension ? 'Total Usage' : '총 누적 사용량'}</span>
                                    <span className="text-gray-400 font-mono font-semibold">${Number(totalAggregated).toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        {historyArray.length > 0 && !isExtension && (
                            <div className="space-y-2">
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="flex justify-between items-center w-full text-[10px] text-gray-500 uppercase tracking-widest font-bold px-1 hover:text-gray-300 transition-colors"
                                >
                                    <span>Monthly Detail (Cached)</span>
                                    <Motion.span
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <TrendingUp size={12} />
                                    </Motion.span>
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <Motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="grid grid-cols-1 gap-1.5 px-1 py-1">
                                                {historyArray.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                                        <span className="text-gray-600">{item.month}</span>
                                                        <span className="text-gray-400 font-mono">${Number(item.total).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {!isExtension && (
                            <div className="flex items-start gap-2 px-1 opacity-50">
                                <Info size={12} className="shrink-0 mt-0.5" />
                                <p className="text-[9px] leading-relaxed italic">
                                    과거 데이터는 최초 1회 로컬에 저장되며, 이후에는 매달 합계만 실시간으로 업데이트됩니다.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (provider.id === 'xai') {
            const isPostpaid = data.isPostpaid;
            const amount = data.balance || 0;
            const limit = data.limit;
            const team = data.team;
            const pendingUsage = Number(data.pendingUsage || 0);
            const settledBalance = data.settledBalance;
            const usageError = data.usageError;
            const hasPendingBreakdown = !isPostpaid && settledBalance !== undefined && settledBalance !== null;

            return (
                <div className={isExtension ? 'space-y-3' : 'space-y-6'}>
                    <div className="flex justify-between items-end">
                        <div className="flex-1">
                            {!isExtension && (
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-bold">
                                    {isPostpaid ? 'Current Spend (Postpaid)' : 'Available Balance (Prepaid)'}
                                </p>
                            )}
                            <h3 className={isExtension ? 'text-2xl font-bold' : 'text-4xl font-bold'}>${Number(amount).toFixed(2)}</h3>
                            {usageError && (
                                <p className="text-[9px] text-amber-400/70 mt-1 italic">⚠ 미정산 사용량 조회 실패 — 정산된 잔액만 표시 ({usageError})</p>
                            )}
                        </div>
                    </div>

                    <div className={isExtension ? 'space-y-2' : 'space-y-4'}>
                        {team && (
                            <div className={`${isExtension ? 'p-3' : 'p-4'} rounded-2xl bg-white/5 border border-white/5 space-y-2`}>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-gray-500 font-medium">{isExtension ? 'Team' : 'Team Name'}</span>
                                    <span className="text-blue-400 font-bold">{team.name}</span>
                                </div>
                                <div className={`flex justify-between items-center text-[10px] border-t border-white/5 ${isExtension ? 'pt-2' : 'pt-3'}`}>
                                    <span className="text-gray-500 font-medium">{isExtension ? 'Type' : 'Team ID'}</span>
                                    <span className="text-gray-400 font-mono">{isExtension ? (isPostpaid ? 'Postpaid' : 'Prepaid') : team.id}</span>
                                </div>
                            </div>
                        )}

                        {hasPendingBreakdown && (
                            <div className={`${isExtension ? 'p-3' : 'p-4'} rounded-2xl bg-white/5 border border-white/5 space-y-2`}>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-gray-500 font-medium">{isExtension ? 'Settled' : 'Settled Balance'}</span>
                                    <span className="text-gray-300 font-mono font-semibold">${Number(settledBalance).toFixed(2)}</span>
                                </div>
                                <div className={`flex justify-between items-center text-[10px] border-t border-white/5 ${isExtension ? 'pt-2' : 'pt-3'}`}>
                                    <span className="text-gray-500 font-medium">{isExtension ? 'Pending Usage' : 'Unsettled Usage (not yet billed)'}</span>
                                    <span className="text-red-400/80 font-mono font-semibold">-${pendingUsage.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {limit && (
                            <div className="space-y-2 px-1">
                                <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                    <span>{isExtension ? 'Usage' : 'Usage Progress'}</span>
                                    <span>{isExtension ? '' : 'Limit: '}${Number(limit).toFixed(2)}</span>
                                </div>
                                <div className={`${isExtension ? 'h-1.5' : 'h-2.5'} bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5`}>
                                    <Motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((amount / limit) * 100, 100)}%` }}
                                        className={`h-full rounded-full ${isPostpaid ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-red-500 to-orange-600'}`}
                                    />
                                </div>
                            </div>
                        )}

                        {!isExtension && (
                            <div className="flex items-start gap-2 px-1 opacity-50">
                                <Info size={12} className="shrink-0 mt-0.5" />
                                <p className="text-[9px] leading-relaxed italic">
                                    x.ai는 사용량을 매월 한 번 정산합니다. 정산된 잔액에서 아직 청구되지 않은 사용량을 빼서 실제 잔액을 표시합니다.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (provider.id === 'moonshot') {
            // Moonshot returns { code: 0, data: { available_balance, cash_balance, voucher_balance }, ... }
            const moonshotData = data.data || {};
            const available = moonshotData.available_balance || 0;
            const cash = moonshotData.cash_balance || 0;
            const voucher = moonshotData.voucher_balance || 0;

            return (
                <div className={isExtension ? 'space-y-3' : 'space-y-6'}>
                    <div>
                        {!isExtension && <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">Available Balance</p>}
                        <h3 className={isExtension ? 'text-2xl font-bold' : 'text-4xl font-bold'}>${Number(available).toFixed(2)}</h3>
                    </div>

                    <div className={`${isExtension ? 'p-3' : 'p-4'} rounded-2xl bg-white/5 border border-white/5 space-y-2`}>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-500 font-medium uppercase">Cash</span>
                            <span className="text-gray-300 font-mono font-semibold">${Number(cash).toFixed(2)}</span>
                        </div>
                        <div className={`flex justify-between items-center text-[10px] border-t border-white/5 ${isExtension ? 'pt-2' : 'pt-3'}`}>
                            <span className="text-gray-500 font-medium uppercase">Voucher</span>
                            <span className="text-gray-300 font-mono font-semibold">${Number(voucher).toFixed(2)}</span>
                        </div>
                    </div>

                    {!isExtension && (
                        <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-[10px] text-orange-400">
                            <p className="opacity-70 leading-relaxed italic">Moonshot AI의 바우처(보너스) 잔액은 만료 기한이 있을 수 있습니다. 자세한 내용은 플랫폼에서 확인하세요.</p>
                        </div>
                    )}
                </div>
            );
        }

        if (provider.id === 'runpod') {
            const amount = data.balance || 0;

            return (
                <div className={isExtension ? 'space-y-3' : 'space-y-6'}>
                    <div>
                        {!isExtension && <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">Cloud Credit Balance</p>}
                        <h3 className={isExtension ? 'text-2xl font-bold' : 'text-4xl font-bold'}>${Number(amount).toFixed(2)}</h3>
                    </div>

                    <div className={`${isExtension ? 'p-3' : 'p-4'} rounded-2xl bg-white/5 border border-white/5 ${isExtension ? 'space-y-2' : 'space-y-4'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`${isExtension ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg bg-blue-500/20 flex items-center justify-center`}>
                                <TrendingUp size={isExtension ? 12 : 16} className="text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-500 uppercase font-bold">{isExtension ? 'Billing' : 'Billing Model'}</p>
                                <p className="text-[10px] text-gray-300 font-medium">Pay-as-you-go</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-3 border-t border-white/5 ${isExtension ? 'pt-2' : 'pt-4'}`}>
                            <div className={`${isExtension ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg bg-purple-500/20 flex items-center justify-center`}>
                                <Wallet size={isExtension ? 12 : 16} className="text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-500 uppercase font-bold">{isExtension ? 'Resource' : 'Primary Resource'}</p>
                                <p className="text-[10px] text-gray-300 font-medium">{isExtension ? 'GPU Cloud' : 'GPU Cloud & Serverless'}</p>
                            </div>
                        </div>
                    </div>

                    {!isExtension && (
                        <div className="flex items-start gap-2 px-1 opacity-50">
                            <Info size={12} className="shrink-0 mt-0.5" />
                            <p className="text-[9px] leading-relaxed italic">
                                RunPod의 잔액은 실시간으로 충전 및 소진됩니다. GraphQL API를 통해 정보를 조회합니다.
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        if (provider.id === 'tavily') {
            const creditsUsed = data.account?.plan_usage ?? data.key?.usage ?? data.usage ?? 0;
            const creditLimit = data.account?.plan_limit ?? data.key?.limit ?? data.limit ?? 0;
            const creditsRemaining = creditLimit > 0 ? Math.max(creditLimit - creditsUsed, 0) : 0;
            const searchUsage = data.account?.search_usage ?? data.key?.search_usage ?? 0;
            const plan = data.account?.current_plan || data.plan || 'Unknown';
            const keyCreditsUsed = data.key?.usage;
            const usageRate = creditLimit > 0 ? (creditsUsed / creditLimit) * 100 : 0;

            return (
                <div className={isExtension ? 'space-y-3' : 'space-y-6'}>
                    <div>
                        {!isExtension && <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">Credits Remaining</p>}
                        <h3 className={isExtension ? 'text-2xl font-bold' : 'text-4xl font-bold'}>{Number(creditsRemaining).toLocaleString()}</h3>
                    </div>

                    <div className={`${isExtension ? 'p-3 space-y-2' : 'p-4 space-y-3'} rounded-2xl bg-white/5 border border-white/5`}>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-500 font-medium uppercase">Plan</span>
                            <span className="text-gray-300 font-semibold">{plan}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2">
                            <span className="text-gray-500 font-medium uppercase">Credits</span>
                            <span className="text-gray-300 font-mono font-semibold">{Number(creditsUsed).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2">
                            <span className="text-gray-500 font-medium uppercase">Searches</span>
                            <span className="text-gray-300 font-mono font-semibold">{Number(searchUsage).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2">
                            <span className="text-gray-500 font-medium uppercase">Limit</span>
                            <span className="text-gray-300 font-mono font-semibold">{creditLimit > 0 ? Number(creditLimit).toLocaleString() : '-'}</span>
                        </div>
                        {typeof keyCreditsUsed === 'number' && (
                            <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2">
                                <span className="text-gray-500 font-medium uppercase">Key Credits</span>
                                <span className="text-gray-300 font-mono font-semibold">{Number(keyCreditsUsed).toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    {creditLimit > 0 && (
                        <div className="space-y-2 px-1">
                            <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                <span>{isExtension ? 'Usage' : 'Credit Usage'}</span>
                                <span>{usageRate.toFixed(1)}%</span>
                            </div>
                            <div className={`${isExtension ? 'h-1.5' : 'h-2.5'} bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5`}>
                                <Motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(usageRate, 100)}%` }}
                                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-600"
                                />
                            </div>
                        </div>
                    )}

                    {!isExtension && (
                        <div className="flex items-start gap-2 px-1 opacity-50">
                            <Info size={12} className="shrink-0 mt-0.5" />
                            <p className="text-[9px] leading-relaxed italic">
                                Tavily usage API 기준으로 남은 크레딧, 사용량, 리셋 일자를 표시합니다.
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        if (provider.id === 'openrouter') {
            const orData = data.data || {};
            const totalCredits = orData.total_credits || 0;
            const totalUsage = orData.total_usage || 0;
            const remaining = Math.max(totalCredits - totalUsage, 0);
            const usageRate = totalCredits > 0 ? (totalUsage / totalCredits) * 100 : 0;

            return (
                <div className={isExtension ? 'space-y-3' : 'space-y-6'}>
                    <div>
                        {!isExtension && <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">Estimated Balance</p>}
                        <h3 className={isExtension ? 'text-2xl font-bold' : 'text-4xl font-bold'}>${Number(remaining).toFixed(2)}</h3>
                    </div>

                    <div className={`${isExtension ? 'p-3' : 'p-4'} rounded-2xl bg-white/5 border border-white/5 space-y-2`}>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-500 font-medium uppercase">Total Credits</span>
                            <span className="text-gray-300 font-mono font-semibold">${Number(totalCredits).toFixed(2)}</span>
                        </div>
                        <div className={`flex justify-between items-center text-[10px] border-t border-white/5 ${isExtension ? 'pt-2' : 'pt-3'}`}>
                            <span className="text-gray-500 font-medium uppercase">Total Usage</span>
                            <span className="text-gray-300 font-mono font-semibold">${Number(totalUsage).toFixed(2)}</span>
                        </div>
                    </div>

                    {totalCredits > 0 && (
                        <div className="space-y-2 px-1">
                            <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                <span>Usage Rate</span>
                                <span>{usageRate.toFixed(1)}%</span>
                            </div>
                            <div className={`${isExtension ? 'h-1.5' : 'h-2.5'} bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5`}>
                                <Motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(usageRate, 100)}%` }}
                                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600"
                                />
                            </div>
                        </div>
                    )}

                    {!isExtension && (
                        <div className="flex items-start gap-2 px-1 opacity-50">
                            <Info size={12} className="shrink-0 mt-0.5" />
                            <p className="text-[9px] leading-relaxed italic">
                                OpenRouter의 크레딧 정보를 표시합니다. Management Key 권한이 있는 API 키가 필요할 수 있습니다.
                                약관상 구매 후 <strong className="not-italic text-amber-400/80">365일이 지난 미사용 크레딧은 만료될 수 있습니다</strong>.
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        if (provider.id === 'vercel') {
            // Vercel AI Gateway returns { balance: "95.50", total_used: "4.50" } (strings, USD)
            const balance = Number(data.balance || 0);
            const totalUsed = Number(data.total_used || 0);
            const totalCredits = balance + totalUsed;
            const usageRate = totalCredits > 0 ? (totalUsed / totalCredits) * 100 : 0;

            return (
                <div className={isExtension ? 'space-y-3' : 'space-y-6'}>
                    <div>
                        {!isExtension && <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">Available Balance</p>}
                        <h3 className={isExtension ? 'text-2xl font-bold' : 'text-4xl font-bold'}>${balance.toFixed(2)}</h3>
                    </div>

                    <div className={`${isExtension ? 'p-3' : 'p-4'} rounded-2xl bg-white/5 border border-white/5 space-y-2`}>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-500 font-medium uppercase">Total Used</span>
                            <span className="text-gray-300 font-mono font-semibold">${totalUsed.toFixed(2)}</span>
                        </div>
                        <div className={`flex justify-between items-center text-[10px] border-t border-white/5 ${isExtension ? 'pt-2' : 'pt-3'}`}>
                            <span className="text-gray-500 font-medium uppercase">Total Purchased</span>
                            <span className="text-gray-300 font-mono font-semibold">${totalCredits.toFixed(2)}</span>
                        </div>
                    </div>

                    {totalCredits > 0 && (
                        <div className="space-y-2 px-1">
                            <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                <span>Usage Rate</span>
                                <span>{usageRate.toFixed(1)}%</span>
                            </div>
                            <div className={`${isExtension ? 'h-1.5' : 'h-2.5'} bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5`}>
                                <Motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(usageRate, 100)}%` }}
                                    className="h-full rounded-full bg-gradient-to-r from-gray-300 to-gray-500"
                                />
                            </div>
                        </div>
                    )}

                    {!isExtension && (
                        <div className="flex items-start gap-2 px-1 opacity-50">
                            <Info size={12} className="shrink-0 mt-0.5" />
                            <p className="text-[9px] leading-relaxed italic">
                                Vercel AI Gateway의 크레딧 잔액과 누적 사용량을 표시합니다.
                                구매한 크레딧은 <strong className="not-italic text-amber-400/80">구매일로부터 1년 뒤 만료</strong>됩니다.
                                API가 만료일을 제공하지 않으므로, 여기 표시된 잔액에 곧 만료될 금액이 포함돼 있을 수 있습니다.
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative h-full"
        >
            <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <div className={`relative ${isExtension ? 'p-4 rounded-3xl min-h-[160px]' : 'p-8 rounded-[2rem] min-h-[280px]'} bg-[#16161a] border border-white/5 backdrop-blur-xl hover:border-white/10 transition-all duration-500 flex flex-col h-full`}>
                <div className={`flex justify-between items-center ${isExtension ? 'mb-4' : 'mb-8'}`}>
                    <div className={`${isExtension ? 'p-2 rounded-xl' : 'p-3 rounded-2xl'} bg-gradient-to-br transition-all duration-500
                        ${provider.id === 'openai' ? 'from-green-500/20 to-emerald-600/20 group-hover:from-green-500/30' :
                            provider.id === 'xai' ? 'from-blue-500/20 to-indigo-600/20 group-hover:from-blue-500/30' :
                                provider.id === 'tavily' ? 'from-cyan-500/20 to-sky-600/20 group-hover:from-cyan-500/30' :
                                    provider.id === 'openrouter' ? 'from-indigo-500/20 to-purple-600/20 group-hover:from-indigo-500/30' :
                                        provider.id === 'vercel' ? 'from-gray-300/20 to-gray-500/20 group-hover:from-gray-300/30' :
                                            'from-purple-500/20 to-pink-600/20 group-hover:from-purple-500/30'}`}>
                        <Icon size={isExtension ? 16 : 24} className={
                            provider.id === 'openai' ? 'text-green-400' :
                                provider.id === 'xai' ? 'text-blue-400' :
                                    provider.id === 'tavily' ? 'text-cyan-400' :
                                        provider.id === 'openrouter' ? 'text-indigo-400' :
                                            provider.id === 'vercel' ? 'text-gray-200' :
                                                'text-purple-400'
                        } />
                    </div>
                    <h2 className={`${isExtension ? 'text-sm' : 'text-lg'} font-bold mr-auto ml-3 tracking-tight`}>{provider.name}</h2>
                    <button
                        onClick={onRefresh}
                        className="p-1.5 hover:bg-white/5 rounded-full transition-all duration-300 text-gray-500 hover:text-white"
                        disabled={loading}
                    >
                        <RefreshCw size={isExtension ? 14 : 18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="flex-1">
                    {renderContent()}
                </div>
            </div>
        </Motion.div>
    );
}
