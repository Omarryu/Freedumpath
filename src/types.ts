export type Archetype = 'hustler' | 'creative' | 'investor' | 'scholar';

export type ActionCategory = 'hustle' | 'learn' | 'invest' | 'network' | 'wellness' | 'bank';

export type AssetType = 'land' | 'property' | 'manufacturing' | 'retail' | 'stocks' | 'business' | 'vehicle';

export type IncomeFrequency = 'daily' | 'weekly' | 'monthly';

export type RentalType = 'airbnb' | 'residential' | 'commercial' | 'vehicle_rental' | 'office';

export interface RentalAgreement {
  type: RentalType;
  label: string;
  monthlyRent: number;
  startedMonth: number;
  startedYear: number;
}

export interface Building {
  id: string;
  type: string;
  name: string;
  icon: string;
  cost: number;
  monthlyIncome: number;
  builtMonth: number;
  builtYear: number;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  monthlyIncome: number;
  purchasePrice: number;
  icon: string;
  description: string;
  incomeFrequency?: IncomeFrequency;
  lastCollectedMonth?: number;
  lastCollectedYear?: number;
  rental?: RentalAgreement | null;
  buildings?: Building[];
  canRental?: boolean;
  canBuild?: boolean;
  liquidationValue?: number;
}

export interface IncomeSource {
  id: string;
  name: string;
  icon: string;
  monthlyAmount: number;
  category: ActionCategory;
  acquiredMonth: number;
  acquiredYear: number;
}

export type LoanType = 'personal' | 'auto' | 'mortgage' | 'business' | 'investment';

export interface LoanProduct {
  type: LoanType;
  name: string;
  icon: string;
  description: string;
  interestRate: number;
  termMonths: number;
  minAmount: number;
  maxAmount: number;
  requiresLevel: number;
  earlyPayoffFeePct: number;
  color: string;
}

export interface Bank {
  id: string;
  name: string;
  icon: string;
  color: string;
  requiresLevel: number;
  description: string;
  loanProducts: LoanProduct[];
}

