import type { GameState, Archetype, GameAction, Asset, Loan, LoanProduct, RentalType, BuildingType, Building, IncomeFrequency, LifeEvent, PlacedBuilding } from './types';
import { ARCHETYPES, BANKS } from './types';
import { getActionPool } from './actions';

const SAVE_KEY = 'freedompath_save';

function saveKeyFor(userId?: string | null): string {
  return userId ? `freedompath_save_${userId}` : SAVE_KEY;
}

export function createNewGame(playerName: string, archetype: Archetype, age: number = 22): GameState {
  const bonus = ARCHETYPES[archetype].bonus;
  return {
    phase: 'playing',
    playerName,
    archetype,
    age,
    month: 1,
    year: 2026,
    actionsPerMonth: 3,
    actionsUsedThisMonth: 0,
    turnsPlayed: 0,
    cash: 1000 + (bonus.cash || 0),
    bankBalance: 0,
    energy: 100,
    happiness: 50 + (bonus.happiness || 0),
    knowledge: 5 + (bonus.knowledge || 0),
    connections: 5 + (bonus.connections || 0),
    monthlyIncome: 0 + (bonus.monthlyIncome || 0),
    level: 1,
    xp: 0,
    xpToNext: 100,
    assets: [],
    loans: [],
    incomeSources: [],
    log: [{
      month: 1,
      year: 2026,
      message: `${playerName} begins their freedom journey as ${ARCHETYPES[archetype].name}. The 9-5 grind ends here.`,
      type: 'milestone' as const,
    }],
    unlockedActions: [],
  };
}

export function saveGame(state: GameState, userId?: string | null): void {
  try { localStorage.setItem(saveKeyFor(userId), JSON.stringify(state)); } catch { /* ignore */ }
}

export function loadGame(userId?: string | null): GameState | null {
  try {
    const raw = localStorage.getItem(saveKeyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || typeof parsed.cash !== 'number' || !Array.isArray(parsed.assets) || !Array.isArray(parsed.loans)) {
      localStorage.removeItem(saveKeyFor(userId));
      return null;
    }
    if (typeof parsed.bankBalance !== 'number') parsed.bankBalance = 0;
    return parsed;
  } catch { return null; }
}

export function clearSave(userId?: string | null): void {
  try { localStorage.removeItem(saveKeyFor(userId)); } catch { /* ignore */ }
}

export function executeAction(state: GameState, action: GameAction): GameState {
  const next: GameState = { ...state, assets: [...state.assets], loans: [...state.loans], log: [...state.log] };

  next.cash -= action.cost;
  next.cash += action.effects.cash || 0;
  next.energy = clamp(next.energy + (action.effects.energy || 0), 0, 100);
  next.happiness = clamp(next.happiness + (action.effects.happiness || 0), 0, 100);
  next.knowledge = Math.max(0, next.knowledge + (action.effects.knowledge || 0));
  next.connections = Math.max(0, next.connections + (action.effects.connections || 0));
  next.monthlyIncome += action.monthlyIncome || 0;
  next.actionsUsedThisMonth++;
  next.lastCashChange = -action.cost + (action.effects.cash || 0);

  if (action.createsAsset) {
    const baseAsset = action.createsAsset;
    const isLand = baseAsset.type === 'land';
    const isProperty = baseAsset.type === 'property';
    const isVehicle = baseAsset.type === 'vehicle' || baseAsset.id === 'car' || baseAsset.id === 'luxury_car' || baseAsset.id === 'sports_car';
    const asset: Asset = {
      ...baseAsset,
      id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      incomeFrequency: 'monthly',
      lastCollectedMonth: next.month,
      lastCollectedYear: next.year,
      rental: null,
      buildings: [],
      canRental: isProperty || isVehicle || isLand,
      canBuild: isLand,
      liquidationValue: Math.round((baseAsset.purchasePrice || 0) * 0.7),
    };
    next.assets.push(asset);
  }

  if (action.monthlyIncome && action.monthlyIncome > 0) {
    next.incomeSources = [...next.incomeSources, {
      id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: action.name,
      icon: action.icon,
      monthlyAmount: action.monthlyIncome,
      category: action.category,
      acquiredMonth: next.month,
      acquiredYear: next.year,
    }];
  }

  const xpGain = 10 + Math.max(0, action.cost / 100);
  next.xp += xpGain;
  while (next.xp >= next.xpToNext) {
    next.xp -= next.xpToNext;
    next.level++;
    next.xpToNext = Math.floor(next.xpToNext * 1.5);
    next.log.unshift({ month: next.month, year: next.year, message: `🎉 LEVEL UP! You reached level ${next.level}!`, type: 'milestone' });
    next.phase = 'milestone';
  }

  const cashMsg = action.cost > 0 ? ` (-$${action.cost})` : action.effects.cash ? ` (+$${action.effects.cash})` : '';
  const incomeMsg = action.monthlyIncome ? ` (+$${action.monthlyIncome}/mo)` : '';
  next.log.unshift({
    month: next.month,
    year: next.year,
    message: `${action.icon} ${action.name}${cashMsg}${incomeMsg}`,
    type: 'action' as const,
  });

  return next;
}

