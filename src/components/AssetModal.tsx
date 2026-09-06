import { useState } from 'react';
import { Building2, X, ChevronRight, DollarSign, Home, Car, Store, Factory, TrendingUp, Trash2, KeyRound, Hammer, Wallet, Landmark } from 'lucide-react';
import type { GameState, Asset, RentalType, BuildingType, IncomeFrequency } from '../types';
import { BUILDING_TYPES } from '../types';
import { sfx } from '../sfx';

interface Props {
  state: GameState;
  onClose: () => void;
  onCollectIncome: (assetId: string, destination: 'cash' | 'bank') => void;
  onLiquidate: (assetId: string) => void;
  onToggleRental: (assetId: string, rentalType: RentalType) => void;
  onBuild: (assetId: string, buildingType: BuildingType) => void;
  onTransferToBank: (amount: number) => void;
  onTransferFromBank: (amount: number) => void;
}

export default function AssetModal({ state, onClose, onCollectIncome, onLiquidate, onToggleRental, onBuild, onTransferToBank, onTransferFromBank }: Props) {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [showBuildPanel, setShowBuildPanel] = useState(false);
  const [showRentalPanel, setShowRentalPanel] = useState(false);
  const [showTransferPanel, setShowTransferPanel] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDir, setTransferDir] = useState<'to_bank' | 'from_bank'>('to_bank');

  const selectedAsset = state.assets.find(a => a.id === selectedAssetId) ?? null;

  const getAssetTotalIncome = (asset: Asset): number => {
    return (asset.monthlyIncome || 0) + (asset.rental?.monthlyRent || 0) + (asset.buildings?.reduce((s, b) => s + b.monthlyIncome, 0) || 0);
  };

  const getRentalOptions = (asset: Asset): RentalType[] => {
    if (asset.type === 'property') return ['airbnb', 'residential', 'commercial', 'office'];
    if (asset.type === 'vehicle') return ['vehicle_rental'];
    if (asset.type === 'land' && (asset.buildings?.length ?? 0) > 0) return ['airbnb', 'residential', 'commercial', 'office'];
    return [];
  };

  const handleCollect = (destination: 'cash' | 'bank') => {
    if (!selectedAsset) return;
    sfx.click();
    onCollectIncome(selectedAsset.id, destination);
  };

  const handleLiquidate = () => {
    if (!selectedAsset) return;
    if (confirm(`Liquidate ${selectedAsset.name} for $${(selectedAsset.liquidationValue ?? Math.round(selectedAsset.purchasePrice * 0.7)).toLocaleString()}? This cannot be undone.`)) {
      sfx.click();
      onLiquidate(selectedAsset.id);
      setSelectedAssetId(null);
    }
  };

  const handleRental = (type: RentalType) => {
    if (!selectedAsset) return;
    sfx.click();
    onToggleRental(selectedAsset.id, type);
    setShowRentalPanel(false);
  };

  const handleBuild = (buildingType: BuildingType) => {
    if (!selectedAsset) return;
    if (state.cash < buildingType.cost) return;
    sfx.click();
    onBuild(selectedAsset.id, buildingType);
    setShowBuildPanel(false);
  };

  const handleTransfer = () => {
    const amt = parseInt(transferAmount, 10);
    if (!amt || amt <= 0) return;
    sfx.click();
    if (transferDir === 'to_bank') {
      onTransferToBank(amt);
    } else {
      onTransferFromBank(amt);
    }
    setTransferAmount('');
    setShowTransferPanel(false);
  };

  const rentalTypeIcons: Record<RentalType, string> = {
    airbnb: '🛏️',
    residential: '🏠',
    commercial: '🏪',
    vehicle_rental: '🚗',
    office: '💼',
  };

  const rentalTypeNames: Record<RentalType, string> = {
    airbnb: 'Airbnb',
    residential: 'Residential',
    commercial: 'Commercial',
    vehicle_rental: 'Vehicle Rental',
    office: 'Office Space',
  };

  const formatFreq = (freq: IncomeFrequency): string => {
    return freq.charAt(0).toUpperCase() + freq.slice(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-cyan-500/20 rounded-3xl p-6 max-w-2xl w-full relative my-8 max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white z-10">
          <X size={20} />
        </button>

        {/* List View */}
        {!selectedAsset && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={24} className="text-cyan-400" />
              <h2 className="text-2xl font-black">Your Assets</h2>
            </div>

            {/* Cash & Bank Balance */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-amber-950/30 border border-amber-700/30 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet size={14} className="text-amber-400" />
                  <span className="text-xs text-slate-500 font-medium">Cash</span>
                </div>
                <div className="text-lg font-black text-amber-400">${(state.cash ?? 0).toLocaleString()}</div>
              </div>
              <div className="bg-cyan-950/30 border border-cyan-700/30 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Landmark size={14} className="text-cyan-400" />
                  <span className="text-xs text-slate-500 font-medium">Bank Account</span>
                </div>
                <div className="text-lg font-black text-cyan-400">${(state.bankBalance ?? 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Transfer button */}
            <button
              onClick={() => { sfx.click(); setShowTransferPanel(!showTransferPanel); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-4 bg-white/5 border border-white/10 hover:border-cyan-500/40 rounded-xl text-sm font-bold text-slate-300 transition-all"
            >
              <DollarSign size={16} className="text-cyan-400" />
              Transfer Money
            </button>

            {showTransferPanel && (
              <div className="bg-slate-950/50 border border-white/10 rounded-xl p-4 mb-4">
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setTransferDir('to_bank')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${transferDir === 'to_bank' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-white/5 text-slate-500 border border-white/10'}`}
                  >
                    Cash → Bank
                  </button>
                  <button
                    onClick={() => setTransferDir('from_bank')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${transferDir === 'from_bank' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-white/5 text-slate-500 border border-white/10'}`}
                  >
                    Bank → Cash
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    placeholder="Amount"
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none"
                  />
                  <button
                    onClick={handleTransfer}
                    disabled={!transferAmount || parseInt(transferAmount, 10) <= 0}
                    className={transferAmount && parseInt(transferAmount, 10) > 0
                      ? 'px-4 py-2 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all'
                      : 'px-4 py-2 rounded-xl font-bold text-sm bg-slate-800 text-slate-600 cursor-not-allowed'}
                  >
                    Transfer
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setTransferAmount(String(Math.floor((transferDir === 'to_bank' ? state.cash : state.bankBalance) / 4)))} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg py-1 text-slate-400">25%</button>
                  <button onClick={() => setTransferAmount(String(Math.floor((transferDir === 'to_bank' ? state.cash : state.bankBalance) / 2)))} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg py-1 text-slate-400">50%</button>
                  <button onClick={() => setTransferAmount(String(Math.floor(transferDir === 'to_bank' ? state.cash : state.bankBalance)))} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg py-1 text-slate-400">All</button>
                </div>
              </div>
            )}

            {state.assets.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No assets yet. Visit the bank to invest!</p>
            ) : (
              <div className="space-y-2">
                {state.assets.map(a => {
                  const income = getAssetTotalIncome(a);
                  return (
                    <button
                      key={a.id}
                      onClick={() => { sfx.click(); setSelectedAssetId(a.id); }}
                      className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/8 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all text-left"
                    >
                      <span className="text-2xl">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-white">{a.name}</div>
                        <div className="text-xs text-slate-500 truncate">{a.description}</div>
                        {a.rental && (
                          <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                            {rentalTypeIcons[a.rental.type]} {a.rental.label} +${a.rental.monthlyRent}/mo
                          </div>
                        )}
                        {(a.buildings?.length ?? 0) > 0 && (
                          <div className="text-[10px] text-cyan-400 font-bold mt-0.5">
                            {a.buildings!.length} building{a.buildings!.length > 1 ? 's' : ''} on this land
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-slate-500">Value</div>
                        <div className="text-sm font-bold text-amber-400">${(a.purchasePrice ?? 0).toLocaleString()}</div>
                        {income > 0 && <div className="text-xs text-emerald-400 font-bold">+${income}/mo</div>}
                      </div>
                      <ChevronRight size={16} className="text-slate-600 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Detail View */}
        {selectedAsset && (
          <>
            <button onClick={() => { sfx.click(); setSelectedAssetId(null); }} className="flex items-center gap-1 text-xs text-slate-500 hover:text-white mb-4">
              <ChevronRight size={12} className="rotate-180" /> Back to assets
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{selectedAsset.icon}</span>
              <div>
                <h2 className="text-xl font-black text-white">{selectedAsset.name}</h2>
                <p className="text-sm text-slate-500">{selectedAsset.description}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <div className="text-[10px] text-slate-500">Purchase Price</div>
                <div className="text-sm font-bold text-amber-400">${(selectedAsset.purchasePrice ?? 0).toLocaleString()}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <div className="text-[10px] text-slate-500">Liquidation Value</div>
                <div className="text-sm font-bold text-red-400">${(selectedAsset.liquidationValue ?? Math.round((selectedAsset.purchasePrice ?? 0) * 0.7)).toLocaleString()}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <div className="text-[10px] text-slate-500">Base Income</div>
                <div className="text-sm font-bold text-emerald-400">{selectedAsset.monthlyIncome > 0 ? `+$${selectedAsset.monthlyIncome}/mo` : 'None'}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <div className="text-[10px] text-slate-500">Total Income</div>
                <div className="text-sm font-bold text-emerald-400">{`+$${getAssetTotalIncome(selectedAsset)}/mo`}</div>
              </div>
            </div>

            {/* Rental info */}
            {selectedAsset.rental && (
              <div className="bg-emerald-950/30 border border-emerald-700/30 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound size={14} className="text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">{selectedAsset.rental.label}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Earning ${selectedAsset.rental.monthlyRent}/mo since {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][selectedAsset.rental.startedMonth - 1]} {selectedAsset.rental.startedYear}
                </div>
              </div>
            )}

            {/* Buildings on land */}
            {(selectedAsset.buildings?.length ?? 0) > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-white mb-2">Buildings on This Land</h3>
                <div className="space-y-2">
                  {selectedAsset.buildings!.map(b => (
                    <div key={b.id} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-xl">{b.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{b.name}</div>
                        <div className="text-[10px] text-slate-500">Built {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][b.builtMonth - 1]} {b.builtYear}</div>
                      </div>
                      <div className="text-sm font-bold text-emerald-400">+${b.monthlyIncome}/mo</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {/* Collect Income */}
              {getAssetTotalIncome(selectedAsset) > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-1.5 font-medium">
                    Collect Rental & Building Income
                    {selectedAsset.monthlyIncome > 0 && <span className="text-slate-600"> (base income auto-collected monthly)</span>}
                  </div>
                  {(() => {
                    const alreadyCollected = selectedAsset.lastCollectedMonth === state.month && selectedAsset.lastCollectedYear === state.year;
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleCollect('cash')}
                            disabled={alreadyCollected}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                              alreadyCollected
                                ? 'bg-slate-800/50 border border-slate-700/30 text-slate-600 cursor-not-allowed'
                                : 'bg-emerald-950/40 border border-emerald-700/30 hover:border-emerald-500/60 text-emerald-400 hover:scale-[1.02]'
                            }`}
                          >
                            <Wallet size={16} />
                            → Cash
                          </button>
                          <button
                            onClick={() => handleCollect('bank')}
                            disabled={alreadyCollected}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                              alreadyCollected
                                ? 'bg-slate-800/50 border border-slate-700/30 text-slate-600 cursor-not-allowed'
                                : 'bg-cyan-950/40 border border-cyan-700/30 hover:border-cyan-500/60 text-cyan-400 hover:scale-[1.02]'
                            }`}
                          >
                            <Landmark size={16} />
                            → Bank
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-600 mt-1 text-center">
                          {alreadyCollected
                            ? `Already collected this month — next collection in ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(state.month % 12)]}`
                            : `Collectable: ${((selectedAsset.rental?.monthlyRent || 0) + (selectedAsset.buildings?.reduce((s, b) => s + b.monthlyIncome, 0) || 0)).toLocaleString()}/mo`}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Rental toggle */}
              {selectedAsset.canRental && getRentalOptions(selectedAsset).length > 0 && (
                <div>
                  <button
                    onClick={() => { sfx.click(); setShowRentalPanel(!showRentalPanel); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-950/30 border border-violet-700/30 hover:border-violet-500/60 rounded-xl text-violet-400 font-bold transition-all hover:scale-[1.02]"
                  >
                    <KeyRound size={16} />
                    {selectedAsset.rental ? 'Change Rental Type' : 'Rent Out This Asset'}
                  </button>

                  {showRentalPanel && (
                    <div className="mt-2 space-y-2">
                      {getRentalOptions(selectedAsset).map(type => {
                        const baseRent = Math.max(200, Math.round((selectedAsset.purchasePrice || 5000) * 0.012));
                        const multipliers: Record<RentalType, number> = { airbnb: 1.8, residential: 1.0, commercial: 1.3, vehicle_rental: 0.8, office: 1.4 };
                        const rent = Math.round(baseRent * (multipliers[type] || 1));
                        const isActive = selectedAsset.rental?.type === type;
                        return (
                          <button
                            key={type}
                            onClick={() => handleRental(type)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isActive ? 'bg-emerald-950/40 border-emerald-600/40' : 'bg-white/5 border-white/10 hover:border-violet-500/40'}`}
                          >
                            <span className="text-xl">{rentalTypeIcons[type]}</span>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-white">{rentalTypeNames[type]}</div>
                              <div className="text-[10px] text-slate-500">
                                {type === 'airbnb' && 'Short-term stays, highest yield but more turnover'}
                                {type === 'residential' && 'Stable long-term tenant'}
                                {type === 'commercial' && 'Lease to a business'}
                                {type === 'vehicle_rental' && 'Rent out your vehicle'}
                                {type === 'office' && 'Lease as office space to companies'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-emerald-400">+${rent}/mo</div>
                              {isActive && <div className="text-[10px] text-emerald-400 font-bold">Active</div>}
                            </div>
                          </button>
                        );
                      })}
                      {selectedAsset.rental && (
                        <button
                          onClick={() => handleRental(selectedAsset.rental!.type)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-950/30 border border-red-700/30 hover:border-red-500/60 rounded-xl text-red-400 font-bold text-sm transition-all"
                        >
                          Stop Renting
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Build on land */}
              {selectedAsset.canBuild && selectedAsset.type === 'land' && (
                <div>
                  <button
                    onClick={() => { sfx.click(); setShowBuildPanel(!showBuildPanel); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-950/30 border border-amber-700/30 hover:border-amber-500/60 rounded-xl text-amber-400 font-bold transition-all hover:scale-[1.02]"
                  >
                    <Hammer size={16} />
                    Build on This Land
                  </button>

                  {showBuildPanel && (
                    <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                      {BUILDING_TYPES.map(bt => {
                        const canAfford = state.cash >= bt.cost;
                        return (
                          <button
                            key={bt.id}
                            onClick={() => handleBuild(bt)}
                            disabled={!canAfford}
                            className={canAfford
                              ? 'w-full flex items-center gap-3 p-3 rounded-xl border bg-white/5 border-white/10 hover:border-amber-500/40 transition-all text-left'
                              : 'w-full flex items-center gap-3 p-3 rounded-xl border bg-slate-950/30 border-white/5 opacity-50 cursor-not-allowed text-left'}
                          >
                            <span className="text-xl">{bt.icon}</span>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-white">{bt.name}</div>
                              <div className="text-[10px] text-slate-500">{bt.description}</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-bold ${canAfford ? 'text-amber-400' : 'text-slate-600'}`}>${bt.cost.toLocaleString()}</div>
                              <div className="text-xs text-emerald-400 font-bold">+${bt.monthlyIncome}/mo</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Liquidate */}
              <button
                onClick={handleLiquidate}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-950/30 border border-red-700/30 hover:border-red-500/60 rounded-xl text-red-400 font-bold transition-all hover:scale-[1.02]"
              >
                <Trash2 size={16} />
                Liquidate Asset (${(selectedAsset.liquidationValue ?? Math.round((selectedAsset.purchasePrice ?? 0) * 0.7)).toLocaleString()})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
