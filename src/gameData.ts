import type { GameAction, GameEvent, Milestone, GameState, ActionOutcome } from './types';

export const MILESTONES: Milestone[] = [
  {
    level: 1,
    title: 'Side Hustler',
    subtitle: 'First steps to freedom',
    requiredPassiveIncome: 500,
    color: 'from-blue-500 to-cyan-500',
    reward: 'Unlock 2 new actions',
    description: 'You\'re making your first dollars outside a 9-5. This is where most people stop — you\'re just getting started.',
  },
  {
    level: 2,
    title: 'Emerging Entrepreneur',
    subtitle: 'The momentum builds',
    requiredPassiveIncome: 1500,
    color: 'from-emerald-500 to-teal-500',
    reward: 'Expenses efficiency bonus — $200 saved monthly',
    description: 'Multiple income streams are flowing. You\'re proving to yourself this works.',
  },
  {
    level: 3,
    title: 'Full-Time Free',
    subtitle: 'Goodbye 9-5 forever',
    requiredPassiveIncome: 3500,
    color: 'from-amber-500 to-orange-500',
    reward: 'Unlock premium investment actions',
    description: 'Your income now covers your expenses. You can choose how to spend every hour of every day.',
  },
  {
    level: 4,
    title: 'Wealth Builder',
    subtitle: 'Money working for you',
    requiredPassiveIncome: 6500,
    color: 'from-rose-500 to-pink-500',
    reward: 'All actions unlocked + action per turn bonus',
    description: 'You\'re not just surviving — you\'re thriving. Your assets generate real wealth.',
  },
  {
    level: 5,
    title: 'Financially Free',
    subtitle: 'You\'ve mastered the game of life',
    requiredPassiveIncome: 10000,
    color: 'from-yellow-400 to-amber-500',
    reward: 'VICTORY!',
    description: 'Complete financial freedom. You\'ve built a life most people only dream about.',
  },
];

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const has = (state: GameState, skillId: string) => state.skills.some(s => s.id === skillId);

