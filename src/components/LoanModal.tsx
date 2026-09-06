import { useState } from 'react';
import { Landmark, X, AlertCircle, Calendar, DollarSign, Clock, CheckCircle2, RefreshCw, Layers, Plus } from 'lucide-react';
import type { GameState, Loan } from '../types';
import { makeLoanPayment, makeExtraPayment, refinanceLoan, consolidateLoans } from '../gameEngine';
import { sfx } from '../sfx';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props {
  state: GameState;
  loan: Loan;
  onClose: () => void;
  onChange: (state: GameState) => void;
}

export default function LoanModal({ state, loan, onClose, onChange }: Props) {
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showRefinance, setShowRefinance] = useState(false);
  const [showConsolidate, setShowConsolidate] = useState(false);
  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([loan.id]);
  const [actionSuccess, setActionSuccess] = useState('');
  const [showExtraPayment, setShowExtraPayment] = useState(false);
  const [extraAmount, setExtraAmount] = useState('');

  const currentKey = state.month + state.year * 12;
  const dueKey = loan.nextPaymentMonth + loan.nextPaymentYear * 12;
  const isOverdue = currentKey >= dueKey && loan.remaining > 0;
  const canPay = state.cash >= loan.monthlyPayment && loan.remaining > 0;
  const progressPct = loan.principal > 0 ? Math.round(((loan.totalToRepay - loan.remaining) / loan.totalToRepay) * 100) : 0;

  const otherLoans = state.loans.filter(l => l.id !== loan.id && l.remaining > 0);

  const handlePay = () => {
    sfx.click();
    const next = makeLoanPayment(state, loan.id);
    onChange(next);
    setPaymentSuccess(true);
    setTimeout(() => setPaymentSuccess(false), 2000);
  };

  const handleRefinance = () => {
    sfx.click();
    const next = refinanceLoan(state, loan.id);
    onChange(next);
    setShowRefinance(false);
    setActionSuccess('Loan refinanced successfully!');
    setTimeout(() => { setActionSuccess(''); onClose(); }, 1800);
  };

  const handleConsolidate = () => {
    if (selectedLoanIds.length < 2) return;
    sfx.click();
    const next = consolidateLoans(state, selectedLoanIds);
    onChange(next);
    setShowConsolidate(false);
    setActionSuccess('Loans consolidated successfully!');
    setTimeout(() => { setActionSuccess(''); onClose(); }, 1800);
  };

  const handleExtraPayment = () => {
    const amount = parseInt(extraAmount, 10);
    if (!amount || amount <= 0 || amount > state.cash) return;
    sfx.click();
    const next = makeExtraPayment(state, loan.id, amount);
    onChange(next);
    setExtraAmount('');
    setShowExtraPayment(false);
    setPaymentSuccess(true);
    setTimeout(() => setPaymentSuccess(false), 2000);
  };

  const earlyPayoffFee = Math.ceil(loan.remaining * loan.earlyPayoffFeePct);
  const earlyPayoffTotal = loan.remaining + earlyPayoffFee;
  const canPayoffEarly = state.cash >= earlyPayoffTotal && loan.remaining > 0;

  const handleEarlyPayoff = () => {
    sfx.click();
    const next = makeExtraPayment(state, loan.id, loan.remaining);
    onChange(next);
    setShowExtraPayment(false);
    setActionSuccess('Loan paid off early!');
    setTimeout(() => { setActionSuccess(''); onClose(); }, 2000);
  };

  const toggleLoanSelection = (id: string) => {
    setSelectedLoanIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  let m = loan.startMonth;
  let y = loan.startYear;
  const schedule: { month: number; year: number; payment: number; balance: number; paid: boolean }[] = [];
  let remaining = loan.totalToRepay;
  for (let i = 0; i < loan.paymentsMade + loan.monthsRemaining; i++) {
    const payment = Math.min(loan.monthlyPayment, remaining);
    remaining = Math.max(0, remaining - payment);
    const nextM = m + 1 > 12 ? 1 : m + 1;
    const nextY = m + 1 > 12 ? y + 1 : y;
    schedule.push({ month: nextM, year: nextY, payment, balance: remaining, paid: i < loan.paymentsMade });
    m = nextM;
    y = nextY;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-cyan-500/30 rounded-3xl p-6 max-w-lg w-full relative my-8 max-h-[85vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <X size={20} />
        </button>

        {actionSuccess && (
          <div className="mb-4 bg-emerald-950/40 border-2 border-emerald-500/40 rounded-2xl p-3 text-center">
            <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-1" />
            <p className="text-emerald-400 font-bold text-sm">{actionSuccess}</p>
          </div>
        )}

        <div className="flex items-center gap-2 mb-1">
          <Landmark size={24} className="text-cyan-400" />
          <h2 className="text-2xl font-black text-cyan-400">{loan.bankName}</h2>
          {loan.loanTypeName && (
            <span className="ml-auto bg-cyan-500/10 text-cyan-400 text-xs font-bold px-3 py-1 rounded-full">
              {loan.loanTypeName}
            </span>
          )}
        </div>
        <p className="text-slate-500 text-sm mb-4">{loan.purpose}</p>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
              <DollarSign size={12} /> Original Principal
            </div>
            <div className="text-xl font-black text-white">${loan.principal.toLocaleString()}</div>
          </div>
          <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
              <DollarSign size={12} /> Total to Repay
            </div>
            <div className="text-xl font-black text-amber-400">${loan.totalToRepay.toLocaleString()}</div>
          </div>
          <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
              <Clock size={12} /> Monthly Payment
            </div>
            <div className="text-xl font-black text-cyan-400">${loan.monthlyPayment}/mo</div>
          </div>
          <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
              <Calendar size={12} /> Next Due
            </div>
            <div className={`text-xl font-black ${isOverdue ? 'text-red-400' : 'text-white'}`}>
              {MONTHS[loan.nextPaymentMonth - 1]} {loan.nextPaymentYear}
            </div>
          </div>
        </div>

        {/* Remaining balance with progress bar */}
        <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-medium">Remaining Balance</span>
            <span className="text-2xl font-black text-red-400">${loan.remaining.toLocaleString()}</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-emerald-400">{progressPct}% paid off</span>
            <span className="text-slate-500">{loan.paymentsMade} of {loan.paymentsMade + loan.monthsRemaining} payments</span>
          </div>
        </div>

        {/* Overdue alert */}
        {isOverdue && loan.remaining > 0 && (
          <div className="bg-red-950/40 border-2 border-red-500/40 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={18} className="text-red-400" />
              <span className="text-red-400 font-bold text-sm">
                {loan.missedPayments > 0
                  ? `${loan.missedPayments} missed payment${loan.missedPayments > 1 ? 's' : ''}!`
                  : 'Payment due now!'}
              </span>
            </div>
            <p className="text-red-300 text-xs">
              The bank is contacting you. Pay ${loan.monthlyPayment} now to avoid further penalties.
              Your available cash: <span className="font-bold text-amber-400">${state.cash.toLocaleString()}</span>
            </p>
          </div>
        )}

        {/* Pay button */}
        {loan.remaining > 0 && (
          <>
            <button
              onClick={handlePay}
              disabled={!canPay}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all mb-3 ${
                canPay
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              {paymentSuccess ? (
                <><CheckCircle2 size={18} /> Payment Successful!</>
              ) : (
                <><DollarSign size={18} /> Pay ${loan.monthlyPayment} Now</>
              )}
            </button>

            <button
              onClick={() => { sfx.click(); setShowExtraPayment(!showExtraPayment); }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all mb-3 ${
                showExtraPayment
                  ? 'bg-cyan-500/20 border-2 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-950/50 border border-white/10 text-slate-300 hover:border-cyan-500/30 hover:text-cyan-300'
              }`}
            >
              <Plus size={16} /> Extra Payment / Early Payoff
            </button>
          </>
        )}

        {showExtraPayment && loan.remaining > 0 && (
          <div className="bg-cyan-950/20 border-2 border-cyan-500/30 rounded-2xl p-4 mb-4">
            <h3 className="text-sm font-bold text-cyan-300 mb-2 flex items-center gap-1.5">
              <Plus size={14} /> Extra Payment
            </h3>
            <p className="text-slate-400 text-xs mb-3">
              Pay more than the minimum to reduce your balance faster. Paying off the full remaining balance early incurs a {loan.earlyPayoffFeePct * 100}% fee from {loan.bankName}.
            </p>

            <div className="bg-slate-950/40 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500">Remaining Balance</span>
                <span className="text-white font-bold">${loan.remaining.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500">Early Payoff Fee ({loan.earlyPayoffFeePct * 100}%)</span>
                <span className="text-red-400 font-bold">${earlyPayoffFee.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                <span className="text-slate-400 font-bold">Total to Pay Off Early</span>
                <span className="text-amber-400 font-black text-sm">${earlyPayoffTotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-slate-500">Your Cash</span>
                <span className={state.cash >= earlyPayoffTotal ? 'text-emerald-400' : 'text-red-400'}>${state.cash.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={extraAmount}
                onChange={e => setExtraAmount(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none"
              />
              <button
                onClick={handleExtraPayment}
                disabled={!extraAmount || parseInt(extraAmount, 10) <= 0 || parseInt(extraAmount, 10) > state.cash || parseInt(extraAmount, 10) >= loan.remaining}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  extraAmount && parseInt(extraAmount, 10) > 0 && parseInt(extraAmount, 10) <= state.cash && parseInt(extraAmount, 10) < loan.remaining
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:scale-[1.02]'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                Pay Extra
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {[1000, 5000, 10000, 25000].filter(amt => amt < loan.remaining && amt <= state.cash).map(amt => (
                <button
                  key={amt}
                  onClick={() => setExtraAmount(String(amt))}
                  className="px-3 py-1.5 bg-slate-950/50 border border-white/10 hover:border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-bold transition-all"
                >
                  +${amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>

            <button
              onClick={handleEarlyPayoff}
              disabled={!canPayoffEarly}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                canPayoffEarly
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 size={16} /> Pay Off Early (${earlyPayoffTotal.toLocaleString()})
            </button>
            {!canPayoffEarly && state.cash < earlyPayoffTotal && loan.remaining > 0 && (
              <p className="text-center text-xs text-red-400 mt-2">
                You need ${(earlyPayoffTotal - state.cash).toLocaleString()} more to pay off this loan early.
              </p>
            )}
          </div>
        )}

        {loan.remaining <= 0 && (
          <div className="bg-emerald-950/40 border-2 border-emerald-500/40 rounded-2xl p-4 mb-4 text-center">
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-emerald-400 font-bold">This loan is fully paid off!</p>
          </div>
        )}

        {/* Refinance & Consolidate buttons */}
        {loan.remaining > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => { sfx.click(); setShowRefinance(!showRefinance); setShowConsolidate(false); }}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                showRefinance
                  ? 'bg-violet-500/20 border-2 border-violet-500/50 text-violet-300'
                  : 'bg-slate-950/50 border border-white/10 text-slate-300 hover:border-violet-500/30 hover:text-violet-300'
              }`}
            >
              <RefreshCw size={16} /> Refinance
            </button>
            <button
              onClick={() => { sfx.click(); setShowConsolidate(!showConsolidate); setShowRefinance(false); }}
              disabled={otherLoans.length === 0}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                otherLoans.length === 0
                  ? 'bg-slate-950/30 border border-white/5 text-slate-700 cursor-not-allowed'
                  : showConsolidate
                  ? 'bg-violet-500/20 border-2 border-violet-500/50 text-violet-300'
                  : 'bg-slate-950/50 border border-white/10 text-slate-300 hover:border-violet-500/30 hover:text-violet-300'
              }`}
            >
              <Layers size={16} /> Consolidate
            </button>
          </div>
        )}

        {/* Refinance panel */}
        {showRefinance && loan.remaining > 0 && (
          <div className="bg-violet-950/20 border-2 border-violet-500/30 rounded-2xl p-4 mb-4">
            <h3 className="text-sm font-bold text-violet-300 mb-2 flex items-center gap-1.5">
              <RefreshCw size={14} /> Refinance This Loan
            </h3>
            <p className="text-slate-400 text-xs mb-3">
              Refinancing replaces your current loan with a new one at a lower 5% interest rate
              and extends the term to 36 months, lowering your monthly payment.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-slate-950/40 rounded-lg p-2">
                <span className="text-slate-500">Current Rate</span>
                <div className="text-white font-bold">{(loan.interestRate * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-slate-950/40 rounded-lg p-2">
                <span className="text-slate-500">New Rate</span>
                <div className="text-violet-300 font-bold">5%</div>
              </div>
              <div className="bg-slate-950/40 rounded-lg p-2">
                <span className="text-slate-500">Current Payment</span>
                <div className="text-white font-bold">${loan.monthlyPayment}/mo</div>
              </div>
              <div className="bg-slate-950/40 rounded-lg p-2">
                <span className="text-slate-500">New Payment</span>
                <div className="text-violet-300 font-bold">${Math.ceil(loan.remaining * 1.05 / 36)}/mo</div>
              </div>
              <div className="bg-slate-950/40 rounded-lg p-2">
                <span className="text-slate-500">Current Term</span>
                <div className="text-white font-bold">{loan.monthsRemaining} mo left</div>
              </div>
              <div className="bg-slate-950/40 rounded-lg p-2">
                <span className="text-slate-500">New Term</span>
                <div className="text-violet-300 font-bold">36 months</div>
              </div>
            </div>
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-2 mb-3 text-xs text-amber-300">
              Note: While your monthly payment drops, extending the term means you may pay more total interest over the life of the loan.
            </div>
            <button
              onClick={handleRefinance}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl transition-all hover:scale-[1.02]"
            >
              <RefreshCw size={16} /> Confirm Refinance
            </button>
          </div>
        )}

        {/* Consolidate panel */}
        {showConsolidate && loan.remaining > 0 && otherLoans.length > 0 && (
          <div className="bg-violet-950/20 border-2 border-violet-500/30 rounded-2xl p-4 mb-4">
            <h3 className="text-sm font-bold text-violet-300 mb-2 flex items-center gap-1.5">
              <Layers size={14} /> Consolidate Loans
            </h3>
            <p className="text-slate-400 text-xs mb-3">
              Combine multiple loans into a single loan at 4% interest over 48 months.
              You'll make one monthly payment instead of several.
            </p>
            <div className="space-y-1 mb-3">
              {state.loans.filter(l => l.remaining > 0).map(l => {
                const isSelected = selectedLoanIds.includes(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLoanSelection(l.id)}
                    className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-violet-950/40 border border-violet-500/30 text-violet-300'
                        : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-violet-500 border-violet-500' : 'border-slate-600'
                      }`}>
                        {isSelected && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                      <span>{l.purpose}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">${l.monthlyPayment}/mo</span>
                      <span className="text-slate-500">${l.remaining.toLocaleString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedLoanIds.length >= 2 ? (
              <>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-slate-950/40 rounded-lg p-2">
                    <span className="text-slate-500">Current Total/mo</span>
                    <div className="text-white font-bold">
                      ${state.loans.filter(l => selectedLoanIds.includes(l.id)).reduce((s, l) => s + l.monthlyPayment, 0)}
                    </div>
                  </div>
                  <div className="bg-slate-950/40 rounded-lg p-2">
                    <span className="text-slate-500">New Payment</span>
                    <div className="text-violet-300 font-bold">
                      ${Math.ceil(state.loans.filter(l => selectedLoanIds.includes(l.id)).reduce((s, l) => s + l.remaining, 0) * 1.04 / 48)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleConsolidate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-xl transition-all hover:scale-[1.02]"
                >
                  <Layers size={16} /> Consolidate {selectedLoanIds.length} Loans
                </button>
              </>
            ) : (
              <p className="text-center text-slate-500 text-xs py-2">Select at least 2 loans to consolidate.</p>
            )}
          </div>
        )}

        {/* Payment schedule */}
        <div>
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
            <Calendar size={14} className="text-cyan-400" />
            Payment Schedule
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {schedule.map((s, i) => (
              <div
                key={i}
                className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                  s.paid
                    ? 'bg-emerald-950/30 text-slate-500'
                    : isOverdue && i === loan.paymentsMade
                    ? 'bg-red-950/30 text-red-300 border border-red-500/20'
                    : 'bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {s.paid ? (
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  ) : (
                    <Clock size={12} className="text-slate-600" />
                  )}
                  <span>{MONTHS[s.month - 1]} {s.year}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">${s.payment}</span>
                  <span className="text-slate-500">Bal: ${s.balance.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