export function takeLoan(state: GameState, amount: number, purpose: string, bankId: string = 'freedom', product?: LoanProduct): GameState {
  const next: GameState = { ...state, loans: [...state.loans], incomeSources: [...state.incomeSources], log: [...state.log] };
  const bank = BANKS.find(b => b.id === bankId) ?? BANKS[0];
  const loanProduct = product ?? bank.loanProducts[0];
  const interestRate = loanProduct.interestRate;
  const months = loanProduct.termMonths;
  const totalToRepay = Math.ceil(amount * (1 + interestRate));
  const monthlyPayment = Math.ceil(totalToRepay / months);

  const loan: Loan = {
    id: `loan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    principal: amount,
    remaining: totalToRepay,
    monthlyPayment,
    interestRate,
    monthsRemaining: months,
    purpose,
    startMonth: next.month,
    startYear: next.year,
    nextPaymentMonth: next.month + 1 > 12 ? 1 : next.month + 1,
    nextPaymentYear: next.month + 1 > 12 ? next.year + 1 : next.year,
    missedPayments: 0,
    paymentsMade: 0,
    totalToRepay,
    bankId: bank.id,
    bankName: bank.name,
    earlyPayoffFeePct: loanProduct.earlyPayoffFeePct,
    loanType: loanProduct.type,
    loanTypeName: loanProduct.name,
  };
  next.loans.push(loan);
  next.cash += amount;
  next.lastCashChange = amount;
  next.log.unshift({ month: next.month, year: next.year, message: `${loanProduct.icon} ${bank.name} ${loanProduct.name}: +${amount} for ${purpose}. Pay ${monthlyPayment}/mo for ${months} months. Total repayment: ${totalToRepay}.`, type: 'loan' });

  return next;
}

export function makeLoanPayment(state: GameState, loanId: string): GameState {
  const next: GameState = { ...state, loans: [...state.loans], log: [...state.log] };
  const loan = next.loans.find(l => l.id === loanId);
  if (!loan) return next;
  const payment = Math.min(loan.monthlyPayment, loan.remaining);
  if (next.cash < payment) return next;
  next.cash -= payment;
  loan.remaining = Math.max(0, loan.remaining - payment);
  loan.paymentsMade++;
  loan.monthsRemaining = Math.max(0, loan.monthsRemaining - 1);
  loan.missedPayments = 0;
  loan.nextPaymentMonth = next.month + 1 > 12 ? 1 : next.month + 1;
  loan.nextPaymentYear = next.month + 1 > 12 ? next.year + 1 : next.year;
  next.log.unshift({ month: next.month, year: next.year, message: `🏦 Loan payment: -${payment} for ${loan.purpose}. Remaining: ${loan.remaining}.`, type: 'loan' });
  if (loan.remaining <= 0) {
    next.loans = next.loans.filter(l => l.id !== loanId);
    next.log.unshift({ month: next.month, year: next.year, message: `🎉 Loan paid off: ${loan.purpose}!`, type: 'milestone' });
  }
  return next;
}

export function makeExtraPayment(state: GameState, loanId: string, amount: number): GameState {
  const next: GameState = { ...state, loans: [...state.loans], log: [...state.log] };
  const loan = next.loans.find(l => l.id === loanId);
  if (!loan || loan.remaining <= 0 || amount <= 0) return next;
  if (next.cash < amount) return next;

  const isEarlyPayoff = amount >= loan.remaining;
  let actualAmount = amount;
  let fee = 0;

  if (isEarlyPayoff) {
    fee = Math.ceil(loan.remaining * loan.earlyPayoffFeePct);
    actualAmount = loan.remaining + fee;
    if (next.cash < actualAmount) return next;
  }

  next.cash -= actualAmount;
  loan.remaining = Math.max(0, loan.remaining - amount);
  loan.paymentsMade++;
  loan.monthsRemaining = Math.max(0, loan.monthsRemaining - 1);
  loan.missedPayments = 0;
  loan.nextPaymentMonth = next.month + 1 > 12 ? 1 : next.month + 1;
  loan.nextPaymentYear = next.month + 1 > 12 ? next.year + 1 : next.year;

  if (isEarlyPayoff) {
    next.log.unshift({ month: next.month, year: next.year, message: `🏦 Early payoff: -${actualAmount} (incl ${fee} fee) for ${loan.purpose}.`, type: 'loan' });
    next.loans = next.loans.filter(l => l.id !== loanId);
    next.log.unshift({ month: next.month, year: next.year, message: `🎉 Loan paid off early: ${loan.purpose}!`, type: 'milestone' });
  } else {
    next.log.unshift({ month: next.month, year: next.year, message: `🏦 Extra payment: -${amount} for ${loan.purpose}. Remaining: ${loan.remaining}.`, type: 'loan' });
  }
  return next;
}

export function refinanceLoan(state: GameState, loanId: string): GameState {
  const next: GameState = { ...state, loans: [...state.loans], log: [...state.log] };
  const oldLoan = next.loans.find(l => l.id === loanId);
  if (!oldLoan || oldLoan.remaining <= 0) return next;

  const newRate = 0.05;
  const newTerm = 36;
  const newPrincipal = oldLoan.remaining;
  const newTotal = Math.ceil(newPrincipal * (1 + newRate));
  const newMonthly = Math.ceil(newTotal / newTerm);

  const refinanced: Loan = {
    id: `loan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    principal: newPrincipal,
    remaining: newTotal,
    monthlyPayment: newMonthly,
    interestRate: newRate,
    monthsRemaining: newTerm,
    purpose: `${oldLoan.purpose} (Refinanced)`,
    startMonth: next.month,
    startYear: next.year,
    nextPaymentMonth: next.month + 1 > 12 ? 1 : next.month + 1,
    nextPaymentYear: next.month + 1 > 12 ? next.year + 1 : next.year,
    missedPayments: 0,
    paymentsMade: 0,
    totalToRepay: newTotal,
    bankId: 'summit',
    bankName: 'Summit Credit Union',
    earlyPayoffFeePct: 0.03,
    loanType: oldLoan.loanType ?? 'personal',
    loanTypeName: oldLoan.loanTypeName ?? 'Personal Loan',
  };

  next.loans = next.loans.filter(l => l.id !== loanId);
  next.loans.push(refinanced);
  next.log.unshift({
    month: next.month, year: next.year,
    message: `🏦 Refinanced "${oldLoan.purpose}": ${newPrincipal} at 5% over ${newTerm}mo. New payment: ${newMonthly}/mo (was ${oldLoan.monthlyPayment}/mo).`,
    type: 'loan',
  });
  return next;
}