export const ALL_ACTIONS: GameAction[] = [
  // ─── LEARN ──────────────────────────────────────────────
  {
    id: 'learn_marketing',
    name: 'Study Digital Marketing',
    description: 'Learn SEO, social media, and online ads',
    flavorText: 'Every business needs marketing. This skill multiplies everything.',
    cost: 200,
    category: 'learn',
    icon: '📚',
    color: 'blue',
    resolve: (state) => {
      const existing = state.skills.find(s => s.id === 'marketing');
      return {
        message: existing ? 'Marketing skills improved to level 2!' : 'You learned Digital Marketing! New hustle options unlocked.',
        cashChange: -200,
        skillGained: { id: 'marketing', name: 'Digital Marketing', level: existing ? 2 : 1 },
        happinessChange: rand(2, 5),
        freedomChange: 1,
        unlocks: ['freelance_marketing', 'grow_content'],
      };
    },
  },
  {
    id: 'learn_coding',
    name: 'Learn Web Development',
    description: 'Build websites and apps for clients',
    flavorText: 'The highest-paid freelance skill. Takes time, but pays for life.',
    cost: 300,
    category: 'learn',
    icon: '💻',
    color: 'blue',
    resolve: (state) => {
      const existing = state.skills.find(s => s.id === 'coding');
      return {
        message: existing ? 'Coding skills leveled up! Premium clients now available.' : 'You learned Web Development! Start taking client projects.',
        cashChange: -300,
        skillGained: { id: 'coding', name: 'Web Dev', level: existing ? 2 : 1 },
        happinessChange: rand(3, 6),
        freedomChange: 2,
        unlocks: ['freelance_dev', 'build_app'],
      };
    },
  },
  {
    id: 'learn_copywriting',
    name: 'Master Copywriting',
    description: 'Write words that sell products and services',
    flavorText: '"Copywriting is salesmanship in print." — One of the most portable skills.',
    cost: 150,
    category: 'learn',
    icon: '✍️',
    color: 'blue',
    resolve: (state) => {
      const existing = state.skills.find(s => s.id === 'copywriting');
      return {
        message: existing ? 'Copywriting mastery reached! You can charge premium rates now.' : 'Copywriting learned! Clients are already searching for you.',
        cashChange: -150,
        skillGained: { id: 'copywriting', name: 'Copywriting', level: existing ? 2 : 1 },
        happinessChange: rand(2, 4),
        freedomChange: 1,
        unlocks: ['freelance_writing'],
      };
    },
  },
  {
    id: 'learn_investing',
    name: 'Study Investing',
    description: 'Read books and courses on wealth building',
    flavorText: 'The wealthy make money while they sleep. Learn how.',
    cost: 100,
    category: 'learn',
    icon: '📈',
    color: 'blue',
    resolve: (state) => {
      const existing = state.skills.find(s => s.id === 'investing');
      return {
        message: existing ? 'Advanced investing unlocked! Your returns will compound faster.' : 'Investing knowledge gained! Your money is smarter now.',
        cashChange: -100,
        skillGained: { id: 'investing', name: 'Investing', level: existing ? 2 : 1 },
        happinessChange: rand(1, 3),
        freedomChange: 1,
        unlocks: ['invest_index', 'invest_reit'],
      };
    },
  },
  // ─── HUSTLE ─────────────────────────────────────────────
  {
    id: 'tutor_online',
    name: 'Tutor Students Online',
    description: 'Teach what you know on tutoring platforms',
    flavorText: 'You already know enough to teach someone. Start today.',
    cost: 0,
    category: 'hustle',
    icon: '🎓',
    color: 'amber',
    resolve: (state) => {
      const income = rand(200, 600);
      return {
        message: `You picked up ${rand(2, 5)} tutoring students this month, earning $${income}!`,
        cashChange: income,
        incomeStreamId: 'tutoring',
        incomeChange: rand(80, 180),
        happinessChange: rand(3, 8),
        freedomChange: 1,
      };
    },
  },
  {
    id: 'sell_items',
    name: 'Sell Items Online',
    description: 'Flip items on eBay, Facebook Marketplace, or Craigslist',
    flavorText: 'Turn clutter into cash. Your first income stream is already at home.',
    cost: 50,
    category: 'hustle',
    icon: '📦',
    color: 'amber',
    resolve: () => {
      const income = rand(150, 700);
      return {
        message: `You sold ${rand(3, 12)} items online for a total of $${income}!`,
        cashChange: income - 50,
        incomeStreamId: 'selling',
        incomeChange: rand(50, 150),
        happinessChange: rand(2, 6),
        freedomChange: 1,
      };
    },
  },
  {
    id: 'pet_sitting',
    name: 'Pet Sitting & Dog Walking',
    description: 'Earn $20-50/hour caring for pets in your neighborhood',
    flavorText: 'Zero cost to start. High demand. Paid to walk and play with dogs.',
    cost: 0,
    category: 'hustle',
    icon: '🐶',
    color: 'amber',
    resolve: () => {
      const income = rand(250, 800);
      return {
        message: `You walked ${rand(5, 15)} dogs and earned $${income} this month!`,
        cashChange: income,
        incomeStreamId: 'services',
        incomeChange: rand(100, 250),
        happinessChange: rand(5, 12),
        freedomChange: 1,
      };
    },
  },
  {
    id: 'freelance_writing',
    name: 'Freelance Writing',
    description: 'Write articles, blogs, and web copy for businesses',
    flavorText: 'Businesses need content. You need freedom. Perfect match.',
    cost: 0,
    category: 'hustle',
    icon: '📝',
    color: 'amber',
    requiredSkills: ['copywriting'],
    resolve: (state) => {
      const skill = state.skills.find(s => s.id === 'copywriting');
      const multiplier = skill ? skill.level : 1;
      const income = rand(400, 900) * multiplier;
      return {
        message: `Your copywriting skills landed you $${income} in writing projects!`,
        cashChange: income,
        incomeStreamId: 'freelancing',
        incomeChange: rand(150, 350),
        happinessChange: rand(3, 7),
        freedomChange: 2,
      };
    },
  },
  {
    id: 'freelance_dev',
    name: 'Freelance Web Development',
    description: 'Build websites and apps for paying clients',
    flavorText: 'One good client can pay your rent. Two can pay your freedom.',
    cost: 0,
    category: 'hustle',
    icon: '🖥️',
    color: 'amber',
    requiredSkills: ['coding'],
    resolve: (state) => {
      const skill = state.skills.find(s => s.id === 'coding');
      const multiplier = skill ? skill.level : 1;
      const income = rand(600, 1800) * multiplier;
      return {
        message: `You completed a web development project and earned $${income}!`,
        cashChange: income,
        incomeStreamId: 'freelancing',
        incomeChange: rand(200, 500),
        happinessChange: rand(4, 9),
        freedomChange: 2,
      };
    },
  },
  {
    id: 'freelance_marketing',
    name: 'Marketing Consulting',
    description: 'Help businesses grow their online presence',
    flavorText: 'Small businesses pay well for people who understand digital growth.',
    cost: 0,
    category: 'hustle',
    icon: '📣',
    color: 'amber',
    requiredSkills: ['marketing'],
    resolve: (state) => {
      const skill = state.skills.find(s => s.id === 'marketing');
      const multiplier = skill ? skill.level : 1;
      const income = rand(500, 1200) * multiplier;
      return {
        message: `A business paid you $${income} for your marketing expertise!`,
        cashChange: income,
        incomeStreamId: 'freelancing',
        incomeChange: rand(180, 400),
        happinessChange: rand(3, 8),
        freedomChange: 2,
      };
    },
  },
  {
    id: 'dropshipping',
    name: 'Start Dropshipping Store',
    description: 'Sell products online without holding inventory',
    flavorText: 'You handle the sales, suppliers handle the rest.',
    cost: 500,
    category: 'hustle',
    icon: '🛍️',
    color: 'amber',
    requiredMinCash: 500,
    resolve: () => {
      const success = Math.random() > 0.35;
      if (success) {
        const income = rand(300, 1200);
        return {
          message: `Your store launched and made $${income} in first sales!`,
          cashChange: income - 500,
          incomeStreamId: 'ecommerce',
          incomeChange: rand(200, 600),
          happinessChange: rand(5, 10),
          freedomChange: 2,
        };
      }
      return {
        message: 'Store launched but struggled to get traffic. Keep at it — refine your product.',
        cashChange: -500,
        incomeStreamId: 'ecommerce',
        incomeChange: rand(50, 150),
        happinessChange: -rand(2, 5),
        freedomChange: 1,
      };
    },
  },
  {
    id: 'etsy_shop',
    name: 'Open Etsy / Creative Shop',
    description: 'Sell handmade, digital, or vintage products',
    flavorText: 'Turn a passion into a revenue stream. Digital products sell while you sleep.',
    cost: 100,
    category: 'hustle',
    icon: '🎨',
    color: 'amber',
    resolve: () => {
      const income = rand(200, 900);
      return {
        message: `Your shop attracted buyers and earned $${income} this month!`,
        cashChange: income - 100,
        incomeStreamId: 'ecommerce',
        incomeChange: rand(100, 300),
        happinessChange: rand(5, 12),
        freedomChange: 2,
      };
    },
  },
  // ─── INVEST ─────────────────────────────────────────────
  {
    id: 'invest_emergency',
    name: 'Build Emergency Fund',
    description: 'Save 3 months of expenses as a safety net',
    flavorText: 'Freedom requires security. Your safety net lets you take bigger risks.',
    cost: 1000,
    category: 'invest',
    icon: '🛡️',
    color: 'emerald',
    requiredMinCash: 1000,
    resolve: () => ({
      message: 'Emergency fund built! You\'re protected from unexpected shocks.',
      cashChange: -1000,
      assetAdded: { id: 'emergency', name: 'Emergency Fund', value: 1000, monthlyReturn: 0, type: 'investment' },
      happinessChange: rand(5, 10),
      freedomChange: 3,
    }),
  },
  {
    id: 'invest_index',
    name: 'Invest in Index Funds',
    description: 'Put money in low-cost index funds for steady growth',
    flavorText: 'Warren Buffett\'s advice for 90% of people. Boring. Brilliant. It works.',
    cost: 500,
    category: 'invest',
    icon: '📊',
    color: 'emerald',
    requiredMinCash: 500,
    resolve: () => {
      const returnPct = rand(3, 14);
      const returnAmt = Math.round(500 * returnPct / 100);
      return {
        message: `Index funds up ${returnPct}% this period — earning you $${returnAmt} in returns!`,
        cashChange: -500,
        assetAdded: { id: `index_${Date.now()}`, name: 'Index Fund Portfolio', value: 500 + returnAmt, monthlyReturn: rand(10, 30), type: 'investment' },
        incomeStreamId: 'investments',
        incomeChange: rand(15, 40),
        happinessChange: rand(2, 6),
        freedomChange: 2,
      };
    },
  },
  {
    id: 'invest_reit',
    name: 'Buy REITs',
    description: 'Real estate investment trusts for rental income without ownership headaches',
    flavorText: 'Get the benefits of real estate with just a few hundred dollars.',
    cost: 800,
    category: 'invest',
    icon: '🏢',
    color: 'emerald',
    requiredMinCash: 800,
    resolve: () => {
      const monthly = rand(30, 80);
      return {
        message: `Your REIT investment is generating $${monthly}/month in passive income!`,
        cashChange: -800,
        assetAdded: { id: `reit_${Date.now()}`, name: 'REIT Portfolio', value: 800, monthlyReturn: monthly, type: 'investment' },
        incomeStreamId: 'investments',
        incomeChange: monthly,
        happinessChange: rand(3, 7),
        freedomChange: 2,
      };
    },
  },
  {
    id: 'invest_crypto',
    name: 'Invest in Crypto',
    description: 'High risk, high reward — diversify only what you can afford to lose',
    flavorText: 'Volatile, exciting, and sometimes life-changing. Tread carefully.',
    cost: 300,
    category: 'invest',
    icon: '₿',
    color: 'emerald',
    requiredMinCash: 300,
    resolve: () => {
      const roll = Math.random();
      if (roll > 0.65) {
        const gain = rand(150, 900);
        return { message: `Crypto mooned! Your $300 became $${300 + gain}. 🚀`, cashChange: gain, incomeStreamId: 'investments', incomeChange: rand(20, 60), happinessChange: rand(8, 15), freedomChange: 2 };
      } else if (roll > 0.3) {
        return { message: 'Crypto moved sideways. Your investment holds its value — for now.', cashChange: -300, assetAdded: { id: `crypto_${Date.now()}`, name: 'Crypto Portfolio', value: 300, monthlyReturn: rand(5, 25), type: 'investment' }, happinessChange: rand(-2, 2), freedomChange: 1 };
      }
      return { message: 'Market dropped hard. Your crypto lost 60% of value. Lesson: never invest more than you can lose.', cashChange: -180, happinessChange: -rand(5, 12), freedomChange: 0 };
    },
  },
  {
    id: 'invest_property',
    name: 'Buy Rental Property',
    description: 'Purchase a small property and rent it for monthly income',
    flavorText: 'Real estate is how most millionaires built their wealth.',
    cost: 5000,
    category: 'invest',
    icon: '🏠',
    color: 'emerald',
    requiredMinCash: 5000,
    resolve: () => {
      const rent = rand(400, 900);
      return {
        message: `You secured a rental property generating $${rent}/month in passive income!`,
        cashChange: -5000,
        assetAdded: { id: `property_${Date.now()}`, name: 'Rental Property', value: 5000, monthlyReturn: rent, type: 'property' },
        incomeStreamId: 'real_estate',
        incomeChange: rent,
        happinessChange: rand(8, 15),
        freedomChange: 5,
      };
    },
  },
  // ─── BUILD ──────────────────────────────────────────────
  {
    id: 'build_youtube',
    name: 'Start YouTube Channel',
    description: 'Create videos on a passion topic and grow an audience',
    flavorText: 'Small channels earn nothing. Big channels earn fortunes. The gap is just consistency.',
    cost: 200,
    category: 'build',
    icon: '🎬',
    color: 'rose',
    resolve: (state) => {
      const hasMarketing = has(state, 'marketing');
      const growth = hasMarketing ? rand(100, 500) : rand(50, 200);
      const income = rand(50, 300);
      return {
        message: `Channel launched! Gained ${growth} subscribers and earned $${income} from early monetization.`,
        cashChange: income - 200,
        incomeStreamId: 'content',
        incomeChange: rand(40, 120),
        happinessChange: rand(5, 12),
        freedomChange: 2,
        unlocks: ['grow_content'],
      };
    },
  },
  {
    id: 'build_blog',
    name: 'Start a Niche Blog',
    description: 'Build a content site that earns from ads and affiliates',
    flavorText: 'SEO traffic is free forever. A blog is a compounding asset.',
    cost: 100,
    category: 'build',
    icon: '✏️',
    color: 'rose',
    resolve: (state) => {
      const hasMarketing = has(state, 'marketing');
      const bonus = hasMarketing ? rand(50, 200) : 0;
      return {
        message: `Blog launched! First articles indexed. Early affiliate income coming in${hasMarketing ? ' — marketing skills boosting your reach' : ''}.`,
        cashChange: -100 + bonus,
        incomeStreamId: 'content',
        incomeChange: rand(30, 90),
        happinessChange: rand(4, 9),
        freedomChange: 2,
        unlocks: ['grow_content'],
      };
    },
  },
  {
    id: 'build_course',
    name: 'Create Online Course',
    description: 'Package your knowledge into a sellable course',
    flavorText: 'Create once. Sell forever. The ultimate "money while you sleep" asset.',
    cost: 300,
    category: 'build',
    icon: '🎯',
    color: 'rose',
    resolve: (state) => {
      const hasSkill = state.skills.length > 0;
      const income = hasSkill ? rand(400, 1500) : rand(100, 500);
      return {
        message: `Course launched${hasSkill ? ' with your expertise' : ''}! Made $${income} in first sales.`,
        cashChange: income - 300,
        incomeStreamId: 'content',
        incomeChange: rand(100, 350),
        happinessChange: rand(6, 14),
        freedomChange: 3,
      };
    },
  },
  {
    id: 'build_app',
    name: 'Build & Launch an App',
    description: 'Create a micro-SaaS or tool people pay for monthly',
    flavorText: 'One good app can earn passive income for years with minimal work.',
    cost: 400,
    category: 'build',
    icon: '📱',
    color: 'rose',
    requiredSkills: ['coding'],
    resolve: (state) => {
      const skill = state.skills.find(s => s.id === 'coding');
      const multiplier = skill ? skill.level : 1;
      const mrr = rand(100, 500) * multiplier;
      return {
        message: `Your app launched and already has paying users! MRR: $${mrr}/month.`,
        cashChange: -400 + mrr,
        incomeStreamId: 'saas',
        incomeChange: mrr,
        happinessChange: rand(8, 16),
        freedomChange: 4,
      };
    },
  },
  {
    id: 'build_podcast',
    name: 'Launch a Podcast',
    description: 'Interview experts or share ideas — build an audience',
    flavorText: 'Audio is intimate. Sponsors pay big for loyal podcast audiences.',
    cost: 150,
    category: 'build',
    icon: '🎙️',
    color: 'rose',
    resolve: () => ({
      message: 'Podcast live! First 10 episodes published. Audience and sponsors incoming.',
      cashChange: -150,
      incomeStreamId: 'content',
      incomeChange: rand(30, 100),
      happinessChange: rand(5, 10),
      freedomChange: 2,
    }),
  },
  // ─── GROW ───────────────────────────────────────────────
  {
    id: 'grow_content',
    name: 'Scale Your Content',
    description: 'Invest in equipment, editing, and promotion to grow faster',
    flavorText: 'Compound your audience. Every subscriber is a tiny passive income machine.',
    cost: 300,
    category: 'grow',
    icon: '🚀',
    color: 'violet',
    requiredStreamId: 'content',
    resolve: (state) => {
      const contentStream = state.incomeStreams.find(s => s.id === 'content');
      const boost = contentStream ? Math.round(contentStream.monthlyIncome * rand(30, 80) / 100) : rand(100, 300);
      return {
        message: `Content scaled! Monthly content income boosted by $${boost}.`,
        cashChange: -300,
        incomeStreamId: 'content',
        incomeChange: boost,
        happinessChange: rand(4, 9),
        freedomChange: 3,
      };
    },
  },
  {
    id: 'grow_freelance',
    name: 'Raise Your Rates',
    description: 'Charge what you\'re worth — reposition as a premium provider',
    flavorText: 'The fastest way to double income: double your rates. Fewer clients, more money.',
    cost: 0,
    category: 'grow',
    icon: '💰',
    color: 'violet',
    requiredStreamId: 'freelancing',
    resolve: (state) => {
      const stream = state.incomeStreams.find(s => s.id === 'freelancing');
      const boost = stream ? Math.round(stream.monthlyIncome * rand(25, 60) / 100) : rand(200, 500);
      return {
        message: `Rate increase worked! Lost 1 cheap client, gained 1 premium one. Net gain: +$${boost}/month.`,
        cashChange: 0,
        incomeStreamId: 'freelancing',
        incomeChange: boost,
        happinessChange: rand(5, 10),
        freedomChange: 3,
      };
    },
  },
  {
    id: 'grow_automate',
    name: 'Automate Your Business',
    description: 'Use tools and systems to reduce time spent working',
    flavorText: 'Replace yourself with systems. That\'s how you become truly free.',
    cost: 500,
    category: 'grow',
    icon: '⚙️',
    color: 'violet',
    requiredMinCash: 500,
    resolve: (state) => {
      const totalIncome = state.incomeStreams.reduce((sum, s) => sum + s.monthlyIncome, 0);
      const reduction = rand(100, 300);
      return {
        message: `Systems set up! Monthly expenses reduced by $${reduction} and you reclaimed 10 hours/week.`,
        cashChange: -500,
        happinessChange: rand(8, 15),
        freedomChange: 4,
      };
    },
  },
  {
    id: 'grow_hire',
    name: 'Hire a Virtual Assistant',
    description: 'Delegate repetitive tasks and reclaim your time',
    flavorText: 'Your time is worth more than $15/hour. Hire someone and focus on high value work.',
    cost: 600,
    category: 'grow',
    icon: '🤝',
    color: 'violet',
    requiredMinCash: 600,
    resolve: (state) => {
      const incomeBoost = rand(300, 800);
      return {
        message: `VA hired! You freed up 20 hours/month, used them to earn an extra $${incomeBoost}.`,
        cashChange: -600 + incomeBoost,
        incomeStreamId: 'freelancing',
        incomeChange: rand(150, 400),
        happinessChange: rand(6, 12),
        freedomChange: 4,
      };
    },
  },
  {
    id: 'grow_network',
    name: 'Build Your Network',
    description: 'Attend events, join communities, form partnerships',
    flavorText: '"Your network is your net worth" isn\'t a cliche — it\'s how opportunities find you.',
    cost: 200,
    category: 'grow',
    icon: '🌐',
    color: 'violet',
    resolve: () => {
      const roll = Math.random();
      const cashGain = roll > 0.5 ? rand(200, 800) : 0;
      return {
        message: roll > 0.5
          ? `A connection led to a $${cashGain} collaboration opportunity!`
          : 'Great connections made. Opportunities are seeds — they\'ll bloom soon.',
        cashChange: cashGain - 200,
        happinessChange: rand(4, 10),
        freedomChange: 2,
        unlocks: ['grow_hire', 'grow_automate'],
      };
    },
  },
];

