export interface NPCData {
  id: string;
  name: string;
  role: string;
  buildingType: 'home' | 'office' | 'bank' | 'mall' | 'invest' | 'life' | 'street';
  position: [number, number, number];
  rotation: number;
  shirtColor: string;
  pantsColor: string;
  skinColor: string;
  hairColor: string;
  gender?: 'male' | 'female';
  dressColor?: string;
  greeting: string;
  dialogue: NPCDialogueNode[];
  voicePitch?: number;
  voiceRate?: number;
  dynamicLines?: string[];
}

export interface NPCDialogueNode {
  id: string;
  text: string;
  speaker: 'npc' | 'player';
  choices?: { label: string; nextNode?: string; action?: string }[];
  action?: string;
  endConversation?: boolean;
}

// Tracks how many times the player has talked to each NPC — used to rotate dialogue
export const npcVisitCount: Record<string, number> = {};

export function getDynamicGreeting(npc: NPCData): string {
  const count = npcVisitCount[npc.id] ?? 0;
  npcVisitCount[npc.id] = count + 1;

  if (!npc.dynamicLines || npc.dynamicLines.length === 0) return npc.greeting;

  // First visit uses the default greeting; subsequent visits rotate through dynamic lines
  if (count === 0) return npc.greeting;
  const idx = (count - 1) % npc.dynamicLines.length;
  return npc.dynamicLines[idx];
}

