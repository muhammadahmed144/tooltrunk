export const CATEGORIES = [
  'All Categories',
  'Power Tools',
  'Equipment',
  'Hand Tools',
  'Garden',
  'Automotive',
  'Plumbing',
  'Electrical',
  'Construction',
];

export const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
];

export const DEFAULT_REQUESTS = [
  {
    id: 'r1',
    requester: 'Sophie Chen',
    toolId: 't1',
    toolName: 'DeWalt 20V Cordless Drill',
    duration: '3 Days',
    pointsReward: 20,
  },
];

export const DEFAULT_BORROWS = [
  {
    id: 'b1',
    owner: 'Sarah Jenkins',
    toolName: 'Commercial Pressure Washer',
    daysRemaining: 2,
  },
];

export const DEMO_POPULAR_TOOLS = [
  {
    id: 'tool-cordless-drill-1',
    name: 'Cordless Drill',
    title: 'Cordless Drill',
    category: 'Power Tools',
    pricePerDay: 800,
    rating: 4.8,
    reviewsCount: 24,
    distanceKm: 2.4,
    postalCode: '75000',
    ownerName: 'Ahmed Khan',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
    status: 'available',
  },
  {
    id: 'tool-aluminium-ladder-2',
    name: 'Aluminium Ladder',
    title: 'Aluminium Ladder',
    category: 'Equipment',
    pricePerDay: 500,
    rating: 5.0,
    reviewsCount: 18,
    distanceKm: 1.2,
    postalCode: '75000',
    ownerName: 'Sara Ali',
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80',
    status: 'available',
  },
  {
    id: 'tool-circular-saw-3',
    name: 'Circular Saw',
    title: 'Circular Saw',
    category: 'Power Tools',
    pricePerDay: 950,
    rating: 4.9,
    reviewsCount: 22,
    distanceKm: 3.8,
    postalCode: '75000',
    ownerName: 'Usman Tariq',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800&auto=format&fit=crop&q=80',
    status: 'available',
  },
  {
    id: 'tool-toolbox-set-4',
    name: 'Toolbox Set',
    title: 'Toolbox Set',
    category: 'Hand Tools',
    pricePerDay: 400,
    rating: 4.6,
    reviewsCount: 11,
    distanceKm: 4.1,
    postalCode: '75000',
    ownerName: 'Bilal Ahmed',
    imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800&auto=format&fit=crop&q=80',
    status: 'available',
  },
];

export function getTierInfo(reputation = 0) {
  if (reputation >= 180) {
    return {
      tier: 'Platinum Hero',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
      percent: 100,
      nextScore: 0,
      text: 'You are at the maximum community trust tier!',
    };
  }
  if (reputation >= 140) {
    const p = ((reputation - 140) / 40) * 100;
    return {
      tier: 'Gold Champion',
      color: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
      percent: Math.min(100, p),
      nextScore: 180,
      text: `${180 - reputation} pts to Platinum Hero`,
    };
  }
  if (reputation >= 100) {
    const p = ((reputation - 100) / 40) * 100;
    return {
      tier: 'Silver Neighbor',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
      percent: Math.min(100, p),
      nextScore: 140,
      text: `${140 - reputation} pts to Gold Champion`,
    };
  }
  const p = (reputation / 100) * 100;
  return {
    tier: 'Bronze Member',
    color: 'text-slate-400 border-slate-500/30 bg-slate-950/20',
    percent: Math.min(100, p),
    nextScore: 100,
    text: `${100 - reputation} pts to Silver Neighbor`,
  };
}