export const BANKS: Bank[] = [
  {
    id: 'freedom',
    name: 'Freedom Bank',
    icon: '🏦',
    color: 'cyan',
    requiresLevel: 1,
    description: 'Trusted local bank. Solid rates for everyday needs. No level requirement.',
    loanProducts: [
      {
        type: 'personal',
        name: 'Personal Loan',
        icon: '💳',
        description: 'Unsecured loan for any purpose. Quick approval, flexible use.',
        interestRate: 0.10,
        termMonths: 24,
        minAmount: 1000,
        maxAmount: 25000,
        requiresLevel: 1,
        earlyPayoffFeePct: 0.02,
        color: 'cyan',
      },
      {
        type: 'auto',
        name: 'Auto Loan',
        icon: '🚗',
        description: 'Finance a vehicle. Secured by the car for lower rates.',
        interestRate: 0.07,
        termMonths: 36,
        minAmount: 5000,
        maxAmount: 40000,
        requiresLevel: 1,
        earlyPayoffFeePct: 0.02,
        color: 'blue',
      },
      {
        type: 'business',
        name: 'Small Business Loan',
        icon: '🏪',
        description: 'Start or grow a small business. Requires some experience.',
        interestRate: 0.09,
        termMonths: 24,
        minAmount: 10000,
        maxAmount: 50000,
        requiresLevel: 2,
        earlyPayoffFeePct: 0.03,
        color: 'amber',
      },
    ],
  },
  {
    id: 'summit',
    name: 'Summit Credit Union',
    icon: '🏔️',
    color: 'emerald',
    requiresLevel: 3,
    description: 'Member-focused credit union with competitive rates. Requires Level 3.',
    loanProducts: [
      {
        type: 'personal',
        name: 'Personal Loan',
        icon: '💳',
        description: 'Unsecured loan with member rates. No collateral needed.',
        interestRate: 0.08,
        termMonths: 36,
        minAmount: 2000,
        maxAmount: 50000,
        requiresLevel: 3,
        earlyPayoffFeePct: 0.02,
        color: 'cyan',
      },
      {
        type: 'auto',
        name: 'Auto Loan',
        icon: '🚗',
        description: 'Great auto rates for members. Finance new or used vehicles.',
        interestRate: 0.05,
        termMonths: 48,
        minAmount: 5000,
        maxAmount: 60000,
        requiresLevel: 3,
        earlyPayoffFeePct: 0.02,
        color: 'blue',
      },
      {
        type: 'mortgage',
        name: 'Home Mortgage',
        icon: '🏠',
        description: 'Buy property with a long-term mortgage. Lower monthly payments.',
        interestRate: 0.06,
        termMonths: 60,
        minAmount: 50000,
        maxAmount: 300000,
        requiresLevel: 3,
        earlyPayoffFeePct: 0.03,
        color: 'emerald',
      },
      {
        type: 'business',
        name: 'Business Expansion Loan',
        icon: '🏪',
        description: 'Grow your business with expansion capital.',
        interestRate: 0.07,
        termMonths: 36,
        minAmount: 20000,
        maxAmount: 100000,
        requiresLevel: 4,
        earlyPayoffFeePct: 0.03,
        color: 'amber',
      },
    ],
  },
  {
    id: 'apex',
    name: 'Apex Capital',
    icon: '⭐',
    color: 'amber',
    requiresLevel: 5,
    description: 'Premium lending for serious investors. Requires Level 5.',
    loanProducts: [
      {
        type: 'personal',
        name: 'Premier Personal Loan',
        icon: '💳',
        description: 'High-limit unsecured loan for premium clients.',
        interestRate: 0.07,
        termMonths: 36,
        minAmount: 5000,
        maxAmount: 100000,
        requiresLevel: 5,
        earlyPayoffFeePct: 0.03,
        color: 'cyan',
      },
      {
        type: 'auto',
        name: 'Luxury Auto Loan',
        icon: '🚗',
        description: 'Finance luxury and exotic vehicles at premium rates.',
        interestRate: 0.04,
        termMonths: 60,
        minAmount: 20000,
        maxAmount: 150000,
        requiresLevel: 5,
        earlyPayoffFeePct: 0.03,
        color: 'blue',
      },
      {
        type: 'mortgage',
        name: 'Premium Mortgage',
        icon: '🏠',
        description: 'Large-scale property financing with flexible terms.',
        interestRate: 0.05,
        termMonths: 72,
        minAmount: 100000,
        maxAmount: 500000,
        requiresLevel: 5,
        earlyPayoffFeePct: 0.04,
        color: 'emerald',
      },
      {
        type: 'business',
        name: 'Commercial Business Loan',
        icon: '🏪',
        description: 'Major business funding for established entrepreneurs.',
        interestRate: 0.06,
        termMonths: 48,
        minAmount: 50000,
        maxAmount: 250000,
        requiresLevel: 6,
        earlyPayoffFeePct: 0.04,
        color: 'amber',
      },
      {
        type: 'investment',
        name: 'Investment Line of Credit',
        icon: '📈',
        description: 'Borrow to invest. Amplify your returns with leverage.',
        interestRate: 0.05,
        termMonths: 48,
        minAmount: 25000,
        maxAmount: 200000,
        requiresLevel: 6,
        earlyPayoffFeePct: 0.04,
        color: 'violet',
      },
    ],
  },
  {
    id: 'titan',
    name: 'Titan Global Finance',
    icon: '🏛️',
    color: 'violet',
    requiresLevel: 8,
    description: 'Elite global financing institution. Best rates available. Requires Level 8.',
    loanProducts: [
      {
        type: 'personal',
        name: 'Titan Personal Line',
        icon: '💳',
        description: 'Exclusive high-limit personal credit for elite clients.',
        interestRate: 0.06,
        termMonths: 48,
        minAmount: 10000,
        maxAmount: 250000,
        requiresLevel: 8,
        earlyPayoffFeePct: 0.04,
        color: 'cyan',
      },
      {
        type: 'auto',
        name: 'Elite Auto Finance',
        icon: '🚗',
        description: 'Bespoke auto financing for luxury and supercar purchases.',
        interestRate: 0.03,
        termMonths: 72,
        minAmount: 30000,
        maxAmount: 300000,
        requiresLevel: 8,
        earlyPayoffFeePct: 0.04,
        color: 'blue',
      },
      {
        type: 'mortgage',
        name: 'Estate Mortgage',
        icon: '🏠',
        description: 'Finance premium estates and commercial real estate.',
        interestRate: 0.04,
        termMonths: 84,
        minAmount: 200000,
        maxAmount: 1000000,
        requiresLevel: 8,
        earlyPayoffFeePct: 0.05,
        color: 'emerald',
      },
      {
        type: 'business',
        name: 'Enterprise Loan',
        icon: '🏪',
        description: 'Large-scale commercial lending for major operations.',
        interestRate: 0.05,
        termMonths: 60,
        minAmount: 100000,
        maxAmount: 500000,
        requiresLevel: 9,
        earlyPayoffFeePct: 0.05,
        color: 'amber',
      },
      {
        type: 'investment',
        name: 'Titan Leverage Facility',
        icon: '📈',
        description: 'Maximum leverage for sophisticated investors. Highest limits.',
        interestRate: 0.04,
        termMonths: 60,
        minAmount: 50000,
        maxAmount: 500000,
        requiresLevel: 9,
        earlyPayoffFeePct: 0.05,
        color: 'violet',
      },
    ],
  },
];

export interface Loan {
  id: string;
  principal: number;
  remaining: number;
  monthlyPayment: number;
  interestRate: number;
  monthsRemaining: number;
  purpose: string;
  startMonth: number;
  startYear: number;
  nextPaymentMonth: number;
  nextPaymentYear: number;
  missedPayments: number;
  paymentsMade: number;
  totalToRepay: number;
  bankId: string;
  bankName: string;
  earlyPayoffFeePct: number;
  loanType: LoanType;
  loanTypeName: string;
}