export const BUILDING_NPCS: Record<string, NPCData[]> = {
  bank: [
    {
      id: 'bank_teller',
      name: 'Sarah',
      role: 'Bank Teller',
      buildingType: 'bank',
      position: [0, 0, 3],
      rotation: Math.PI,
      shirtColor: '#2a7c9c',
      pantsColor: '#1a3a5a',
      skinColor: '#f4c2a1',
      hairColor: '#8b4513',
      gender: 'female',
      dressColor: '#2a7c9c',
      greeting: "Welcome! I'm Sarah, your teller today. How can I help you?",
      voicePitch: 1.3,
      voiceRate: 1.05,
      dynamicLines: [
        "Back again! How's your financial journey going?",
        "Good to see you! Ready to make some moves today?",
        "You know, I've noticed you've been working hard. Keep it up!",
        "Welcome back! Any big plans since your last visit?",
        "I was just thinking about you. How are those investments treating you?",
      ],
      dialogue: [
        {
          id: 'start',
          text: "Welcome! I'm Sarah, your teller today. How can I help you?",
          speaker: 'npc',
          choices: [
            { label: "I'd like to apply for a loan", nextNode: 'loan_info' },
            { label: "I want to make a loan payment", nextNode: 'payment' },
            { label: "Tell me about your loan products", nextNode: 'products' },
            { label: "Goodbye, Sarah", nextNode: 'bye' },
          ],
        },
        {
          id: 'loan_info',
          text: "Great! I can connect you with our loan specialist. Would you like to see what loan options are available to you?",
          speaker: 'npc',
          choices: [
            { label: "Yes, show me loans", action: 'open_bank' },
            { label: "Not right now", nextNode: 'start' },
          ],
        },
        {
          id: 'payment',
          text: "I can help with that. Let me pull up your active loans. Would you like to review them?",
          speaker: 'npc',
          choices: [
            { label: "Yes, show my loans", action: 'open_loans' },
            { label: "Maybe later", nextNode: 'start' },
          ],
        },
        {
          id: 'products',
          text: "We offer personal loans, auto loans, mortgages, and business loans. Each has different rates and terms depending on your level. Would you like to apply?",
          speaker: 'npc',
          choices: [
            { label: "Yes, let's apply", action: 'open_bank' },
            { label: "Thanks for the info", nextNode: 'start' },
          ],
        },
        {
          id: 'bye',
          text: "Thank you for visiting Freedom Bank! Have a wonderful day!",
          speaker: 'npc',
          endConversation: true,
        },
      ],
    },
    {
      id: 'bank_manager',
      name: 'Mr. Thompson',
      role: 'Bank Manager',
      buildingType: 'bank',
      position: [-3, 0, 1],
      rotation: Math.PI / 2,
      shirtColor: '#2a2a4a',
      pantsColor: '#1a1a2a',
      skinColor: '#d4a574',
      hairColor: '#3a3a3a',
      greeting: "Ah, welcome! I'm Mr. Thompson, the branch manager. What brings you in today?",
      voicePitch: 0.75,
      voiceRate: 0.92,
      dynamicLines: [
        "Ah, back again! I always appreciate a dedicated client.",
        "Good to see you. I was just reviewing some market trends — fascinating stuff.",
        "You return! That tells me you're serious about your future. I respect that.",
        "Welcome back. I've been thinking about your portfolio. Let's chat.",
        "You know, consistency is the hallmark of success. And here you are again.",
      ],
      dialogue: [
        {
          id: 'start',
          text: "Ah, welcome! I'm Mr. Thompson, the branch manager. What brings you in today?",
          speaker: 'npc',
          choices: [
            { label: "I need financial advice", nextNode: 'advice' },
            { label: "I want to discuss a large loan", nextNode: 'large_loan' },
            { label: "Just looking around", nextNode: 'look' },
            { label: "Goodbye", nextNode: 'bye' },
          ],
        },
        {
          id: 'advice',
          text: "Smart thinking! My advice: always invest in income-producing assets before luxury. A dollar that earns while you sleep is worth ten you spend. Would you like to see investment opportunities?",
          speaker: 'npc',
          choices: [
            { label: "Yes, show me", action: 'open_actions' },
            { label: "I'll keep that in mind", nextNode: 'start' },
          ],
        },
        {
          id: 'large_loan',
          text: "For larger financing, I'd recommend speaking with our teller Sarah. She can walk you through all available products. Shall I send you over?",
          speaker: 'npc',
          choices: [
            { label: "Yes, please", action: 'open_bank' },
            { label: "I'll think about it", nextNode: 'start' },
          ],
        },
        {
          id: 'look',
          text: "Of course! Feel free to look around. Our bank has been serving this community for over 50 years. Let me know if you need anything.",
          speaker: 'npc',
          choices: [
            { label: "Thanks!", nextNode: 'start' },
          ],
        },
        {
          id: 'bye',
          text: "Take care! Remember — the best time to start building wealth was yesterday. The second best time is today.",
          speaker: 'npc',
          endConversation: true,
        },
      ],
    },
  ],
  office: [
    {
      id: 'office_boss',
      name: 'Ms. Chen',
      role: 'Office Manager',
      buildingType: 'office',
      position: [0, 0, 3],
      rotation: Math.PI,
      shirtColor: '#4a2a2a',
      pantsColor: '#2a1a1a',
      skinColor: '#e8b89a',
      hairColor: '#1a1a1a',
      gender: 'female',
      dressColor: '#4a2a2a',
      greeting: "You're here! Good. We have work to do. What can I help you with?",
      voicePitch: 1.0,
      voiceRate: 1.1,
      dynamicLines: [
        "There you are. I was starting to wonder if you'd show up today.",
        "Back already? Good. I like workers who show up consistently.",
        "I noticed you've been putting in the effort. Don't stop now.",
        "Welcome back. We've got new opportunities posted on the board.",
        "You again? I appreciate the dedication. What do you need?",
      ],
      dialogue: [
        {
          id: 'start',
          text: "You're here! Good. We have work to do. What can I help you with?",
          speaker: 'npc',
          choices: [
            { label: "What work opportunities are available?", action: 'open_actions' },
            { label: "Can I earn extra income here?", nextNode: 'income' },
            { label: "Tell me about this place", nextNode: 'about' },
            { label: "See you later", nextNode: 'bye' },
          ],
        },
        {
          id: 'income',
          text: "Of course! We have overtime shifts, freelance projects, and skill-building courses. The more you learn, the more you earn. Want to see what's available?",
          speaker: 'npc',
          choices: [
            { label: "Yes, show me", action: 'open_actions' },
            { label: "Not now", nextNode: 'start' },
          ],
        },
        {
          id: 'about',
          text: "This is the central office district. You can pick up shifts, attend workshops, and build your professional network here. Your career starts with hustle!",
          speaker: 'npc',
          choices: [
            { label: "Let me get started", action: 'open_actions' },
            { label: "Interesting", nextNode: 'start' },
          ],
        },
        {
          id: 'bye',
          text: "Don't work too hard! Actually... no, work hard. That's how you get ahead. See you tomorrow!",
          speaker: 'npc',
          endConversation: true,
        },
      ],
    },
    {
      id: 'office_coworker',
      name: 'Jake',
      role: 'Coworker',
      buildingType: 'office',
      position: [3, 0, 1],
      rotation: -Math.PI / 2,
      shirtColor: '#2a4a2a',
      pantsColor: '#1a2a1a',
      skinColor: '#f4c2a1',
      hairColor: '#5a3a1a',
      greeting: "Hey! You're new here, right? Welcome to the grind!",
      voicePitch: 1.15,
      voiceRate: 1.2,
      dynamicLines: [
        "Yo! Back again huh? The grind never stops, right?",
        "Hey buddy! I was just telling someone about you. You're making moves!",
        "Dude, good to see you. I got a new side hustle idea — maybe I'll tell you about it.",
        "Hey! You look like you've been busy. That's what I like to see!",
        "Back so soon? Either you love this place or you're lost. Either way, welcome!",
      ],
      dialogue: [
        {
          id: 'start',
          text: "Hey! You're new here, right? Welcome to the grind! This place isn't glamorous, but it pays the bills. What's up?",
          speaker: 'npc',
          choices: [
            { label: "Any tips for a newcomer?", nextNode: 'tips' },
            { label: "What do you do here?", nextNode: 'job' },
            { label: "Catch you later", nextNode: 'bye' },
          ],
        },
        {
          id: 'tips',
          text: "Honestly? Use your actions wisely each month. Don't burn out — keep your energy up. And invest what you earn. A paycheck is temporary; passive income is forever.",
          speaker: 'npc',
          choices: [
            { label: "Great advice, thanks!", nextNode: 'start' },
          ],
        },
        {
          id: 'job',
          text: "I do data entry and take extra shifts when I can. It's not exciting, but it keeps cash flowing while I build my side hustle. You should check what opportunities are available!",
          speaker: 'npc',
          choices: [
            { label: "Show me opportunities", action: 'open_actions' },
            { label: "Cool, thanks", nextNode: 'start' },
          ],
        },
        {
          id: 'bye',
          text: "See ya! Don't forget — we get paid on Friday!",
          speaker: 'npc',
          endConversation: true,
        },
      ],
    },
  ],
  mall: [
    {
      id: 'mall_shopkeeper',
      name: 'Maria',
      role: 'Shop Owner',
      buildingType: 'mall',
      position: [0, 0, 3],
      rotation: Math.PI,
      shirtColor: '#8a2a8a',
      pantsColor: '#4a1a4a',
      skinColor: '#c89060',
      hairColor: '#2a1a1a',
      gender: 'female',
      dressColor: '#8a2a8a',
      greeting: "Welcome to my shop! Looking for anything special today?",
      voicePitch: 1.25,
      voiceRate: 0.98,
      dynamicLines: [
        "Oh, welcome back! I just got some new inventory in. Come look!",
        "My favorite customer returns! How have you been?",
        "Back again? You must really like my shop. I'm flattered!",
        "Hola! I was just restocking. Business has been good lately, thanks to people like you.",
        "You again! I saved you a little discount. Regulars deserve perks, no?",
      ],
      dialogue: [
        {
          id: 'start',
          text: "Welcome to my shop! Looking for anything special today? We have the best deals in the city!",
          speaker: 'npc',
          choices: [
            { label: "What can I do here?", nextNode: 'do' },
            { label: "Show me what's available", action: 'open_actions' },
            { label: "Just browsing", nextNode: 'browse' },
            { label: "Thanks, bye!", nextNode: 'bye' },
          ],
        },
        {
          id: 'do',
          text: "At the mall you can shop, network with customers, and even start a retail business! It's a great place to build connections and find opportunities.",
          speaker: 'npc',
          choices: [
            { label: "Show me opportunities", action: 'open_actions' },
            { label: "Sounds good", nextNode: 'start' },
          ],
        },
        {
          id: 'browse',
          text: "Take your time! Let me know if you need help with anything. And remember — supporting local businesses builds your network!",
          speaker: 'npc',
          choices: [
            { label: "Will do!", nextNode: 'start' },
          ],
        },
        {
          id: 'bye',
          text: "Come back soon! And tell your friends — every customer counts!",
          speaker: 'npc',
          endConversation: true,
        },
      ],
    },
  ],
  invest: [
    {
      id: 'invest_advisor',
      name: 'David',
      role: 'Investment Advisor',
      buildingType: 'invest',
      position: [0, 0, 3],
      rotation: Math.PI,
      shirtColor: '#1a3a5a',
      pantsColor: '#0a1a2a',
      skinColor: '#e0b090',
      hairColor: '#4a4a4a',
      greeting: "Welcome to Investment Tower. I'm David. Ready to grow your wealth?",
      voicePitch: 0.85,
      voiceRate: 0.95,
      dynamicLines: [
        "Good to see you again. The markets have been interesting lately.",
        "Welcome back. I was just analyzing some new opportunities for you.",
        "You return! That tells me you're thinking long-term. Smart.",
        "Ah, back again. Consistency is key in investing, you know.",
        "Good to see you. I've been watching your portfolio grow. Impressive progress.",
      ],
      dialogue: [
        {
          id: 'start',
          text: "Welcome to Investment Tower. I'm David, your investment advisor. Are you ready to grow your wealth?",
          speaker: 'npc',
          choices: [
            { label: "Show me investment options", action: 'open_actions' },
            { label: "Review my portfolio", action: 'open_assets' },
            { label: "What should I invest in?", nextNode: 'advice' },
            { label: "Goodbye, David", nextNode: 'bye' },
          ],
        },
        {
          id: 'advice',
          text: "Start with what you know. If you understand real estate, buy property. If you know business, start one. Diversify as you grow. And never invest money you can't afford to lose.",
          speaker: 'npc',
          choices: [
            { label: "Show me options", action: 'open_actions' },
            { label: "Review my portfolio", action: 'open_assets' },
            { label: "Thanks for the advice", nextNode: 'start' },
          ],
        },
        {
          id: 'bye',
          text: "Remember: the stock market is a device for transferring money from the impatient to the patient. See you soon!",
          speaker: 'npc',
          endConversation: true,
        },
      ],
    },
  ],
  home: [
    {
      id: 'home_partner',
      name: 'Alex',
      role: 'Your Partner',
      buildingType: 'home',
      position: [0, 0, 3],
      rotation: Math.PI,
      shirtColor: '#5a2a5a',
      pantsColor: '#3a1a3a',
      skinColor: '#f4c2a1',
      hairColor: '#3a2a1a',
      greeting: "Hey, you're home! I missed you. How was your day?",
      voicePitch: 1.2,
      voiceRate: 1.0,
      dynamicLines: [
        "You're back! I was getting lonely. How did today go?",
        "Hey love! I made dinner. Come tell me about your day.",
        "There you are! I was starting to worry. How are things out there?",
        "Welcome home! I've been thinking about you all day. Tell me everything.",
        "You're back! I missed your face. The house was too quiet without you.",
      ],
      dialogue: [
        {
          id: 'start',
          text: "Hey, you're home! I missed you. How was your day? Did you make any progress on your goals?",
          speaker: 'npc',
          choices: [
            { label: "Let me check my assets", action: 'open_assets' },
            { label: "It was a good day!", nextNode: 'good' },
            { label: "I'm exhausted", nextNode: 'tired' },
            { label: "I need to head out", nextNode: 'bye' },
          ],
        },
        {
          id: 'good',
          text: "That's amazing! I'm so proud of you. Every step forward brings us closer to freedom. Keep going!",
          speaker: 'npc',
          choices: [
            { label: "Thanks, love", nextNode: 'start' },
          ],
        },
        {
          id: 'tired',
          text: "You work so hard. Make sure you rest too — your health matters more than money. Want to just relax tonight?",
          speaker: 'npc',
          choices: [
            { label: "Yes, let's rest", action: 'rest' },
            { label: "I can't, I have work to do", nextNode: 'start' },
          ],
        },
        {
          id: 'bye',
          text: "Okay, be safe out there! I'll be here when you get back. Love you!",
          speaker: 'npc',
          endConversation: true,
        },
      ],
    },
  ],
  life: [
    {
      id: 'life_host',
      name: 'Luna',
      role: 'Event Host',
      buildingType: 'life',
      position: [0, 0, 3],
      rotation: Math.PI,
      shirtColor: '#6a2a4a',
      pantsColor: '#3a1a2a',
      skinColor: '#d4a574',
      hairColor: '#6a3a6a',
      gender: 'female',
      dressColor: '#6a2a4a',
      greeting: "Welcome to the Event Plaza! Life is full of surprises. Ready for one?",
      voicePitch: 1.35,
      voiceRate: 1.15,
      dynamicLines: [
        "Back for more adventure? The universe has been waiting for you!",
        "Oh, you again! I feel something exciting coming your way today.",
        "Welcome back! Life has a funny way of surprising us, doesn't it?",
        "You return! I was just shuffling the cards of fate. Ready to draw?",
        "Hey there! I've got a feeling today's the day something big happens.",
      ],
      dialogue: [
        {
          id: 'start',
          text: "Welcome to the Event Plaza! Life is full of surprises — some good, some challenging. Are you ready for what life throws at you?",
          speaker: 'npc',
          choices: [
            { label: "Bring on the adventure!", action: 'trigger_event' },
            { label: "What kind of events?", nextNode: 'explain' },
            { label: "Maybe later", nextNode: 'bye' },
          ],
        },
        {
          id: 'explain',
          text: "Life events are unexpected moments — relationship decisions, temptations, risky opportunities. They can make or break your journey. Choose wisely!",
          speaker: 'npc',
          choices: [
            { label: "I'm ready!", action: 'trigger_event' },
            { label: "I need to prepare first", nextNode: 'bye' },
          ],
        },
        {
          id: 'bye',
          text: "No worries! The plaza is always here when you're ready to face what life has in store. Take care!",
          speaker: 'npc',
          endConversation: true,
        },
      ],
    },
  ],
};