export const ALL_EVENTS: GameEvent[] = [
  {
    id: 'viral_post',
    title: 'You Went Viral!',
    description: 'One of your posts exploded across social media. Thousands of eyes on your brand.',
    type: 'good',
    icon: '🔥',
    autoResolve: (state) => {
      const contentStream = state.incomeStreams.find(s => s.id === 'content');
      const boost = contentStream ? rand(200, 600) : rand(100, 300);
      return { message: `Viral moment! Content income surged +$${boost}/month.`, cashChange: rand(100, 500), incomeStreamId: 'content', incomeChange: boost, happinessChange: rand(10, 20), freedomChange: 2 };
    },
  },
  {
    id: 'big_client',
    title: 'Dream Client Reached Out',
    description: 'A well-known brand found your work and wants to hire you.',
    type: 'good',
    icon: '🌟',
    autoResolve: () => {
      const payment = rand(1500, 4000);
      return { message: `Dream client paid $${payment} upfront! Your reputation just skyrocketed.`, cashChange: payment, incomeStreamId: 'freelancing', incomeChange: rand(200, 500), happinessChange: rand(10, 18), freedomChange: 3 };
    },
  },
  {
    id: 'market_boom',
    title: 'Market Boom!',
    description: 'Your investments surged as markets hit new highs.',
    type: 'good',
    icon: '📈',
    autoResolve: (state) => {
      const gain = Math.round(state.assets.filter(a => a.type === 'investment').reduce((s, a) => s + a.value, 0) * 0.15) || rand(100, 400);
      return { message: `Portfolio up 15%! Gained $${gain} in investment value.`, cashChange: gain, happinessChange: rand(5, 12), freedomChange: 2 };
    },
  },
  {
    id: 'tax_refund',
    title: 'Surprise Tax Refund',
    description: 'The government owes you money from last year\'s returns.',
    type: 'good',
    icon: '💵',
    autoResolve: () => {
      const refund = rand(400, 1200);
      return { message: `Tax refund of $${refund} arrived! Reinvest it wisely.`, cashChange: refund, happinessChange: rand(5, 10), freedomChange: 1 };
    },
  },
  {
    id: 'referral_windfall',
    title: 'Referral Windfall',
    description: 'A client referred three new people to your business.',
    type: 'good',
    icon: '🎉',
    autoResolve: () => {
      const income = rand(600, 1800);
      return { message: `Three referrals converted to paid clients! Earned $${income} extra.`, cashChange: income, incomeStreamId: 'freelancing', incomeChange: rand(100, 300), happinessChange: rand(8, 15), freedomChange: 2 };
    },
  },
  {
    id: 'car_breakdown',
    title: 'Car Broke Down',
    description: 'Your vehicle needs urgent repairs. Life doesn\'t pause for ambition.',
    type: 'bad',
    icon: '🚗',
    autoResolve: () => {
      const cost = rand(400, 1200);
      return { message: `Repair bill: -$${cost}. This is why emergency funds exist.`, cashChange: -cost, happinessChange: -rand(5, 12), freedomChange: -1 };
    },
  },
  {
    id: 'health_expense',
    title: 'Medical Surprise',
    description: 'An unexpected health issue requires attention and money.',
    type: 'bad',
    icon: '🏥',
    autoResolve: () => {
      const cost = rand(300, 900);
      return { message: `Medical expenses cost $${cost}. Your health always comes first.`, cashChange: -cost, happinessChange: -rand(4, 10), freedomChange: -1 };
    },
  },
  {
    id: 'market_crash',
    title: 'Market Correction',
    description: 'Investments dropped sharply. This is part of the journey.',
    type: 'bad',
    icon: '📉',
    autoResolve: (state) => {
      const loss = Math.round(state.assets.filter(a => a.type === 'investment').reduce((s, a) => s + a.value, 0) * 0.12) || rand(50, 200);
      return { message: `Markets down. Paper loss of $${loss}. Stay calm — this always recovers.`, cashChange: -loss, happinessChange: -rand(3, 8), freedomChange: -1 };
    },
  },
  {
    id: 'client_ghosted',
    title: 'Client Disappeared',
    description: 'Your best client suddenly went silent and stopped paying.',
    type: 'bad',
    icon: '👻',
    autoResolve: (state) => {
      const stream = state.incomeStreams.find(s => s.id === 'freelancing');
      const loss = stream ? rand(200, Math.max(300, stream.monthlyIncome / 3)) : rand(200, 400);
      return { message: `Client ghosted. Lost $${loss}/month — but you\'ve survived worse.`, cashChange: 0, incomeStreamId: 'freelancing', incomeChange: -loss, happinessChange: -rand(5, 12), freedomChange: -1 };
    },
  },
  {
    id: 'burnout',
    title: 'Burnout Warning',
    description: 'You\'ve been grinding hard. Your body and mind are sending signals.',
    type: 'bad',
    icon: '😮‍💨',
    choices: [
      {
        label: 'Take a week off (lose $300, gain happiness)',
        resolve: () => ({ message: 'Rest taken. You came back sharper, clearer, and ready to win.', cashChange: -300, happinessChange: rand(15, 25), freedomChange: 2 }),
      },
      {
        label: 'Push through it',
        resolve: () => ({ message: 'You pushed through but paid a price. Focus suffered.', cashChange: 0, happinessChange: -rand(10, 18), freedomChange: -1 }),
      },
    ],
  },
  {
    id: 'algo_change',
    title: 'Platform Algorithm Changed',
    description: 'A social platform overhauled its algorithm. Your reach dropped overnight.',
    type: 'bad',
    icon: '📱',
    autoResolve: (state) => {
      const stream = state.incomeStreams.find(s => s.id === 'content');
      const loss = stream ? rand(100, Math.max(200, stream.monthlyIncome / 4)) : rand(100, 250);
      return { message: `Algorithm hit. Content income dropped $${loss}/month. Diversify your platforms.`, cashChange: 0, incomeStreamId: 'content', incomeChange: -loss, happinessChange: -rand(3, 8), freedomChange: -1 };
    },
  },
  {
    id: 'opportunity_collab',
    title: 'Collaboration Opportunity',
    description: 'A fellow creator wants to build something with you.',
    type: 'opportunity',
    icon: '🤝',
    choices: [
      {
        label: 'Say yes — invest time and $400',
        resolve: () => {
          const result = Math.random() > 0.4;
          return result
            ? { message: 'Collab went brilliantly! Shared audience doubled your reach.', cashChange: rand(500, 1500) - 400, incomeStreamId: 'content', incomeChange: rand(100, 300), happinessChange: rand(8, 15), freedomChange: 3 }
            : { message: 'Collab was slow to take off, but the relationship is valuable.', cashChange: -400, happinessChange: rand(2, 6), freedomChange: 1 };
        },
      },
      {
        label: 'Politely decline — focus on your own work',
        resolve: () => ({ message: 'You stayed focused. Sometimes less is more.', cashChange: 0, happinessChange: rand(1, 4), freedomChange: 0 }),
      },
    ],
  },
  {
    id: 'mentor_offer',
    title: 'Mentor Reached Out',
    description: 'A successful entrepreneur wants to advise you — for a fee.',
    type: 'opportunity',
    icon: '🧙',
    choices: [
      {
        label: 'Invest $500 in mentorship',
        resolve: () => ({ message: 'One mentorship session changed your strategy entirely.', cashChange: -500, incomeStreamId: 'freelancing', incomeChange: rand(200, 600), happinessChange: rand(10, 18), freedomChange: 4, unlocks: ['grow_automate', 'grow_hire'] }),
      },
      {
        label: 'Figure it out yourself',
        resolve: () => ({ message: 'Self-reliance is a strength too. Back to building.', cashChange: 0, happinessChange: rand(2, 5), freedomChange: 1 }),
      },
    ],
  },
  {
    id: 'unexpected_expense',
    title: 'Life Happens',
    description: 'Something broke, something\'s due, something needs your money.',
    type: 'neutral',
    icon: '🔧',
    autoResolve: () => {
      const cost = rand(200, 600);
      return { message: `Unexpected $${cost} expense absorbed. This is why we build buffers.`, cashChange: -cost, happinessChange: -rand(2, 6), freedomChange: 0 };
    },
  },
];

