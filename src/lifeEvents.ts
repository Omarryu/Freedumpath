import type { LifeEvent } from './types';

export const LIFE_EVENTS: LifeEvent[] = [
  // ─── A. IDLE & RELATIONSHIP EVENTS ─────────────────────
  {
    id: 'birthday_party',
    title: "Friend's Destination Birthday Party",
    description: "Your best friend is celebrating their 30th birthday in Cabo. Everyone's going. The pressure is on.",
    category: 'relationship',
    icon: 'party',
    image: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800',
    choices: [
      {
        label: 'Attend the trip',
        icon: 'plane',
        description: 'Show up for your friend. Make memories. Spend the cash.',
        previewImpact: { cash: -400, happiness: 15 },
        deterministicOutcome: {
          message: "You went to Cabo! Unforgettable memories with your best friends. You feel recharged and connected.",
          impact: { cash: -400, happiness: 15, energy: 10 },
          isPositive: true,
        },
      },
      {
        label: 'Skip and save',
        icon: 'piggy',
        description: 'Stay home, keep the $400, but risk damaging the friendship and feeling isolated.',
        previewImpact: { cash: 0, happiness: -10 },
        deterministicOutcome: {
          message: "You skipped the trip. Your bank account is safe, but FOMO hits hard and your friend is disappointed.",
          impact: { cash: 0, happiness: -10, energy: -5 },
          isPositive: false,
        },
      },
    ],
  },
  {
    id: 'family_trip',
    title: 'Family Weekend Trip',
    description: "Your family is planning a weekend getaway to the lake. It's been months since you all spent quality time together.",
    category: 'relationship',
    icon: 'family',
    image: 'https://images.pexels.com/photos/1058959/pexels-photo-1058959.jpeg?auto=compress&cs=tinysrgb&w=800',
    choices: [
      {
        label: 'Go on the trip',
        icon: 'car',
        description: 'Reconnect with family. The memories are worth more than money.',
        previewImpact: { cash: -250, happiness: 20 },
        deterministicOutcome: {
          message: "Lake weekend with the family! You laughed, relaxed, and remembered why you're working so hard.",
          impact: { cash: -250, happiness: 20, energy: 15 },
          isPositive: true,
        },
      },
      {
        label: 'Stay home and hustle',
        icon: 'laptop',
        description: 'Use the weekend to grind on your side hustle. Family will understand... hopefully.',
        previewImpact: { cash: 0, happiness: -15 },
        deterministicOutcome: {
          message: "You stayed home and hustled. Got some work done, but guilt and loneliness crept in.",
          impact: { cash: 0, happiness: -15, energy: -5 },
          isPositive: false,
        },
      },
    ],
  },
  {
    id: 'friend_drinks',
    title: 'After-Work Drinks Invitation',
    description: "Coworkers are heading out for drinks and networking. Could be fun, could be a money drain.",
    category: 'relationship',
    icon: 'drinks',
    image: 'https://images.pexels.com/photos/325939/pexels-photo-325939.jpeg?auto=compress&cs=tinysrgb&w=800',
    choices: [
      {
        label: 'Go for one round',
        icon: 'beer',
        description: 'Socialize but keep it budget-friendly. One drink, then home.',
        previewImpact: { cash: -60, happiness: 8 },
        deterministicOutcome: {
          message: "A quick round with coworkers. Good laughs, light networking, home by 9pm.",
          impact: { cash: -60, happiness: 8, energy: 5 },
          isPositive: true,
        },
      },
      {
        label: 'Stay home and rest',
        icon: 'bed',
        description: 'Skip the social scene. Save money, recharge your batteries.',
        previewImpact: { cash: 0, happiness: -5 },
        deterministicOutcome: {
          message: "You stayed home and rested. Wallet intact, but feeling a bit disconnected from the team.",
          impact: { cash: 0, happiness: -5, energy: 10 },
          isPositive: false,
        },
      },
    ],
  },
  {
    id: 'partner_date',
    title: 'Date Night Dilemma',
    description: "Your partner wants a special night out. You've been working nonstop and they're feeling neglected.",
    category: 'relationship',
    icon: 'heart',
    image: 'https://images.pexels.com/photos/261327/pexels-photo-261327.jpeg?auto=compress&cs=tinysrgb&w=800',
    choices: [
      {
        label: 'Plan a nice date',
        icon: 'wine',
        description: 'Dinner at a nice restaurant. Show them they matter.',
        previewImpact: { cash: -180, happiness: 18 },
        deterministicOutcome: {
          message: "Beautiful date night. Your partner felt valued and appreciated. Relationship strengthened.",
          impact: { cash: -180, happiness: 18, energy: 8 },
          isPositive: true,
        },
      },
      {
        label: 'Cook at home',
        icon: 'utensils',
        description: 'Budget-friendly homemade dinner. It\'s the thought that counts.',
        previewImpact: { cash: -35, happiness: 10 },
        deterministicOutcome: {
          message: "Home-cooked dinner together. Cozy, affordable, and meaningful.",
          impact: { cash: -35, happiness: 10, energy: 5 },
          isPositive: true,
        },
      },
      {
        label: 'Work through the evening',
        icon: 'laptop',
        description: 'Your hustle can\'t wait. Your partner understands... for now.',
        previewImpact: { cash: 0, happiness: -12 },
        deterministicOutcome: {
          message: "You worked late. Productive, but your partner is losing patience with the grind.",
          impact: { cash: 0, happiness: -12, energy: -5 },
          isPositive: false,
        },
      },
    ],
  },

  // ─── B. LIFESTYLE CREEP / TEMPTATION CHOICES ───────────
  {
    id: 'luxury_car',
    title: 'Flashy Luxury Car Upgrade',
    description: "Your coworker just pulled up in a brand new BMW. The dealership is running a 'great deal'. Your reliable Honda is looking... boring.",
    category: 'temptation',
    icon: 'car-luxury',
    image: 'https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg?auto=compress&cs=tinysrgb&w=800',
    choices: [
      {
        label: 'Buy outright',
        icon: 'car',
        description: 'Drop $15,000 cash on a used luxury car. No monthly payments.',
        previewImpact: { cash: -15000, happiness: 12 },
        deterministicOutcome: {
          message: "You bought the luxury car outright! It feels amazing to drive, but your bank account took a hit.",
          impact: { cash: -15000, happiness: 12, energy: 5 },
          isPositive: true,
        },
      },
      {
        label: 'Lease / Finance it',
        icon: 'contract',
        description: 'No money down, but adds $350/month recurring expense for 3 years.',
        previewImpact: { cash: 0, monthlyExpense: -350, happiness: 10 },
        deterministicOutcome: {
          message: "You leased the car! No upfront cost, but $350/month is now eating into your cash flow. Lifestyle creep alert.",
          impact: { cash: 0, monthlyExpense: -350, happiness: 10 },
          isPositive: false,
        },
      },
      {
        label: 'Keep your reliable car',
        icon: 'shield',
        description: 'The Honda runs fine. Real wealth isn\'t about looking rich.',
        previewImpact: { cash: 0, happiness: 0 },
        deterministicOutcome: {
          message: "You kept the Honda. Wise choice — the wealthy look ordinary on purpose. Financial discipline +1.",
          impact: { cash: 0, happiness: 3, energy: 0 },
          isPositive: true,
        },
      },
    ],
  },
  {
    id: 'shopping_spree',
    title: 'High-End Shopping Spree',
    description: "You just got paid and the mall is calling. Designer clothes, new watch, the works. Treat yourself?",
    category: 'temptation',
    icon: 'shopping',
    image: 'https://images.pexels.com/photos/5650026/pexels-photo-5650026.jpeg?auto=compress&cs=tinysrgb&w=800',
    choices: [
      {
        label: 'Buy designer clothes',
        icon: 'shirt',
        description: 'New wardrobe upgrade. Look good, feel good — but it costs.',
        previewImpact: { cash: -800, happiness: 10 },
        deterministicOutcome: {
          message: "New designer outfit! You look sharp and feel confident. But $800 is gone.",
          impact: { cash: -800, happiness: 10, energy: 3 },
          isPositive: true,
        },
      },
      {
        label: 'Resist the temptation',
        icon: 'shield',
        description: 'Keep your money invested in yourself, not in clothes.',
        previewImpact: { cash: 0, happiness: 0 },
        deterministicOutcome: {
          message: "You resisted the urge. The money stays in your account, working toward freedom.",
          impact: { cash: 0, happiness: 2, energy: 0 },
          isPositive: true,
        },
      },
    ],
  },
  {
    id: 'gym_upgrade',
    title: 'Premium Gym Membership',
    description: "Your friend invites you to join their luxury gym with pool, sauna, and classes. It's $150/month vs your $20 gym.",
    category: 'temptation',
    icon: 'dumbbell',
    image: 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=800',
    choices: [
      {
        label: 'Upgrade to premium gym',
        icon: 'dumbbell',
        description: 'Better equipment, classes, pool. Adds $130/mo extra expense.',
        previewImpact: { cash: 0, monthlyExpense: -130, happiness: 8 },
        deterministicOutcome: {
          message: "Premium gym membership activated! Great facilities, but $130/month extra is a long-term commitment.",
          impact: { cash: 0, monthlyExpense: -130, happiness: 8, energy: 10 },
          isPositive: true,
        },
      },
      {
        label: 'Keep the budget gym',
        icon: 'shield',
        description: 'Your $20 gym works fine. Save the difference.',
        previewImpact: { cash: 0, happiness: 0 },
        deterministicOutcome: {
          message: "You stayed at the budget gym. $130/month stays in your pocket. That's $1,560/year toward freedom.",
          impact: { cash: 0, happiness: 1, energy: 0 },
          isPositive: true,
        },
      },
    ],
  },
  {
    id: 'apartment_upgrade',
    title: 'Apartment Upgrade Temptation',
    description: "Your lease is up. A shiny new apartment complex has a pool, gym, and rooftop terrace. It's $600/month more than your current place.",
    category: 'temptation',
    icon: 'building',
    image: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
    choices: [
      {
        label: 'Upgrade to the luxury apartment',
        icon: 'key',
        description: 'Pool, gym, rooftop. Quality of life boost — but $600/mo more.',
        previewImpact: { cash: 0, monthlyExpense: -600, happiness: 15 },
        deterministicOutcome: {
          message: "You moved into the luxury complex! It feels great, but $600/month extra is a serious cash flow drain.",
          impact: { cash: 0, monthlyExpense: -600, happiness: 15, energy: 5 },
          isPositive: false,
        },
      },
      {
        label: 'Renew current lease',
        icon: 'shield',
        description: 'Stay put. Use the $600/month difference to invest in freedom.',
        previewImpact: { cash: 0, happiness: -3 },
        deterministicOutcome: {
          message: "You renewed your current lease. $7,200/year stays invested in your future. That's discipline.",
          impact: { cash: 0, happiness: -3, energy: 0 },
          isPositive: true,
        },
      },
    ],
  },

  // ─── C. HIGH-RISK / HIGH-REWARD ────────────────────────
  {
    id: 'start_youtube',
    title: 'Start a TikTok / YouTube Channel',
    description: "You've been watching creators make 6 figures from content. You have a unique angle — but is it worth the risk?",
    category: 'risk',
    icon: 'video',
    image: 'https://images.pexels.com/photos/3062541/pexels-photo-3062541.jpeg?auto=compress&cs=tinysrgb&w=800',
    choices: [
      {
        label: 'Invest in pro gear',
        icon: 'camera',
        description: 'Camera, lighting, editing software: $1,200 upfront. 60% chance it flops, 40% chance of +$500/mo passive income.',
        previewImpact: { cash: -1200 },
        randomOutcomes: [
          {
            message: "The channel flopped. After 3 months of grinding, views never took off. Your $1,200 gear sits collecting dust. Lesson learned.",
            impact: { cash: -1200, happiness: -8, energy: -10 },
            isPositive: false,
          },
          {
            message: "YOUR CHANNEL WENT VIRAL! A video hit 2M views and the subscribers are pouring in. You're now earning $500/month in ad revenue and sponsorships!",
            impact: { cash: -1200, passiveIncome: 500, happiness: 20, energy: 5 },
            isPositive: true,
          },
        ],
      },
      {
        label: 'Create with just your phone',
        icon: 'phone',
        description: 'Zero cost, but only 10% chance of a viral hit (+$50/mo). 90% chance of nothing.',
        previewImpact: { cash: 0 },
        randomOutcomes: [
          {
            message: "Phone content didn't gain traction. No loss, no gain. Maybe the algorithm just wasn't feeling it.",
            impact: { cash: 0, happiness: -2, energy: -3 },
            isPositive: false,
          },
          {
            message: "Your phone video went viral! It's rough quality but people loved the authenticity. You're making $50/month from creator funds!",
            impact: { cash: 0, passiveIncome: 50, happiness: 12, energy: 3 },
            isPositive: true,
          },
        ],
      },
    ],
  },
  {
    id: 'crypto_investment',
    title: 'Crypto Investment Opportunity',
    description: "A friend who 'knows someone' is pitching a new crypto token. It's supposed to 10x. You've seen the screenshots... but also the horror stories.",
    category: 'risk',
    icon: 'crypto',
    image: 'https://images.pexels.com/photos/8447001/pexels-photo-8447001.jpeg?auto=compress&cs=tinysrgb&w=800',
    choices: [
      {
        label: 'Invest $2,000',
        icon: 'trending-up',
        description: 'High risk: 30% chance of 3x return, 70% chance of losing it all.',
        previewImpact: { cash: -2000 },
        randomOutcomes: [
          {
            message: "The token crashed overnight. You lost $2,000. Your friend isn't answering calls. Classic crypto story.",
            impact: { cash: -2000, happiness: -15, energy: -8 },
            isPositive: false,
          },
          {
            message: "The token 3x'd! You turned $2,000 into $6,000! You cashed out at the right time. Beginner's luck or genius?",
            impact: { cash: 4000, happiness: 18, energy: 5 },
            isPositive: true,
          },
        ],
      },
      {
        label: 'Invest $500 (safer bet)',
        icon: 'shield',
        description: 'Smaller risk: 30% chance of 2x, 70% chance of losing $500.',
        previewImpact: { cash: -500 },
        randomOutcomes: [
          {
            message: "The token dipped. You lost $500. Painful but manageable — you only risked what you could afford.",
            impact: { cash: -500, happiness: -5, energy: -3 },
            isPositive: false,
          },
          {
            message: "The token doubled! You turned $500 into $1,000. Small win, smart risk management.",
            impact: { cash: 500, happiness: 8, energy: 2 },
            isPositive: true,
          },
        ],
      },
      {
        label: 'Pass — too risky',
        icon: 'shield',
        description: 'Keep your money in safer investments. No crypto gamble.',
        previewImpact: { cash: 0, happiness: 0 },
        deterministicOutcome: {
          message: "You passed on the crypto tip. Two weeks later the token crashed 90%. Dodged a bullet.",
          impact: { cash: 0, happiness: 5, energy: 0 },
          isPositive: true,
        },
      },
    ],
  },
  {
    id: 'side_business',
    title: 'Friend\'s Startup Needs a Partner',
    description: "Your friend is launching a SaaS startup and wants you as a co-founder. It needs $3,000 upfront and 15 hrs/week of your time.",
    category: 'risk',
    icon: 'startup',
    image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
    choices: [
      {
        label: 'Go all in as co-founder',
        icon: 'rocket',
        description: '$3,000 + 15 hrs/week. 50% chance: startup succeeds (+$2,000/mo passive). 50% chance: it fails (lose $3,000 + energy).',
        previewImpact: { cash: -3000, energy: -20 },
        randomOutcomes: [
          {
            message: "The startup failed. After 6 months of grinding nights and weekends, the product didn't find product-market fit. You lost $3,000 and a lot of sleep.",
            impact: { cash: -3000, happiness: -12, energy: -20 },
            isPositive: false,
          },
          {
            message: "THE STARTUP TOOK OFF! You hit $10K MRR within 6 months. As co-founder, you're now earning $2,000/month in passive equity income!",
            impact: { cash: -3000, passiveIncome: 2000, happiness: 25, energy: -10 },
            isPositive: true,
          },
        ],
      },
      {
        label: 'Offer to help part-time for equity',
        icon: 'handshake',
        description: 'No cash investment, 5 hrs/week for 5% equity. 30% chance of +$300/mo, 70% chance of nothing.',
        previewImpact: { cash: 0, energy: -10 },
        randomOutcomes: [
          {
            message: "The startup struggled without your full commitment. Your 5% equity is worth nothing. No loss, no gain, but time invested is gone.",
            impact: { cash: 0, happiness: -3, energy: -10 },
            isPositive: false,
          },
          {
            message: "The startup succeeded and your 5% equity translates to $300/month in distributions! Small stake, nice return.",
            impact: { cash: 0, passiveIncome: 300, happiness: 12, energy: -5 },
            isPositive: true,
          },
        ],
      },
      {
        label: 'Decline politely',
        icon: 'shield',
        description: 'Focus on your own path. No risk, no reward.',
        previewImpact: { cash: 0, happiness: 0 },
        deterministicOutcome: {
          message: "You declined. Your friend understood. You stayed focused on your own freedom journey.",
          impact: { cash: 0, happiness: 1, energy: 0 },
          isPositive: true,
        },
      },
    ],
  },
  {
    id: 'real_estate_flip',
    title: 'House Flip Opportunity',
    description: "A real estate agent found a distressed property below market value. It needs $8,000 upfront for purchase + repairs. Could sell for $15,000 profit.",
    category: 'risk',
    icon: 'house',
    image: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
    choices: [
      {
        label: 'Flip the house',
        icon: 'hammer',
        description: '$8,000 upfront. 55% chance: sell for $15,000 profit. 45% chance: repairs cost more, lose $3,000.',
        previewImpact: { cash: -8000 },
        randomOutcomes: [
          {
            message: "The flip was a disaster. Hidden water damage and mold meant $11,000 in repairs. You sold at a $3,000 loss. Real estate isn't always easy money.",
            impact: { cash: -3000, happiness: -10, energy: -15 },
            isPositive: false,
          },
          {
            message: "THE FLIP WAS A HUGE SUCCESS! You renovated smart, sold for $15,000 profit in 4 months. Your first real estate win!",
            impact: { cash: 7000, happiness: 20, energy: -5 },
            isPositive: true,
          },
        ],
      },
      {
        label: 'Pass — too much capital at risk',
        icon: 'shield',
        description: 'Keep your $8,000 in safer investments.',
        previewImpact: { cash: 0, happiness: 0 },
        deterministicOutcome: {
          message: "You passed on the flip. The property actually had severe foundation issues. Smart avoidance.",
          impact: { cash: 0, happiness: 4, energy: 0 },
          isPositive: true,
        },
      },
    ],
  },
];

const CATEGORY_WEIGHTS: Record<string, number> = {
  relationship: 0.4,
  temptation: 0.35,
  risk: 0.25,
};

export function getRandomLifeEvent(): LifeEvent {
  const roll = Math.random();
  let category: string;
  if (roll < CATEGORY_WEIGHTS.relationship) category = 'relationship';
  else if (roll < CATEGORY_WEIGHTS.relationship + CATEGORY_WEIGHTS.temptation) category = 'temptation';
  else category = 'risk';

  const pool = LIFE_EVENTS.filter(e => e.category === category);
  return pool[Math.floor(Math.random() * pool.length)] ?? LIFE_EVENTS[Math.floor(Math.random() * LIFE_EVENTS.length)];
}
