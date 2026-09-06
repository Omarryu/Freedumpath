import type { GameAction, ActionCategory, Archetype, Stats } from './types';

export const ALL_ACTIONS: GameAction[] = [
  // Hustle
  { id: 'freelance', name: 'Freelance Gig', icon: '💼', category: 'hustle' as const, cost: 0, description: 'Take a freelance gig for quick cash.', effects: { cash: 300, energy: -8 } },
  { id: 'sidehustle', name: 'Side Hustle', icon: '🛒', category: 'hustle' as const, cost: 100, description: 'Start a small side hustle.', effects: { cash: -100, energy: -10, monthlyIncome: 50 }, monthlyIncome: 50 },
  { id: 'dropship', name: 'Dropshipping', icon: '📦', category: 'hustle' as const, cost: 500, description: 'Launch a dropshipping store.', effects: { cash: -500, energy: -15, monthlyIncome: 200 }, monthlyIncome: 200, requiresLevel: 2 },
  { id: 'consulting', name: 'Consulting', icon: '🧠', category: 'hustle' as const, cost: 0, description: 'Offer consulting services.', effects: { cash: 800, energy: -12, knowledge: 2 }, requiresLevel: 3 },
  { id: 'saas', name: 'SaaS App', icon: '💻', category: 'hustle' as const, cost: 2000, description: 'Build a SaaS application.', effects: { cash: -2000, energy: -20, monthlyIncome: 800 }, monthlyIncome: 800, requiresLevel: 4 },

  // Learn
  { id: 'readbook', name: 'Read Book', icon: '📖', category: 'learn' as const, cost: 20, description: 'Read a book to gain knowledge.', effects: { cash: -20, knowledge: 5, energy: -3 } },
  { id: 'onlinecourse', name: 'Online Course', icon: '🎓', category: 'learn' as const, cost: 200, description: 'Take an online course.', effects: { cash: -200, knowledge: 12, energy: -5 } },
  { id: 'workshop', name: 'Workshop', icon: '🏭', category: 'learn' as const, cost: 500, description: 'Attend a workshop.', effects: { cash: -500, knowledge: 20, connections: 3 }, requiresLevel: 2 },
  { id: 'mentor', name: 'Get Mentor', icon: '🧑‍🏫', category: 'learn' as const, cost: 1000, description: 'Find a mentor.', effects: { cash: -1000, knowledge: 30, connections: 5 }, requiresLevel: 3 },
  { id: 'mba', name: 'MBA Program', icon: '🏛️', category: 'learn' as const, cost: 5000, description: 'Enroll in an MBA program.', effects: { cash: -5000, knowledge: 50, connections: 10 }, requiresLevel: 5 },

  // Invest
  { id: 'stocks', name: 'Buy Stocks', icon: '📊', category: 'invest' as const, cost: 500, description: 'Invest in the stock market.', effects: { cash: -500, monthlyIncome: 30 }, monthlyIncome: 30 },
  { id: 'crypto', name: 'Crypto', icon: '🪙', category: 'invest' as const, cost: 300, description: 'Invest in cryptocurrency.', effects: { cash: -300, monthlyIncome: 20, happiness: -2 }, monthlyIncome: 20, requiresLevel: 2 },
  { id: 'reit', name: 'REIT Fund', icon: '🏢', category: 'invest' as const, cost: 2000, description: 'Invest in a REIT fund.', effects: { cash: -2000, monthlyIncome: 150 }, monthlyIncome: 150, requiresLevel: 3 },
  { id: 'indexfund', name: 'Index Fund', icon: '📈', category: 'invest' as const, cost: 1000, description: 'Invest in an index fund.', effects: { cash: -1000, monthlyIncome: 70 }, monthlyIncome: 70, requiresLevel: 2 },
  { id: 'angelinvest', name: 'Angel Invest', icon: '😇', category: 'invest' as const, cost: 5000, description: 'Angel invest in a startup.', effects: { cash: -5000, monthlyIncome: 400 }, monthlyIncome: 400, requiresLevel: 5 },

  // Network
  { id: 'meetup', name: 'Meetup', icon: '🤝', category: 'network' as const, cost: 0, description: 'Attend a local meetup.', effects: { connections: 5, energy: -5 } },
  { id: 'conference', name: 'Conference', icon: '🎤', category: 'network' as const, cost: 300, description: 'Attend a conference.', effects: { cash: -300, connections: 12, knowledge: 3 }, requiresLevel: 2 },
  { id: 'mastermind', name: 'Mastermind', icon: '🧩', category: 'network' as const, cost: 1000, description: 'Join a mastermind group.', effects: { cash: -1000, connections: 20, knowledge: 5 }, requiresLevel: 3 },
  { id: 'partnership', name: 'Partnership', icon: '🤝', category: 'network' as const, cost: 500, description: 'Form a partnership.', effects: { cash: -500, connections: 15, monthlyIncome: 100 }, monthlyIncome: 100, requiresLevel: 4 },

  // Wellness
  { id: 'exercise', name: 'Exercise', icon: '🏃', category: 'wellness' as const, cost: 0, description: 'Work out to boost energy.', effects: { energy: 15, happiness: 5 } },
  { id: 'meditate', name: 'Meditate', icon: '🧘', category: 'wellness' as const, cost: 0, description: 'Meditate for mental clarity.', effects: { energy: 10, happiness: 8 } },
  { id: 'vacation', name: 'Vacation', icon: '✈️', category: 'wellness' as const, cost: 800, description: 'Take a vacation.', effects: { cash: -800, energy: 30, happiness: 25 }, requiresLevel: 2 },
  { id: 'healthcheck', name: 'Health Check', icon: '🏥', category: 'wellness' as const, cost: 200, description: 'Get a health checkup.', effects: { cash: -200, energy: 10, happiness: 3 } },
];