export function getRandomEvent(state: GameState): GameEvent | null {
  if (Math.random() > 0.38) return null;
  const eligible = ALL_EVENTS.filter(e => {
    if (e.id === 'market_boom' || e.id === 'market_crash') {
      return state.assets.some(a => a.type === 'investment');
    }
    if (e.id === 'client_ghosted' || e.id === 'big_client' || e.id === 'grow_freelance') {
      return state.incomeStreams.some(s => s.id === 'freelancing');
    }
    if (e.id === 'viral_post' || e.id === 'algo_change') {
      return state.incomeStreams.some(s => s.id === 'content');
    }
    return true;
  });
  return eligible[Math.floor(Math.random() * eligible.length)] || null;
}

export function getAvailableActions(state: GameState): GameAction[] {
  const allActions = [...ALL_ACTIONS, ...(state.customActions || [])];
  return allActions.filter(action => {
    if (action.requiredMinCash && state.cash < action.requiredMinCash) return false;
    if (action.requiredSkills) {
      const hasAllSkills = action.requiredSkills.every(skillId =>
        state.skills.some(s => s.id === skillId)
      );
      if (!hasAllSkills) return false;
    }
    if (action.requiredStreamId) {
      if (!state.incomeStreams.some(s => s.id === action.requiredStreamId)) return false;
    }
    return true;
  });
}

