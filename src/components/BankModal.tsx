import { useState } from 'react';
import { Landmark, X, ChevronRight } from 'lucide-react';
import type { GameState, GameAction, LoanProduct, LoanType } from '../types';
import { BANKS } from '../types';
import { getActionPool } from '../actions';
import { sfx } from '../sfx';

interface Props {
  state: GameState;
  onClose: () => void;
  onTakeLoan: (amount: number, purpose: string, bankId: string, product: LoanProduct) => void;
  onAction: (action: GameAction) => void;
}

type Step = 'bank' | 'product' | 'amount';

export default function BankModal({ state, onClose, onTakeLoan, onAction }: Props) {
  const [step, setStep] = useState<Step>('bank');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);

  const bank = BANKS.find(b => b.id === selectedBankId) ?? null;

  const handleAction = (action: GameAction) => {
    if (state.cash >= action.cost) {
      onAction(action);
      onClose();
    } else {
      const needed = action.cost - state.cash;
      if (confirm(`You need $${needed.toLocaleString()} more. Take a loan of $${needed.toLocaleString()} to buy ${action.name}?`)) {
        onTakeLoan(needed, action.name, 'freedom', BANKS[0].loanProducts[0]);
        setTimeout(() => { onAction(action); }, 100);
        onClose();
      }
    }
  };

  const handleSelectBank = (id: string) => {
    sfx.click();
    setSelectedBankId(id);
    setStep('product');
  };

  const handleSelectProduct = (product: LoanProduct) => {
    sfx.click();
    setSelectedProduct(product);
    setStep('amount');
  };

  const handleTakeLoan = (amount: number) => {
    if (!bank || !selectedProduct) return;
    onTakeLoan(amount, selectedProduct.name, bank.id, selectedProduct);
    onClose();
  };

  const reset = () => {
    setSelectedBankId(null);
    setSelectedProduct(null);
    setStep('bank');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const productTypeLabels: Record<LoanType, string> = {
    personal: 'Unsecured',
    auto: 'Secured by vehicle',
    mortgage: 'Secured by property',
    business: 'Business expense',
    investment: 'Investment leverage',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-cyan-500/30 rounded-3xl p-6 max-w-lg w-full relative my-8 max-h-[85vh] overflow-y-auto">
        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <X size={20} />
        </button>
        <div className="flex items-center gap-2 mb-4">
          <Landmark size={28} className="text-cyan-400" />
          <h2 className="text-2xl font-black text-cyan-400">Bank & Loans</h2>
        </div>

        {/* Breadcrumb */}
        {step !== 'bank' && bank && (
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
            <button onClick={reset} className="hover:text-white">{bank.icon} {bank.name}</button>
            {step === 'amount' && selectedProduct && (
              <>
                <ChevronRight size={12} />
                <button onClick={() => setStep('product')} className="hover:text-white">{selectedProduct.name}</button>
                <ChevronRight size={12} />
                <span className="text-cyan-400">Choose Amount</span>
              </>
            )}
            {step === 'product' && <><ChevronRight size={12} /><span className="text-cyan-400">Loan Types</span></>}
          </div>
        )}

        {/* Step 1: Choose bank */}
        {step === 'bank' && (
          <>
            <p className="text-slate-400 text-sm mb-4">
              Choose a lender to borrow from. Each bank offers different loan types with unique rates and terms.
              Your current cash: <span className="text-amber-400 font-bold">${(state.cash ?? 0).toLocaleString()}</span>
            </p>
            <div className="space-y-3">
              {BANKS.map(b => {
                const locked = state.level < b.requiresLevel;
                return (
                  <button
                    key={b.id}
                    onClick={() => { if (!locked) handleSelectBank(b.id); }}
                    disabled={locked}
                    className={locked
                      ? 'w-full text-left p-4 rounded-2xl border bg-slate-950/30 border-white/5 opacity-50 cursor-not-allowed'
                      : 'w-full text-left p-4 rounded-2xl border bg-slate-950/50 border-white/10 hover:border-cyan-500/40 hover:scale-[1.01] transition-all'}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{b.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">{b.name}</div>
                        {locked
                          ? <span className="text-xs text-red-400">Requires Level {b.requiresLevel}</span>
                          : <span className="text-xs text-slate-500">{b.loanProducts.length} loan types available</span>}
                      </div>
                      {!locked && <ChevronRight size={16} className="text-slate-500" />}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{b.description}</p>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {b.loanProducts.map(p => (
                        <span key={p.type} className="bg-white/5 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                          {p.icon} {p.name}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <h3 className="text-sm font-bold text-white mb-2">Major Investments</h3>
              <p className="text-slate-500 text-xs mb-3">Buy land, property, businesses and more. If you don't have enough cash, get a loan first!</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getActionPool(state).filter(a => a.category === 'bank' && (!a.requiresLevel || state.level >= a.requiresLevel)).map(action => {
                  const canAfford = state.cash >= action.cost;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleAction(action)}
                      className={canAfford
                        ? 'w-full flex items-center gap-3 p-3 rounded-xl border bg-cyan-950/30 border-cyan-700/30 hover:border-cyan-500/60 hover:scale-[1.01] transition-all text-left'
                        : 'w-full flex items-center gap-3 p-3 rounded-xl border bg-white/5 border-white/10 hover:border-amber-500/30 transition-all text-left'}
                    >
                      <span className="text-2xl">{action.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-white">{action.name}</div>
                        <div className="text-xs text-slate-500">{action.description}</div>
                        {action.monthlyIncome ? <div className="text-xs text-emerald-400 font-bold">+${action.monthlyIncome}/mo</div> : null}
                      </div>
                      <div className={`text-sm font-bold ${canAfford ? 'text-amber-400' : 'text-slate-500'}`}>
                        {canAfford ? `$${action.cost.toLocaleString()}` : `Need $${(action.cost - state.cash).toLocaleString()}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Step 2: Choose loan type */}
        {step === 'product' && bank && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{bank.icon}</span>
              <div>
                <h3 className="font-bold text-white">{bank.name}</h3>
                <p className="text-xs text-slate-500">{bank.description}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Select a loan type. Each has different rates, terms, and limits.
              Your current cash: <span className="text-amber-400 font-bold">${(state.cash ?? 0).toLocaleString()}</span>
            </p>
            <div className="space-y-3">
              {bank.loanProducts.map(product => {
                const locked = state.level < product.requiresLevel;
                const totalForMax = Math.ceil(product.maxAmount * (1 + product.interestRate));
                const monthlyForMax = Math.ceil(totalForMax / product.termMonths);
                return (
                  <button
                    key={product.type}
                    onClick={() => { if (!locked) handleSelectProduct(product); }}
                    disabled={locked}
                    className={locked
                      ? 'w-full text-left p-4 rounded-2xl border bg-slate-950/30 border-white/5 opacity-50 cursor-not-allowed'
                      : 'w-full text-left p-4 rounded-2xl border bg-slate-950/50 border-white/10 hover:border-cyan-500/40 hover:scale-[1.01] transition-all'}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{product.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">{product.name}</div>
                        {locked
                          ? <span className="text-xs text-red-400">Requires Level {product.requiresLevel}</span>
                          : <span className="text-xs text-slate-500">{productTypeLabels[product.type]}</span>}
                      </div>
                      {!locked && <ChevronRight size={16} className="text-slate-500" />}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{product.description}</p>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-bold">{(product.interestRate * 100).toFixed(0)}% interest</span>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">{product.termMonths}mo term</span>
                      <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">{`$${product.minAmount.toLocaleString()}-${product.maxAmount.toLocaleString()}`}</span>
                      <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold">{(product.earlyPayoffFeePct * 100).toFixed(0)}% early payoff fee</span>
                    </div>
                    {!locked && (
                      <div className="text-[10px] text-slate-600 mt-2">
                        Example: ${product.maxAmount.toLocaleString()} loan = ${monthlyForMax.toLocaleString()}/mo, total ${totalForMax.toLocaleString()}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step 3: Choose amount */}
        {step === 'amount' && bank && selectedProduct && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{selectedProduct.icon}</span>
              <div>
                <h3 className="font-bold text-white">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-500">
                  {(selectedProduct.interestRate * 100).toFixed(0)}% interest • {selectedProduct.termMonths} months • {`$${selectedProduct.minAmount.toLocaleString()}-${selectedProduct.maxAmount.toLocaleString()}`}
                </p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-3">
              {selectedProduct.description}
            </p>
            <p className="text-slate-400 text-sm mb-4">
              Your current cash: <span className="text-amber-400 font-bold">${(state.cash ?? 0).toLocaleString()}</span>
            </p>

            <AmountSelector
              product={selectedProduct}
              onTakeLoan={handleTakeLoan}
            />
          </>
        )}
      </div>
    </div>
  );
}

function AmountSelector({ product, onTakeLoan }: { product: LoanProduct; onTakeLoan: (amount: number) => void }) {
  const [customAmount, setCustomAmount] = useState('');

  const presets: number[] = [];
  const steps = [1000, 2000, 5000, 10000, 25000, 50000, 100000, 200000, 500000];
  for (const s of steps) {
    if (s >= product.minAmount && s <= product.maxAmount) presets.push(s);
  }
  if (presets.length === 0) {
    presets.push(product.minAmount, Math.round(product.maxAmount / 2), product.maxAmount);
  }
  if (presets[presets.length - 1] !== product.maxAmount) presets.push(product.maxAmount);

  const handleCustom = () => {
    const amt = parseInt(customAmount, 10);
    if (!amt || amt < product.minAmount || amt > product.maxAmount) return;
    onTakeLoan(amt);
  };

  const customValid = customAmount && parseInt(customAmount, 10) >= product.minAmount && parseInt(customAmount, 10) <= product.maxAmount;

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {presets.map(amt => {
          const totalToRepay = Math.ceil(amt * (1 + product.interestRate));
          const monthlyPayment = Math.ceil(totalToRepay / product.termMonths);
          return (
            <button
              key={amt}
              onClick={() => onTakeLoan(amt)}
              className="px-3 py-3 bg-cyan-950/40 border border-cyan-700/30 hover:border-cyan-500/60 rounded-xl text-cyan-400 font-bold transition-all hover:scale-[1.02] text-sm"
            >
              {`+$${amt >= 1000 ? `${amt / 1000}k` : amt}`}
              <div className="text-[9px] text-slate-500 font-normal mt-0.5">{`$${monthlyPayment}/mo`}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-slate-950/40 border border-white/10 rounded-xl p-3 mb-3">
        <p className="text-xs text-slate-500 mb-2">Or enter a custom amount ({`$${product.minAmount.toLocaleString()} - $${product.maxAmount.toLocaleString()}`})</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={customAmount}
            onChange={e => setCustomAmount(e.target.value)}
            placeholder="Enter amount"
            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none"
          />
          <button
            onClick={handleCustom}
            disabled={!customValid}
            className={customValid
              ? 'px-4 py-2 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:scale-[1.02] transition-all'
              : 'px-4 py-2 rounded-xl font-bold text-sm bg-slate-800 text-slate-600 cursor-not-allowed'}
          >
            Borrow
          </button>
        </div>
        {customAmount && !customValid && (
          <p className="text-xs text-red-400 mt-2">
            Amount must be between ${product.minAmount.toLocaleString()} and ${product.maxAmount.toLocaleString()}.
          </p>
        )}
        {customValid && (
          <p className="text-xs text-emerald-400 mt-2">
            {`$${parseInt(customAmount, 10).toLocaleString()} loan = $${Math.ceil(parseInt(customAmount, 10) * (1 + product.interestRate)).toLocaleString()} total, $${Math.ceil(Math.ceil(parseInt(customAmount, 10) * (1 + product.interestRate)) / product.termMonths).toLocaleString()}/mo`}
          </p>
        )}
      </div>
    </>
  );
}