export function consolidateLoans(state: GameState, loanIds: string[]): GameState {
  const next: GameState = { ...state, loans: [...state.loans], log: [...state.log] };
  const selected = next.loans.filter(l => loanIds.includes(l.id));
  if (selected.length < 2) return next;

  const totalRemaining = selected.reduce((sum, l) => sum + l.remaining, 0);
  const newRate = 0.04;
  const newTerm = 48;
  const newTotal = Math.ceil(totalRemaining * (1 + newRate));
  const newMonthly = Math.ceil(newTotal / newTerm);

  const consolidated: Loan = {
    id: `loan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    principal: totalRemaining,
    remaining: newTotal,
    monthlyPayment: newMonthly,
    interestRate: newRate,
    monthsRemaining: newTerm,
    purpose: `Consolidated ${selected.length} loans`,
    startMonth: next.month,
    startYear: next.year,
    nextPaymentMonth: next.month + 1 > 12 ? 1 : next.month + 1,
    nextPaymentYear: next.month + 1 > 12 ? next.year + 1 : next.year,
    missedPayments: 0,
    paymentsMade: 0,
    totalToRepay: newTotal,
    bankId: 'apex',
    bankName: 'Apex Capital',
    earlyPayoffFeePct: 0.04,
    loanType: 'personal',
    loanTypeName: 'Consolidated Loan',
  };

  const oldTotalMonthly = selected.reduce((sum, l) => sum + l.monthlyPayment, 0);
  next.loans = next.loans.filter(l => !loanIds.includes(l.id));
  next.loans.push(consolidated);
  next.log.unshift({
    month: next.month, year: next.year,
    message: `🏦 Consolidated ${selected.length} loans into one: ${totalRemaining} at 4% over ${newTerm}mo. New payment: ${newMonthly}/mo (was ${oldTotalMonthly}/mo total).`,
    type: 'loan',
  });
  return next;
}

export function advanceMonth(state: GameState): GameState {
  const next: GameState = { ...state, assets: [...state.assets], loans: [...state.loans], incomeSources: [...state.incomeSources], log: [...state.log] };

  next.month++;
  if (next.month > 12) { next.month = 1; next.year++; }
  next.actionsUsedThisMonth = 0;
  next.turnsPlayed++;
  if (next.turnsPlayed % 12 === 0) next.age++;

  const income = next.monthlyIncome;
  if (income > 0) {
    next.cash += income;
    next.lastIncomeCollected = income;
    next.lastCashChange = income;
    next.log.unshift({ month: next.month, year: next.year, message: `💰 Monthly income: +$${income}`, type: 'income' });
  } else {
    next.lastIncomeCollected = 0;
  }

  if (next.loans.length > 0) {
    let totalPaid = 0;
    let totalOverdue = 0;
    next.loans = next.loans.map(loan => {
      const dueKey = loan.nextPaymentMonth + loan.nextPaymentYear * 12;
      const currentKey = next.month + next.year * 12;
      if (currentKey >= dueKey) {
        const payment = Math.min(loan.monthlyPayment, loan.remaining);
        if (next.cash >= payment) {
          next.cash -= payment;
          loan.remaining = Math.max(0, loan.remaining - payment);
          loan.paymentsMade++;
          loan.monthsRemaining = Math.max(0, loan.monthsRemaining - 1);
          loan.missedPayments = 0;
          totalPaid += payment;
          loan.nextPaymentMonth = next.month + 1 > 12 ? 1 : next.month + 1;
          loan.nextPaymentYear = next.month + 1 > 12 ? next.year + 1 : next.year;
        } else {
          loan.missedPayments++;
          totalOverdue += payment;
        }
      }
      return loan;
    }).filter(loan => loan.remaining > 0);
    if (totalPaid > 0) {
      next.log.unshift({ month: next.month, year: next.year, message: `🏦 Auto-paid loan: -${totalPaid}.`, type: 'loan' });
    }
    if (totalOverdue > 0) {
      next.log.unshift({ month: next.month, year: next.year, message: `⚠️ Bank Alert: ${totalOverdue} in overdue loan payments! Visit the bank to pay.`, type: 'loan' });
    }
  }

  next.energy = clamp(next.energy + 20, 0, 100);
  next.happiness = clamp(next.happiness - 3, 0, 100);
  next.xp += 5;

  return next;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function collectAssetIncome(state: GameState, assetId: string, destination: 'cash' | 'bank'): GameState {
  const next: GameState = { ...state, assets: [...state.assets], log: [...state.log] };
  const asset = next.assets.find(a => a.id === assetId);
  if (!asset) return next;

  // Only allow collecting once per month — prevents spamming the button
  if (asset.lastCollectedMonth === next.month && asset.lastCollectedYear === next.year) {
    return next;
  }

  const totalIncome = (asset.rental?.monthlyRent || 0) + (asset.buildings?.reduce((s, b) => s + b.monthlyIncome, 0) || 0);
  if (totalIncome <= 0) return next;

  if (destination === 'bank') {
    next.bankBalance = (next.bankBalance || 0) + totalIncome;
  } else {
    next.cash += totalIncome;
  }
  next.lastCashChange = totalIncome;
  next.log.unshift({
    month: next.month, year: next.year,
    message: `💰 Collected ${totalIncome} from ${asset.name} → ${destination === 'bank' ? 'Bank Account' : 'Cash'}`,
    type: 'income',
  });

  const idx = next.assets.findIndex(a => a.id === assetId);
  next.assets[idx] = { ...asset, lastCollectedMonth: next.month, lastCollectedYear: next.year };
  return next;
}

export function liquidateAsset(state: GameState, assetId: string): GameState {
  const next: GameState = { ...state, assets: [...state.assets], incomeSources: [...state.incomeSources], log: [...state.log] };
  const asset = next.assets.find(a => a.id === assetId);
  if (!asset) return next;

  const liquidValue = Math.round((asset.liquidationValue ?? asset.purchasePrice * 0.7));
  next.cash += liquidValue;
  next.lastCashChange = liquidValue;

  if (asset.monthlyIncome > 0) {
    next.monthlyIncome = Math.max(0, next.monthlyIncome - asset.monthlyIncome);
    next.incomeSources = next.incomeSources.filter(s => s.name !== asset.name);
  }
  if (asset.rental) {
    // rental income is manually collected, not in monthlyIncome
  }
  if (asset.buildings) {
    // building income is manually collected, not in monthlyIncome
  }

  next.assets = next.assets.filter(a => a.id !== assetId);
  next.log.unshift({
    month: next.month, year: next.year,
    message: `💸 Liquidated ${asset.name} for ${liquidValue} (70% of purchase price)`,
    type: 'asset',
  });
  return next;
}

export function toggleRental(state: GameState, assetId: string, rentalType: RentalType): GameState {
  const next: GameState = { ...state, assets: [...state.assets], incomeSources: [...state.incomeSources], log: [...state.log] };
  const idx = next.assets.findIndex(a => a.id === assetId);
  if (idx === -1) return next;
  const asset = next.assets[idx];

  const rentalLabels: Record<RentalType, string> = {
    airbnb: 'Airbnb Short-Term Rental',
    residential: 'Residential Long-Term Rental',
    commercial: 'Commercial Lease',
    vehicle_rental: 'Vehicle Rental',
    office: 'Office Lease',
  };

  if (asset.rental?.type === rentalType) {
    next.assets[idx] = { ...asset, rental: null };
    next.log.unshift({ month: next.month, year: next.year, message: `🔓 Stopped renting ${asset.name}`, type: 'asset' });
    return next;
  }

  const baseRent = Math.max(200, Math.round((asset.purchasePrice || 5000) * 0.012));
  const rentMultipliers: Record<RentalType, number> = {
    airbnb: 1.8,
    residential: 1.0,
    commercial: 1.3,
    vehicle_rental: 0.8,
    office: 1.4,
  };
  const monthlyRent = Math.round(baseRent * (rentMultipliers[rentalType] || 1));

  if (asset.rental) {
    // old rental income was manually collected, no monthlyIncome to reverse
  }

  next.assets[idx] = {
    ...asset,
    rental: { type: rentalType, label: rentalLabels[rentalType], monthlyRent, startedMonth: next.month, startedYear: next.year },
  };
  next.log.unshift({
    month: next.month, year: next.year,
    message: `🔑 ${asset.name} → ${rentalLabels[rentalType]} (+${monthlyRent}/mo)`,
    type: 'asset',
  });
  return next;
}

export function buildOnLand(state: GameState, assetId: string, buildingType: BuildingType): GameState {
  const next: GameState = { ...state, assets: [...state.assets], log: [...state.log] };
  if (next.cash < buildingType.cost) return next;

  const idx = next.assets.findIndex(a => a.id === assetId);
  if (idx === -1) return next;
  const asset = next.assets[idx];
  if (asset.type !== 'land') return next;

  next.cash -= buildingType.cost;
  next.lastCashChange = -buildingType.cost;

  const building: Building = {
    id: `bldg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: buildingType.id,
    name: buildingType.name,
    icon: buildingType.icon,
    cost: buildingType.cost,
    monthlyIncome: buildingType.monthlyIncome,
    builtMonth: next.month,
    builtYear: next.year,
  };

  next.assets[idx] = {
    ...asset,
    buildings: [...(asset.buildings || []), building],
  };
  next.log.unshift({
    month: next.month, year: next.year,
    message: `🏗️ Built ${buildingType.name} on ${asset.name} for ${buildingType.cost} (+${buildingType.monthlyIncome}/mo)`,
    type: 'asset',
  });
  return next;
}