const OPPORTUNITY_NAMES = [
  'AI Consulting', 'Crypto Staking', 'NFT Marketplace', 'Drone Delivery',
  'VR Workshop', 'Print-on-Demand', 'Affiliate Blog', 'Mobile App',
  'Podcast Network', 'Online Course', 'Stock Photography', 'Lead Gen Service',
  'SaaS Tool', 'Newsletter', 'YouTube Channel', 'Digital Templates',
  'Dropshipping', 'Freelance Agency', 'Online Coaching', 'Tech Blog',
  'Automation Service', 'Data Analytics', 'Cyber Consulting', 'Cloud Setup',
  '3D Printing', 'Solar Installation', 'Electric Charging', 'Smart Home Setup',
];

const newOpportunityIcons = ['🤖', '₿', '🎨', '🚁', '🥽', '🖨️', '📝', '📱', '🎙️', '🎓', '📸', '🔍', '⚙️', '📊', '🔒', '☁️', '🧊', '☀️', '🔌', '🏠'];

const newOpportunityCategories = ['learn', 'hustle', 'invest', 'build', 'grow'] as const;

const newOpportunityFlavors = [
  'The future is now.', 'Bold move.', 'High risk, high reward.', 'Patience pays off.',
  'Strike while the iron is hot.', 'A calculated bet.', 'Innovation awaits.', 'The trend is your friend.',
];