// Bank / Loan actions — major investments
export const BANK_ACTIONS: GameAction[] = [
  { id: 'buy_land', name: 'Buy Land', icon: '🌍', category: 'bank' as const, cost: 10000, description: 'Purchase land for future development.', effects: { cash: -10000, monthlyIncome: 0 }, monthlyIncome: 0, requiresLevel: 2, createsAsset: { name: 'Land Plot', type: 'land' as const, monthlyIncome: 0, purchasePrice: 10000, icon: '🌍', description: 'A plot of land with appreciation potential.' } },
  { id: 'buy_property', name: 'Buy Property', icon: '🏠', category: 'bank' as const, cost: 25000, description: 'Buy a rental property.', effects: { cash: -25000, monthlyIncome: 1200 }, monthlyIncome: 1200, requiresLevel: 3, createsAsset: { name: 'Rental Property', type: 'property' as const, monthlyIncome: 1200, purchasePrice: 25000, icon: '🏠', description: 'A rental property generating monthly income.' } },
  { id: 'buy_manufacturing', name: 'Manufacturing', icon: '🏭', category: 'bank' as const, cost: 50000, description: 'Acquire a manufacturing business.', effects: { cash: -50000, monthlyIncome: 3500 }, monthlyIncome: 3500, requiresLevel: 4, createsAsset: { name: 'Manufacturing Biz', type: 'manufacturing' as const, monthlyIncome: 3500, purchasePrice: 50000, icon: '🏭', description: 'A manufacturing business with strong cash flow.' } },
  { id: 'buy_retail', name: 'Retail Store', icon: '🏬', category: 'bank' as const, cost: 30000, description: 'Buy a retail business.', effects: { cash: -30000, monthlyIncome: 2000 }, monthlyIncome: 2000, requiresLevel: 4, createsAsset: { name: 'Retail Business', type: 'retail' as const, monthlyIncome: 2000, purchasePrice: 30000, icon: '🏬', description: 'A retail store with steady foot traffic.' } },
  { id: 'buy_business', name: 'Buy Business', icon: '🏢', category: 'bank' as const, cost: 75000, description: 'Acquire an established business.', effects: { cash: -75000, monthlyIncome: 6000 }, monthlyIncome: 6000, requiresLevel: 5, createsAsset: { name: 'Established Business', type: 'business' as const, monthlyIncome: 6000, purchasePrice: 75000, icon: '🏢', description: 'A profitable business with proven track record.' } },
];

export function getActionPool(state: { level: number; unlockedActions: string[] }): GameAction[] {
  const available = ALL_ACTIONS.filter(a => {
    if (a.requiresLevel && state.level < a.requiresLevel) return false;
    return true;
  });
  return [...available, ...BANK_ACTIONS.filter(a => !a.requiresLevel || state.level >= a.requiresLevel)];
}

export function getArchetypeBonus(archetype: Archetype): Partial<Stats> {
  const bonuses: Record<Archetype, Partial<Stats>> = {
    hustler: { cash: 2000, connections: 5 },
    creative: { happiness: 20, knowledge: 10 },
    investor: { knowledge: 15, monthlyIncome: 100 },
    scholar: { knowledge: 25, energy: 10 },
  };
  return bonuses[archetype];
}