export const STREET_NPCS: NPCData[] = [
  {
    id: 'street_1',
    name: 'Tom',
    role: 'Pedestrian',
    buildingType: 'street',
    position: [-5, 0, 8],
    rotation: 0,
    shirtColor: '#3a5a3a',
    pantsColor: '#2a3a2a',
    skinColor: '#e0b090',
    hairColor: '#5a3a1a',
    greeting: "Oh, hey there! Nice day for a walk, isn't it?",
    voicePitch: 1.1,
    voiceRate: 1.1,
    dynamicLines: [
      "Oh hey again! You're becoming a regular sight around here.",
      "Back for another walk? I swear I see you more than my own neighbors.",
      "Hey! I was just thinking about that cafe. Want to join me sometime?",
      "You again! You know, you're the most active person I've seen in this city.",
      "Oh, it's you! Nice to see a familiar face. How's the hustle going?",
    ],
    dialogue: [
      {
        id: 'start',
        text: "Oh, hey there! Nice day for a walk, isn't it? I was just heading to the cafe. You new around here?",
        speaker: 'npc',
        choices: [
          { label: "Yeah, I'm new!", nextNode: 'new' },
          { label: "I live here", nextNode: 'local' },
          { label: "See you around!", nextNode: 'bye' },
        ],
      },
      {
        id: 'new',
        text: "Welcome to the neighborhood! There's lots to explore — the bank, the office, the mall. If you want to build wealth, this is the place to do it!",
        speaker: 'npc',
        choices: [
          { label: "Thanks for the tip!", nextNode: 'bye' },
        ],
      },
      {
        id: 'local',
        text: "Oh nice! Then you probably already know — this city is full of opportunity. You just have to walk around and talk to people. That's how I found my first business partner!",
        speaker: 'npc',
        choices: [
          { label: "Good to know!", nextNode: 'bye' },
        ],
      },
      {
        id: 'bye',
        text: "Take care! Maybe I'll see you at the cafe sometime!",
        speaker: 'npc',
        endConversation: true,
      },
    ],
  },
  {
    id: 'street_2',
    name: 'Priya',
    role: 'Entrepreneur',
    buildingType: 'street',
    position: [6, 0, 8],
    rotation: Math.PI / 2,
    shirtColor: '#5a3a1a',
    pantsColor: '#3a2a1a',
    skinColor: '#c89060',
    hairColor: '#1a1a1a',
    gender: 'female',
    dressColor: '#5a3a1a',
    greeting: "Hey! You look like someone with ambition. Got a minute?",
    voicePitch: 1.05,
    voiceRate: 1.15,
    dynamicLines: [
      "Hey again! Still chasing that dream? Good. Never stop.",
      "You're back! I've been mentoring a new founder. She reminds me of you.",
      "Oh, it's you! I was just sharing your story with someone. You're inspiring people!",
      "Back again? I love that dedication. What are you building this time?",
      "Hey! You know, I can tell you're getting closer to freedom. I can see it in your eyes.",
    ],
    dialogue: [
      {
        id: 'start',
        text: "Hey! You look like someone with ambition. I'm Priya — I started a business from nothing and now I mentor others. Want some advice?",
        speaker: 'npc',
        choices: [
          { label: "Yes, please!", nextNode: 'advice' },
          { label: "Maybe later", nextNode: 'bye' },
        ],
      },
      {
        id: 'advice',
        text: "Three rules: 1) Spend less than you earn. 2) Invest the difference. 3) Never stop learning. Follow these and you'll be free before you know it. The Investment Tower is a great place to start!",
        speaker: 'npc',
        choices: [
          { label: "Thank you, Priya!", nextNode: 'bye' },
        ],
      },
      {
        id: 'bye',
        text: "Go get 'em! And remember — the best investment you can make is in yourself.",
        speaker: 'npc',
        endConversation: true,
      },
    ],
  },
  {
    id: 'street_3',
    name: 'Old Mike',
    role: 'Retiree',
    buildingType: 'street',
    position: [-3, 0, -14],
    rotation: 0,
    shirtColor: '#4a4a5a',
    pantsColor: '#2a2a3a',
    skinColor: '#d4a574',
    hairColor: '#cccccc',
    greeting: "Young blood! Sit down for a moment. Let me share some wisdom.",
    voicePitch: 0.7,
    voiceRate: 0.85,
    dynamicLines: [
      "Ah, back again! You know, I've been thinking about what I told you last time.",
      "There he is! I was just sitting here reminiscing. Care to listen?",
      "You again! I like that you keep coming back. That shows character.",
      "Oh, it's you! I had another thought since we last spoke. Mind if I share?",
      "Welcome back, young blood. You know, I've been watching your progress. Impressive.",
    ],
    dialogue: [
      {
        id: 'start',
        text: "Young blood! I've been watching you hustle around this city. Reminds me of myself forty years ago. Mind if I share some wisdom?",
        speaker: 'npc',
        choices: [
          { label: "I'd love to hear it", nextNode: 'wisdom' },
          { label: "I'm in a rush, sorry", nextNode: 'rush' },
        ],
      },
      {
        id: 'wisdom',
        text: "I spent my youth chasing paychecks. It wasn't until I started buying assets — real estate, businesses, stocks — that my money started working for me. Don't make my mistake. Start investing early.",
        speaker: 'npc',
        choices: [
          { label: "That's great advice", nextNode: 'wisdom2' },
        ],
      },
      {
        id: 'wisdom2',
        text: "And don't forget to enjoy the journey! Money is just a tool. The real goal is freedom — the ability to choose how you spend your time. Now go build something great!",
        speaker: 'npc',
        choices: [
          { label: "Thank you, Mike", nextNode: 'bye' },
        ],
      },
      {
        id: 'rush',
        text: "I understand. Youth is always in a hurry. Just remember — time is the one thing money can't buy. Use it wisely.",
        speaker: 'npc',
        choices: [
          { label: "I will. Thanks!", nextNode: 'bye' },
        ],
      },
      {
        id: 'bye',
        text: "Go on, then. The city is waiting for you. And come say hi to old Mike once in a while!",
        speaker: 'npc',
        endConversation: true,
      },
    ],
  },
  {
    id: 'street_4',
    name: 'Zoe',
    role: 'Student',
    buildingType: 'street',
    position: [4, 0, 12],
    rotation: -Math.PI / 2,
    shirtColor: '#2a4a6a',
    pantsColor: '#1a2a3a',
    skinColor: '#f0c8a8',
    hairColor: '#8a4a2a',
    gender: 'female',
    dressColor: '#2a4a6a',
    greeting: "Oh hi! Sorry, I was just studying. Are you an investor?",
    voicePitch: 1.4,
    voiceRate: 1.25,
    dynamicLines: [
      "Oh, hi again! I passed my last exam, thanks for asking!",
      "You're back! I was just reading about compound interest again. It never stops amazing me.",
      "Hey! I got a new book recommendation for you. Want to hear it?",
      "Oh, it's you! I'm almost done with my degree. Time flies!",
      "Hi again! You know, you're my inspiration. I tell my classmates about you.",
    ],
    dialogue: [
      {
        id: 'start',
        text: "Oh hi! Sorry, I was just studying for my finance exam. Are you an investor? You look like you know what you're doing!",
        speaker: 'npc',
        choices: [
          { label: "I'm learning!", nextNode: 'learning' },
          { label: "What are you studying?", nextNode: 'study' },
          { label: "Good luck on your exam!", nextNode: 'bye' },
        ],
      },
      {
        id: 'learning',
        text: "That's awesome! The best investors never stop learning. Have you checked out the Investment Tower? David up there is really knowledgeable. He helped me understand compound interest!",
        speaker: 'npc',
        choices: [
          { label: "I'll visit him!", nextNode: 'bye' },
        ],
      },
      {
        id: 'study',
        text: "Finance and economics! I want to start my own investment fund someday. Knowledge is the one investment that always pays dividends. Keep building yours!",
        speaker: 'npc',
        choices: [
          { label: "You'll do great!", nextNode: 'bye' },
        ],
      },
      {
        id: 'bye',
        text: "Thanks! And hey — if you ever want to study together, I'm usually at the Bookstore. See you around!",
        speaker: 'npc',
        endConversation: true,
      },
    ],
  },
];