export function generateNewAction(state: GameState): GameAction | null {
  const usedNames = new Set([...ALL_ACTIONS.map(a => a.name), ...state.customActions.map(a => a.name)]);
  const available = OPPORTUNITY_NAMES.filter(n => !usedNames.has(n));
  if (available.length === 0) return null;

  const name = available[Math.floor(Math.random() * available.length)];
  const idx = OPPORTUNITY_NAMES.indexOf(name);
  const category = newOpportunityCategories[idx % newOpportunityCategories.length];
  const icon = newOpportunityIcons[idx % newOpportunityIcons.length];
  const flavorText = newOpportunityFlavors[Math.floor(Math.random() * newOpportunityFlavors.length)];
  const tier = state.difficultyTier || 1;
  const cost = Math.round((200 + Math.random() * 800) * tier);
  const incomeChange = Math.round((50 + Math.random() * 300) * tier);
  const happinessChange = Math.round(Math.random() * 10 - 3);
  const id = `gen_${state.turnsPlayed}_${idx}`;

  const colorMap: Record<string, string> = {
    learn: 'from-blue-500 to-cyan-500',
    hustle: 'from-amber-500 to-orange-500',
    invest: 'from-emerald-500 to-teal-500',
    build: 'from-rose-500 to-pink-500',
    grow: 'from-violet-500 to-purple-500',
  };

  return {
    id,
    name,
    category,
    cost,
    icon,
    color: colorMap[category] || 'from-slate-500 to-slate-600',
    description: `A new opportunity in ${name.toLowerCase()} — potential income of ${incomeChange}/mo. Requires ${cost} to start.`,
    flavorText,
    requiredMinCash: cost,
    resolve: (): ActionOutcome => ({
      message: `Launched ${name}! Income +${incomeChange}/mo${happinessChange ? `, happiness ${happinessChange > 0 ? '+' : ''}${happinessChange}` : ''}.`,
      cashChange: -cost,
      happinessChange: happinessChange,
      incomeStreamId: `gen_stream_${id}`,
      incomeChange,
    }),
  };
}