export function transferToBank(state: GameState, amount: number): GameState {
  const next: GameState = { ...state, log: [...state.log] };
  const amt = Math.min(amount, next.cash);
  if (amt <= 0) return next;
  next.cash -= amt;
  next.bankBalance = (next.bankBalance || 0) + amt;
  next.lastCashChange = -amt;
  next.log.unshift({ month: next.month, year: next.year, message: `🏦 Transferred ${amt} to bank account`, type: 'asset' });
  return next;
}

export function transferFromBank(state: GameState, amount: number): GameState {
  const next: GameState = { ...state, log: [...state.log] };
  const amt = Math.min(amount, next.bankBalance || 0);
  if (amt <= 0) return next;
  next.bankBalance -= amt;
  next.cash += amt;
  next.lastCashChange = amt;
  next.log.unshift({ month: next.month, year: next.year, message: `💸 Withdrew ${amt} from bank account`, type: 'asset' });
  return next;
}

export { getActionPool };

export function applyLifeEvent(state: GameState, event: LifeEvent, choiceIndex: number): GameState {
  const choice = event.choices[choiceIndex];
  if (!choice) return state;

  let outcome = choice.deterministicOutcome;
  if (!outcome && choice.randomOutcomes && choice.randomOutcomes.length > 0) {
    const roll = Math.random();
    if (choice.randomOutcomes.length === 2) {
      outcome = roll < 0.6 ? choice.randomOutcomes[0] : choice.randomOutcomes[1];
    } else {
      outcome = choice.randomOutcomes[Math.floor(Math.random() * choice.randomOutcomes.length)];
    }
  }
  if (!outcome) return state;

  const next: GameState = { ...state, log: [...state.log] };
  const { impact } = outcome;

  if (impact.cash) next.cash = Math.max(0, next.cash + impact.cash);
  if (impact.happiness) next.happiness = clamp(next.happiness + impact.happiness, 0, 100);
  if (impact.energy) next.energy = clamp(next.energy + impact.energy, 0, 100);
  if (impact.monthlyExpense) next.monthlyIncome = Math.max(0, next.monthlyIncome + impact.monthlyExpense);
  if (impact.passiveIncome) {
    next.monthlyIncome += impact.passiveIncome;
    next.incomeSources = [...(next.incomeSources || []), {
      id: `lifeevt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: event.title,
      icon: '✨',
      monthlyAmount: impact.passiveIncome,
      category: 'passive',
      acquiredMonth: next.month,
      acquiredYear: next.year,
    }];
  }

  next.lastCashChange = impact.cash ?? 0;
  next.log.unshift({
    month: next.month,
    year: next.year,
    message: `${outcome.isPositive ? '✅' : '⚠️'} ${outcome.message}`,
    type: outcome.isPositive ? 'milestone' : 'action',
  });

  return next;
}

export function buyLand(state: GameState, cost: number): GameState {
  if (state.cash < cost) return state;
  return {
    ...state,
    cash: state.cash - cost,
    log: [{
      month: state.month,
      year: state.year,
      message: `🗺️ Purchased new land for ${cost.toLocaleString()}!`,
      type: 'milestone',
    }, ...state.log],
  };
}

export function placeBuilding(
  state: GameState,
  building: { type: string; name: string; icon: string; position: [number, number, number]; color: string; roofColor: string; size: [number, number, number] }
): GameState {
  const cost = 5000;
  if (state.cash < cost) return state;
  const placed: PlacedBuilding = {
    id: `bldg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...building,
    builtMonth: state.month,
  };
  return {
    ...state,
    cash: state.cash - cost,
    customBuildings: [...(state.customBuildings || []), placed],
    log: [{
      month: state.month,
      year: state.year,
      message: `🏗️ Built ${building.name}!`,
      type: 'milestone',
    }, ...state.log],
  };
}
