import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertCircle, TrendingUp, Wallet, Zap, Cpu, Moon, Info } from 'lucide-react';

const ICON_MAP = {
    zap: Zap,
    cpu: Cpu,
    moon: Moon
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
            return (
                <div className={`${isExtension ? 'p-2' : 'p-4'} rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-2`}>
                    <AlertCircle size={isExtension ? 14 : 18} className="shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                        <p className="font-semibold">{data.error}</p>
                        {!isExtension && <p className="opacity-80 leading-relaxed text-[10px]">{data.message || 'Check your permissions.'}</p>}
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

            return (
                <div className={isExtension ? 'space-y-3' : 'space-y-6'}>
                    <div className="flex justify-between items-end">
                        <div className="flex-1">
                            {!isExtension && <p className="text-xs text-blue-400 uppercase tracking-widest mb-1 font-bold italic">Total Aggregated Usage</p>}
                            <h3 className={isExtension ? 'text-2xl font-bold' : 'text-4xl font-bold'}>${Number(totalAggregated).toFixed(2)}</h3>
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
                        </div>

                        {historyArray.length > 0 && !isExtension && (
                            <div className="space-y-2">
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="flex justify-between items-center w-full text-[10px] text-gray-500 uppercase tracking-widest font-bold px-1 hover:text-gray-300 transition-colors"
                                >
                                    <span>Monthly Detail (Cached)</span>
                                    <motion.span
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <TrendingUp size={12} />
                                    </motion.span>
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
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
                                        </motion.div>
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

                        {limit && (
                            <div className="space-y-2 px-1">
                                <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                    <span>{isExtension ? 'Usage' : 'Usage Progress'}</span>
                                    <span>{isExtension ? '' : 'Limit: '}${Number(limit).toFixed(2)}</span>
                                </div>
                                <div className={`${isExtension ? 'h-1.5' : 'h-2.5'} bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5`}>
                                    <motion.div
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
                                    x.ai의 실시간 사용량 및 잔액 정보입니다. 관리자 API 키를 통해 가져온 데이터입니다.
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

        return null;
    };

    return (
        <motion.div
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
                                'from-purple-500/20 to-pink-600/20 group-hover:from-purple-500/30'}`}>
                        <Icon size={isExtension ? 16 : 24} className={
                            provider.id === 'openai' ? 'text-green-400' :
                                provider.id === 'xai' ? 'text-blue-400' :
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
        </motion.div>
    );
}