export interface GameAction {
  id: string;
  name: string;
  icon: string;
  category: ActionCategory;
  cost: number;
  description: string;
  effects: Partial<Stats>;
  requiresLevel?: number;
  monthlyIncome?: number;
  createsAsset?: Omit<Asset, 'id'>;
}

export interface Stats {
  cash: number;
  energy: number;
  happiness: number;
  knowledge: number;
  connections: number;
  monthlyIncome: number;
  level: number;
  xp: number;
}

export interface LogEntry {
  month: number;
  year: number;
  message: string;
  type: 'action' | 'milestone' | 'income' | 'loan' | 'system';
}

export interface GameState {
  phase: 'intro' | 'playing' | 'milestone' | 'gameover';
  playerName: string;
  archetype: Archetype;
  age: number;
  month: number;
  year: number;
  actionsPerMonth: number;
  actionsUsedThisMonth: number;
  turnsPlayed: number;
  cash: number;
  bankBalance: number;
  energy: number;
  happiness: number;
  knowledge: number;
  connections: number;
  monthlyIncome: number;
  level: number;
  xp: number;
  xpToNext: number;
  assets: Asset[];
  loans: Loan[];
  incomeSources: IncomeSource[];
  log: LogEntry[];
  lastCashChange?: number;
  lastIncomeCollected?: number;
  unlockedActions: string[];
  customBuildings?: PlacedBuilding[];
}

export interface PlacedBuilding {
  id: string;
  type: string;
  name: string;
  icon: string;
  position: [number, number, number];
  color: string;
  roofColor: string;
  size: [number, number, number];
  builtMonth: number;
}

export const ARCHETYPES: Record<Archetype, { name: string; icon: string; desc: string; bonus: Partial<Stats>; img: string }> = {
  hustler: {
    name: 'The Hustler',
    icon: '🔥',
    desc: 'Starts with extra cash and connections. Great at building businesses.',
    bonus: { cash: 2000, connections: 5 },
    img: 'https://images.pexels.com/photos/3807571/pexels-photo-3807571.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  creative: {
    name: 'The Creative',
    icon: '🎨',
    desc: 'Higher happiness and knowledge. Excels at content and design.',
    bonus: { happiness: 20, knowledge: 10 },
    img: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  investor: {
    name: 'The Investor',
    icon: '📈',
    desc: 'Starts with market knowledge and extra income potential.',
    bonus: { knowledge: 15, monthlyIncome: 100 },
    img: 'https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  scholar: {
    name: 'The Scholar',
    icon: '📚',
    desc: 'Begins with high knowledge. Learns faster, earns more from education.',
    bonus: { knowledge: 25, energy: 10 },
    img: 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
};

export interface BuildingType {
  id: string;
  name: string;
  icon: string;
  cost: number;
  monthlyIncome: number;
  description: string;
}

export type LifeEventCategory = 'relationship' | 'temptation' | 'risk';

export interface LifeEventImpact {
  cash?: number;
  happiness?: number;
  energy?: number;
  monthlyExpense?: number;
  passiveIncome?: number;
}

export interface LifeEventOutcome {
  message: string;
  impact: LifeEventImpact;
  isPositive?: boolean;
}

export interface LifeEventChoice {
  label: string;
  icon: string;
  description: string;
  previewImpact: LifeEventImpact;
  randomOutcomes?: LifeEventOutcome[];
  deterministicOutcome?: LifeEventOutcome;
}

export interface LifeEvent {
  id: string;
  title: string;
  description: string;
  category: LifeEventCategory;
  icon: string;
  image: string;
  choices: LifeEventChoice[];
}

export const BUILDING_TYPES: BuildingType[] = [
  { id: 'house', name: 'House', icon: '🏠', cost: 50000, monthlyIncome: 1500, description: 'A family home. Can rent as residential or Airbnb.' },
  { id: 'apartment', name: 'Apartment Complex', icon: '🏢', cost: 120000, monthlyIncome: 4000, description: 'Multi-unit apartment building. High rental yield.' },
  { id: 'store', name: 'Retail Store', icon: '🏪', cost: 40000, monthlyIncome: 1200, description: 'A storefront for retail business.' },
  { id: 'office', name: 'Office Space', icon: '🏬', cost: 80000, monthlyIncome: 2500, description: 'Commercial office space for rent to businesses.' },
  { id: 'warehouse', name: 'Warehouse', icon: '🏭', cost: 60000, monthlyIncome: 1800, description: 'Storage and logistics facility.' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️', cost: 70000, monthlyIncome: 2200, description: 'A dining establishment with steady income.' },
  { id: 'gas_station', name: 'Gas Station', icon: '⛽', cost: 90000, monthlyIncome: 3000, description: 'Fuel station with convenience store.' },
  { id: 'solar_farm', name: 'Solar Farm', icon: '☀️', cost: 150000, monthlyIncome: 5000, description: 'Renewable energy installation. High upfront, long-term yield.' },
];
