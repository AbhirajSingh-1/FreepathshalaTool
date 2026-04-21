// ─── Mock Data for FreePathshala Tool ──────────────────────────────────────

export const RST_ITEMS = [
  'Glass Bottle', 'Glass Other', 'Plastic Bottle / Box', 'Other Plastic',
  'Paper', 'Cardboard Box', 'Iron', 'E-Waste', 'Wood', 'Others',
]

export const SKS_ITEMS = [
  'Kids Clothes',
  'Kids Shoes',
  'Toys',
  'Sports Items',
  'Adult Clothes',
  'Adult Shoes',
  'Utensils',
  'Furniture',
  'New Stationery',
  'TV',
  'Purifier',
  'Laptop / PC',
  'Microwave / OTG',
  'Others',
]
 

export const RATE_CHART_ITEMS = [
  'Glass Bottle', 'Glass Other', 'Plastic Bottle / Box', 'Other Plastic',
  'Paper', 'Cardboard Box', 'Iron', 'E-Waste', 'Wood', 'Others',
]

export const DEFAULT_RATE_CHART = {
  'Glass Bottle': 2, 'Glass Other': 1, 'Plastic Bottle / Box': 8,
  'Other Plastic': 5, 'Paper': 12, 'Cardboard Box': 10,
  'Iron': 25, 'E-Waste': 15, 'Wood': 3, 'Others': 5,
}

export const DONOR_STATUSES    = ['Active', 'Postponed', 'Lost']
export const PICKUP_STATUSES   = ['Completed', 'Postponed', 'Pending', 'Did Not Open Door']
export const PAYMENT_STATUSES  = ['Paid', 'Not Paid', 'Partially Paid', 'Write Off']
export const POSTPONE_REASONS  = ['Donor unavailable', 'Rescheduled', 'PickupPartner unavailable', 'Other']
export const LOST_REASONS      = ['Not interested', 'Shifted', 'Society restriction', 'No Raddi', 'Other']
export const PICKUP_MODES      = ['Individual', 'Drive']
export const CITIES            = ['Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad']

export const GURGAON_SOCIETIES = {
  'Sector 1':  ['Sector 1 Apartments', 'Green Fields Colony', 'Surya Vihar'],
  'Sector 2':  ['Sector 2 Apartments', 'Shree Ram Colony', 'Arjun Nagar'],
  'Sector 3':  ['Sector 3 Residency', 'New Colony', 'Ganpati Enclave'],
  'Sector 4':  ['Sector 4 Apartments', 'Krishna Colony', 'Radha Kunj'],
  'Sector 5':  ['Sector 5 Colony', 'Shiv Enclave', 'Ram Nagar'],
  'Sector 6':  ['Sector 6 Apartments', 'Prem Colony', 'Vishwa Kunj'],
  'Sector 7':  ['Sector 7 Residency', 'Hari Nagar', 'Dev Colony'],
  'Sector 8':  ['Sector 8 Apartments', 'Sai Enclave', 'Laxmi Colony'],
  'Sector 9':  ['Sector 9 Apartments', 'Guru Nanak Colony', 'Balaji Vihar'],
  'Sector 10': ['Sector 10 Residency', 'Bharat Nagar', 'Arya Colony'],
  'Sector 11': ['Sector 11 Apartments', 'Indira Colony', 'Nehru Vihar'],
  'Sector 12': ['New Palam Vihar Apartments', 'Sector 12 Colony', 'Hanuman Colony'],
  'Sector 12A':['Sector 12A Residency', 'Green Park', 'Surya Apartments'],
  'Sector 13': ['Sector 13 Apartments', 'Shastripur Colony', 'Rajiv Nagar'],
  'Sector 14': ['DLF Garden City', 'Suncity Township', 'Sector 14 Apartments', 'Hari Enclave', 'Palam Enclave'],
  'Sector 15': ['Shanti Nagar', 'Green Valley', 'Palam Enclave', 'Omaxe Hills', 'Era Welcome Society', 'Sector 15 Apartments'],
  'Sector 15 Part-1': ['15 Part-1 Residency', 'Kalyani Apartments'],
  'Sector 15 Part-2': ['15 Part-2 Colony', 'Sai Vihar'],
  'Sector 16': ['Sector 16 Colony', 'Vasundhara Enclave', 'Patel Nagar'],
  'Sector 17': ['Sector 17 Apartments', 'Shanti Kunj', 'Lok Vihar'],
  'Sector 18': ['Sector 18 Colony', 'Janakpuri Colony', 'Ashok Nagar'],
  'Sector 19': ['Sector 19 Residency', 'Priya Enclave', 'Krishna Kunj'],
  'Sector 20': ['Sector 20 Apartments', 'Basant Enclave', 'Sunrise Colony'],
  'Sector 21': ['Sector 21 Colony', 'Ram Vihar', 'Shyam Nagar'],
  'Sector 22': ['Green Park Residency', 'Sunflower Apartments', 'Heritage Homes', 'Pride Apartments', 'Shriram Apartments', 'Shri Ram Colony', 'Vipul Garden', 'Central Park'],
  'Sector 23': ['Sector 23 Residency', 'Agarwal Colony', 'Mahavir Enclave'],
  'Sector 23A':['Sector 23A Apartments', 'Gupta Colony'],
  'Sector 24': ['Sector 24 Colony', 'DLF Qutab Enclave', 'Sunrise Apartments'],
  'Sector 25': ['Sector 25 Apartments', 'Vijay Nagar', 'Jai Hind Colony'],
  'Sector 26': ['Sector 26 Colony', 'Ekta Apartments', 'Pratap Vihar'],
  'Sector 27': ['Sector 27 Residency', 'Kiran Apartments', 'Sunil Colony'],
  'Sector 28': ['Sector 28 Apartments', 'Mohan Colony', 'Satyam Enclave'],
  'Sector 29': ['Sector 29 Colony', 'Blue Heaven Apartments', 'Sukhdev Vihar'],
  'Sector 30': ['Sector 30 Residency', 'Amarnath Colony', 'Tulsi Vihar'],
  'Sector 31': ['Sector 31 Apartments', 'Anand Colony', 'Champa Kunj'],
  'Sector 32': ['Sector 32 Colony', 'Central Park Towers', 'Supertech Romano'],
  'Sector 33': ['Sector 33 Apartments', 'Sarvodaya Colony', 'Anupam Enclave'],
  'Sector 34': ['Sector 34 Colony', 'Green Meadows', 'Sunita Apartments'],
  'Sector 35': ['Sector 35 Residency', 'Sunrise Colony', 'Hari Om Vihar'],
  'Sector 36': ['Sector 36 Apartments', 'Sai Krishna Colony', 'Ram Lila Colony'],
  'Sector 37': ['Sector 37 Colony', 'Indraprastha Apartments', 'Sai Ashish Enclave'],
  'Sector 37C':['37C Residency', 'Ashirwad Apartments'],
  'Sector 38': ['Sector 38 Colony', 'Ashok Vihar', 'Bhavani Enclave'],
  'Sector 39': ['Sector 39 Apartments', 'Ansal Plaza Apartments', 'BPTP Park Grandeura'],
  'Sector 40': ['Sector 40 Colony', 'DLF City Court', 'Unitech Woodstock Floors'],
  'Sector 41': ['Sector 41 Apartments', 'Emaar Emerald Towers', 'Central Park 1'],
  'Sector 42': ['Sector 42 Colony', 'Vipul World', 'Tulip Yellow'],
  'Sector 43': ['Sector 43 Residency', 'Bestech Park View City', 'Malibu Town'],
  'Sector 44': ['Adarsh Colony', 'Vipul Greens', 'Orchid Petals', 'Unitech Harmony', 'The Close North', 'Ridgewood Estate', 'Ardee City Sector 44'],
  'Sector 45': ['Sector 45 Apartments', 'Surya Apartments', 'DLF New Town Heights 1'],
  'Sector 46': ['Sector 46 Colony', 'Unitech Unihomes', 'Emaar MGF Land'],
  'Sector 47': ['Unitech Nirvana Country', 'BPTP Park Prima', 'Nirvana Country 1', 'Nirvana Country 2', 'Sector 47 Residency'],
  'Sector 48': ['Sector 48 Apartments', 'BPTP Terra', 'BPTP Park Serene'],
  'Sector 49': ['Sector 49 Colony', 'Bestech Park View Spa', 'Pioneer Park'],
  'Sector 50': ['Emaar Palm Drive', 'Nirvana Country', 'Vatika City 1', 'Sector 50 Residency', 'Ardee City Sector 50'],
  'Sector 51': ['Sector 51 Apartments', 'Emaar Palm Hills', 'Tulip Violet'],
  'Sector 52': ['M3M Merlin', 'Central Park 2 - Belgravia', 'Sector 52 Colony', 'Ardee City Sector 52'],
  'Sector 52A':['Sector 52A Residency', 'Green Field Colony'],
  'Sector 53': ['DLF Ridgewood', 'The Close North', 'The Close South', 'Sector 53 Apartments', 'DLF City Phase 4'],
  'Sector 54': ['DLF Ridgewood', 'Emaar MGF Palm Hills', 'Sector 54 Colony', 'Pioneer Presidia'],
  'Sector 55': ['Sector 55 Apartments', 'Tulip White', 'Bestech Park View Signature'],
  'Sector 56': ['Emaar Emerald Estate', 'Emaar Gurgaon Greens', 'Sector 56 Colony', 'Unitech Anthea'],
  'Sector 57': ['Tulip Violet', 'Tulip White', 'Tulip Orange', 'Tulip Purple', 'Tulip Ivory', 'Tulip Lemon', 'Sector 57 Apartments'],
  'Sector 58': ['Sector 58 Colony', 'Birla Navya', 'Emaar Emerald Floors'],
  'Sector 59': ['Sector 59 Apartments', 'Godrej Summit', 'ATS Triumph'],
  'Sector 60': ['Sector 60 Colony', 'Ireo Skyon', 'Sobha City'],
  'DLF Phase 1': ['Hamilton Court', 'Carlton Estate', 'DLF City Court', 'Park Place', 'Qutab Plaza', 'Palm Court'],
  'DLF Phase 2': ['Beverly Park I', 'Beverly Park II', 'Ridgewood Estate', 'Silver Oaks', 'The Pinnacle', 'Park Drive'],
  'DLF Phase 3': ['Belaire', 'Magnolias', 'Aralias', 'The Crest', 'Summit Point', 'Camellia'],
  'DLF Phase 4': ['The Camellias', 'The Skycourt', 'Westend Heights', 'Park Towers', 'New Town Heights'],
  'DLF Phase 5': ['The Ultima', 'The Primus', 'The Icon', 'Capital Greens', 'Park Place Phase 5'],
  'Palam Vihar': ['Palam Vihar Apartments', 'Star Apartments', 'M3M Urbana', 'Countrywide Apartments', 'Om Shanti Apartments'],
  'Palam Vihar Extension': ['Extension Residency', 'Palam Height', 'Galaxy Apartments'],
  'Sushant Lok 1': ['Sushant Estate', 'Ansal Sushant City', 'Emaar Palm Hills', 'DLF Ridgewood', 'Sushant Lok Apartments'],
  'Sushant Lok 2': ['Sushant Lok 2 Apartments', 'Vipul Belmonte', 'Shree Residency'],
  'Sushant Lok 3': ['Sushant Lok 3 Colony', 'Unitech Ansal', 'Nirvana Society'],
  'South City 1': ['Tata Primanti', 'Supertech Czar Phase 1', 'South City Apartments', 'Palm Grove Residences'],
  'South City 2': ['Ireo Victory Valley', 'The Laburnum', 'South End Apartments', 'Emmar South City'],
  'Malibu Towne': ['Malibu Court', 'Parsvnath Exotica', 'Raheja Atlantis', 'Malibu Gardens'],
  'Nirvana Country': ['Nirvana Courtyard', 'Vatika City 2', 'Emaar Palm Drive 2', 'Unitech Woodstock'],
  'Ardee City': ['Ardee City Phase 1', 'Ardee City Phase 2', 'Ardee City Phase 3'],
  'Golf Course Road': ['Emerald Hills', 'Central Park 1', 'Vipul Lavinium', 'DLF Phase 4 GCR'],
  'Golf Course Extension Road': ['Emaar The Views', 'M3M Golf Hills', 'Tulip Lemon', 'Birla Navya'],
  'Sohna Road': ['Vatika Tranquil Heights', 'Bestech Park View Spa', 'SPR Sohna Road'],
  'MG Road': ['MG Road Apartments', 'Central Arcade Residency', 'Metro Heights'],
  'NH-48': ['NH-48 Residency', 'Manesar Industrial Area', 'Landmark Apartments'],
  'Manesar': ['Manesar Apartments', 'IMT Manesar Colony', 'Saraswati Enclave'],
}

export const ALL_GURGAON_SOCIETIES = Object.values(GURGAON_SOCIETIES).flat()

export const CITY_SECTORS = {
  Gurgaon: [
    'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5',
    'Sector 6', 'Sector 7', 'Sector 8', 'Sector 9', 'Sector 10',
    'Sector 11', 'Sector 12', 'Sector 12A', 'Sector 13', 'Sector 14',
    'Sector 15', 'Sector 15 Part-1', 'Sector 15 Part-2',
    'Sector 16', 'Sector 17', 'Sector 18', 'Sector 19', 'Sector 20',
    'Sector 21', 'Sector 22', 'Sector 23', 'Sector 23A', 'Sector 24',
    'Sector 25', 'Sector 26', 'Sector 27', 'Sector 28', 'Sector 29',
    'Sector 30', 'Sector 31', 'Sector 32', 'Sector 33', 'Sector 34',
    'Sector 35', 'Sector 36', 'Sector 37', 'Sector 37C', 'Sector 38',
    'Sector 39', 'Sector 40', 'Sector 41', 'Sector 42', 'Sector 43',
    'Sector 44', 'Sector 45', 'Sector 46', 'Sector 47', 'Sector 48',
    'Sector 49', 'Sector 50', 'Sector 51', 'Sector 52', 'Sector 52A',
    'Sector 53', 'Sector 54', 'Sector 55', 'Sector 56', 'Sector 57',
    'Sector 58', 'Sector 59', 'Sector 60',
    'DLF Phase 1', 'DLF Phase 2', 'DLF Phase 3', 'DLF Phase 4', 'DLF Phase 5',
    'Palam Vihar', 'Palam Vihar Extension',
    'Sushant Lok 1', 'Sushant Lok 2', 'Sushant Lok 3',
    'South City 1', 'South City 2',
    'Malibu Towne', 'Nirvana Country', 'Ardee City',
    'Golf Course Road', 'Golf Course Extension Road', 'Sohna Road',
    'MG Road', 'NH-48', 'Manesar',
  ],
  Delhi: [
    'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5',
    'Sector 6', 'Sector 7', 'Sector 8', 'Sector 9', 'Sector 10',
    'Phase 1', 'Phase 2', 'Phase 3',
    'Dwarka Sector 1–23', 'Rohini', 'Janakpuri', 'Vasant Kunj',
    'Saket', 'Greater Kailash', 'Defence Colony', 'Lajpat Nagar',
  ],
  Noida: [
    'Sector 1', 'Sector 2', 'Sector 5', 'Sector 6', 'Sector 7',
    'Sector 8', 'Sector 9', 'Sector 10', 'Sector 11', 'Sector 12',
    'Sector 14', 'Sector 15', 'Sector 15A', 'Sector 16', 'Sector 17',
    'Sector 18', 'Sector 19', 'Sector 20', 'Sector 21', 'Sector 22',
    'Sector 23', 'Sector 24', 'Sector 25', 'Sector 26', 'Sector 27',
    'Sector 28', 'Sector 29', 'Sector 30', 'Sector 31', 'Sector 32',
    'Sector 33', 'Sector 34', 'Sector 35', 'Sector 36', 'Sector 37',
    'Sector 38', 'Sector 39', 'Sector 40', 'Sector 41', 'Sector 42',
    'Sector 43', 'Sector 44', 'Sector 45', 'Sector 46', 'Sector 47',
    'Sector 48', 'Sector 49', 'Sector 50', 'Sector 51', 'Sector 52',
    'Sector 53', 'Sector 54', 'Sector 55', 'Sector 56', 'Sector 57',
    'Sector 58', 'Sector 59', 'Sector 60', 'Sector 61', 'Sector 62',
    'Sector 63', 'Sector 64', 'Sector 65', 'Sector 66', 'Sector 67',
    'Sector 68', 'Sector 69', 'Sector 70', 'Sector 71', 'Sector 72',
    'Greater Noida West', 'Knowledge Park 1', 'Knowledge Park 2',
    'Knowledge Park 3', 'Knowledge Park 4', 'Knowledge Park 5',
  ],
  Faridabad: [
    'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5',
    'Sector 6', 'Sector 7', 'Sector 8', 'Sector 9', 'Sector 10',
    'Sector 11', 'Sector 12', 'Sector 14', 'Sector 15', 'Sector 16',
    'Sector 17', 'Sector 19', 'Sector 20', 'Sector 21', 'Sector 22',
    'Sector 23', 'Sector 24', 'Sector 25', 'Sector 28', 'Sector 29',
    'Sector 30', 'Sector 31', 'Sector 37',
    'NIT Colony', 'Old Faridabad', 'Ballabgarh',
  ],
  Ghaziabad: [
    'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5',
    'Sector 6', 'Sector 7', 'Sector 8', 'Sector 9', 'Sector 10',
    'Indirapuram', 'Vaishali', 'Kaushambi', 'Raj Nagar Extension',
    'Crossing Republik', 'Mohan Nagar',
  ],
}

export const SECTORS   = CITY_SECTORS.Gurgaon.slice(0, 30)
export const SOCIETIES = [
  'Green Park Residency', 'Shanti Nagar', 'Patel Enclave', 'Sunder Vihar',
  'Vasant Kunj Apartments', 'Adarsh Colony', 'DLF City', 'Hamilton Court',
  'Orchid Petals', 'The Close North', 'Vipul Greens', 'Unitech Harmony',
  'Supertech Czar', 'Tata Primanti', 'Beverly Park I', 'Beverly Park II',
  'Magnolias', 'Belaire', 'Nirvana Courtyard', 'Vatika City',
  'Emaar Palm Drive', 'Tulip Violet', 'M3M Golf Estate', 'Hero Homes',
]

// ── Donors — D-001 format IDs ─────────────────────────────────────────────────
export const donors = [
  {
    id: 'D-001', mobile: '9876543210', name: 'Anjali Sharma', house: 'A-101',
    society: 'Green Park Residency', sector: 'Sector 22', city: 'Gurgaon',
    status: 'Active', lastPickup: '2026-03-10', nextPickup: '2026-04-08',
    totalRST: 2400, totalSKS: 5, createdAt: '2025-06-01',
  },
  {
    id: 'D-002', mobile: '9123456780', name: 'Ramesh Gupta', house: 'B-45',
    society: 'Patel Enclave', sector: 'Sector 5', city: 'Noida',
    status: 'Active', lastPickup: '2026-03-01', nextPickup: '2026-04-02',
    totalRST: 1850, totalSKS: 2, createdAt: '2025-07-15',
  },
  {
    id: 'D-003', mobile: '9988776655', name: 'Sunita Verma', house: 'C-12',
    society: 'Sunder Vihar', sector: 'Sector 10', city: 'Delhi',
    status: 'Postponed', lastPickup: '2026-02-10', nextPickup: '2026-04-15',
    totalRST: 3100, totalSKS: 8, createdAt: '2025-05-20',
  },
  {
    id: 'D-004', mobile: '9012345678', name: 'Vikas Mehra', house: '204',
    society: 'Vasant Kunj Apartments', sector: 'Phase 1', city: 'Delhi',
    status: 'Lost', lastPickup: '2025-12-05', nextPickup: null,
    totalRST: 700, totalSKS: 0, createdAt: '2025-04-10', lostReason: 'Shifted',
  },
  {
    id: 'D-005', mobile: '9345678901', name: 'Pooja Kapoor', house: '3B',
    society: 'Adarsh Colony', sector: 'Sector 44', city: 'Gurgaon',
    status: 'Active', lastPickup: '2026-03-20', nextPickup: '2026-04-18',
    totalRST: 980, totalSKS: 3, createdAt: '2025-09-11',
  },
  {
    id: 'D-006', mobile: '9456789012', name: 'Manoj Singh', house: 'D-77',
    society: 'Shanti Nagar', sector: 'Sector 15', city: 'Gurgaon',
    status: 'Active', lastPickup: '2026-02-28', nextPickup: '2026-03-30',
    totalRST: 4200, totalSKS: 12, createdAt: '2025-03-08',
  },
  {
    id: 'D-007', mobile: '9567890123', name: 'Priya Nair', house: 'F-204',
    society: 'Beverly Park I', sector: 'DLF Phase 2', city: 'Gurgaon',
    status: 'Active', lastPickup: '2025-11-15', nextPickup: '2026-04-09',
    totalRST: 1200, totalSKS: 4, createdAt: '2025-08-20',
  },
  {
    id: 'D-008', mobile: '9678901234', name: 'Rohit Saxena', house: '12A',
    society: 'Magnolias', sector: 'DLF Phase 3', city: 'Gurgaon',
    status: 'Active', lastPickup: '2025-10-20', nextPickup: '2026-04-09',
    totalRST: 560, totalSKS: 1, createdAt: '2025-10-01',
  },
  {
    id: 'D-009', mobile: '9789012345', name: 'Kavita Reddy', house: 'B-302',
    society: 'Tulip Violet', sector: 'Sector 57', city: 'Gurgaon',
    status: 'Active', lastPickup: '2025-09-05', nextPickup: '2026-04-10',
    totalRST: 890, totalSKS: 2, createdAt: '2025-07-12',
  },
  {
    id: 'D-010', mobile: '9890123456', name: 'Suresh Pillai', house: 'G-101',
    society: 'Vatika City', sector: 'Nirvana Country', city: 'Gurgaon',
    status: 'Active', lastPickup: '2025-08-10', nextPickup: '2026-04-12',
    totalRST: 2100, totalSKS: 6, createdAt: '2025-06-15',
  },
]

// ── PickupPartners — K-001 format IDs ────────────────────────────────────────────
export const PickupPartners = [
  {
    id: 'K-001', name: 'Suresh Bhai', mobile: '9765432100',
    email: 'suresh@example.com',
    sectors: ['Sector 22', 'DLF Phase 1'],
    societies: ['Green Park Residency', 'Hamilton Court', 'Beverly Park I'],
    area: 'Sector 22, DLF Phase 1-2, Gurgaon',
    rating: 4.5, totalPickups: 34,
    totalValue: 8900, amountReceived: 7200, pendingAmount: 1700,
    rateChart: {
      'Glass Bottle': 2, 'Glass Other': 1, 'Plastic Bottle / Box': 8,
      'Other Plastic': 5, 'Paper': 13, 'Cardboard Box': 11,
      'Iron': 28, 'E-Waste': 16, 'Wood': 3, 'Others': 5,
    },
    transactions: [
      { date: '2026-03-10', pickupId: 'P-001', donor: 'Anjali Sharma',  value: 250, paid: 250, status: 'Paid' },
      { date: '2026-02-28', pickupId: 'P-003', donor: 'Manoj Singh',    value: 0,   paid: 0,   status: 'Paid' },
      { date: '2026-01-15', pickupId: 'PX-01', donor: 'Ravi Kumar',     value: 320, paid: 320, status: 'Paid' },
      { date: '2025-12-20', pickupId: 'PX-02', donor: 'Sunita Joshi',   value: 180, paid: 0,   status: 'Not Paid' },
    ],
  },
  {
    id: 'K-002', name: 'Raju PickupPartnerh', mobile: '9654321009',
    email: '',
    sectors: ['Sector 5', 'Sector 15'],
    societies: ['Patel Enclave', 'Shanti Nagar'],
    area: 'Noida, Sector 5-20',
    rating: 4.2, totalPickups: 22,
    totalValue: 5400, amountReceived: 4300, pendingAmount: 1100,
    rateChart: {
      'Glass Bottle': 1.5, 'Glass Other': 1, 'Plastic Bottle / Box': 7,
      'Other Plastic': 4, 'Paper': 11, 'Cardboard Box': 9,
      'Iron': 24, 'E-Waste': 14, 'Wood': 2.5, 'Others': 4,
    },
    transactions: [
      { date: '2026-03-01', pickupId: 'P-002', donor: 'Ramesh Gupta', value: 180, paid: 100, status: 'Partially Paid' },
      { date: '2026-02-10', pickupId: 'PX-03', donor: 'Asha Mehta',   value: 210, paid: 210, status: 'Paid' },
    ],
  },
  {
    id: 'K-003', name: 'Pappu Ji', mobile: '9543210098',
    email: '',
    sectors: ['Sector 44', 'Sector 57'],
    societies: ['Adarsh Colony', 'Tulip Violet', 'Vipul Greens'],
    area: 'Gurgaon Sector 44-57, DLF Phase 3-5',
    rating: 3.9, totalPickups: 15,
    totalValue: 3200, amountReceived: 2800, pendingAmount: 400,
    rateChart: {
      'Glass Bottle': 1.5, 'Glass Other': 1, 'Plastic Bottle / Box': 6,
      'Other Plastic': 4, 'Paper': 10, 'Cardboard Box': 8,
      'Iron': 22, 'E-Waste': 13, 'Wood': 2, 'Others': 4,
    },
    transactions: [
      { date: '2026-04-18', pickupId: 'P-005', donor: 'Pooja Kapoor', value: 0,   paid: 0,   status: 'Not Paid' },
      { date: '2026-03-05', pickupId: 'PX-04', donor: 'Deepak Nair',  value: 400, paid: 400, status: 'Paid' },
    ],
  },
]

// ── Pickups — P-001 format IDs ────────────────────────────────────────────────
export const pickups = [
  {
    id: 'P-001', orderId: 'P-001', donorId: 'D-001', donorName: 'Anjali Sharma',
    society: 'Green Park Residency', sector: 'Sector 22', city: 'Gurgaon',
    date: '2026-03-10', status: 'Completed', type: 'RST', pickupMode: 'Individual',
    rstItems: ['Paper', 'Cardboard Box', 'Plastic Bottle / Box'], sksItems: [],
    totalKgs: 12.5, totalValue: 250, amountPaid: 250, paymentStatus: 'Paid',
    PickupPartner: 'Suresh Bhai', pickuppartneradiMobile: '9765432100',
    nextDate: '2026-04-08', notes: '',
  },
  {
    id: 'P-002', orderId: 'P-002', donorId: 'D-002', donorName: 'Ramesh Gupta',
    society: 'Patel Enclave', sector: 'Sector 5', city: 'Noida',
    date: '2026-03-01', status: 'Completed', type: 'RST+SKS', pickupMode: 'Individual',
    rstItems: ['Iron', 'E-Waste'], sksItems: ['Kids Clothes', 'Toys'],
    totalKgs: 8.0, totalValue: 180, amountPaid: 100, paymentStatus: 'Partially Paid',
    PickupPartner: 'Raju PickupPartnerh', pickuppartneradiMobile: '9654321009',
    nextDate: '2026-04-02', notes: '',
  },
  {
    id: 'P-003', orderId: 'P-003', donorId: 'D-006', donorName: 'Manoj Singh',
    society: 'Shanti Nagar', sector: 'Sector 15', city: 'Gurgaon',
    date: '2026-02-28', status: 'Completed', type: 'SKS', pickupMode: 'Drive',
    rstItems: [], sksItems: ['Adult Clothes', 'Adult Shoes', 'Utensils', 'Furniture'],
    totalKgs: 0, totalValue: 0, amountPaid: 0, paymentStatus: 'Paid',
    PickupPartner: 'Suresh Bhai', pickuppartneradiMobile: '9765432100',
    nextDate: '2026-03-30', notes: 'Drive organized by society RWA',
  },
  {
    id: 'P-004', orderId: 'P-004', donorId: 'D-003', donorName: 'Sunita Verma',
    society: 'Sunder Vihar', sector: 'Sector 10', city: 'Delhi',
    date: '2026-04-15', status: 'Postponed', type: 'RST', pickupMode: 'Individual',
    rstItems: ['Paper', 'Glass Bottle'], sksItems: [],
    totalKgs: 0, totalValue: 0, amountPaid: 0, paymentStatus: 'Not Paid',
    PickupPartner: '', pickuppartneradiMobile: '',
    nextDate: '2026-04-15', postponeReason: 'Donor unavailable', notes: '',
  },
  {
    id: 'P-005', orderId: 'P-005', donorId: 'D-005', donorName: 'Pooja Kapoor',
    society: 'Adarsh Colony', sector: 'Sector 44', city: 'Gurgaon',
    date: '2026-04-18', status: 'Pending', type: 'RST', pickupMode: 'Individual',
    rstItems: ['Cardboard Box', 'Plastic Bottle / Box'],
    sksItems: ['Kids Shoes', 'New Stationery'],
    totalKgs: 0, totalValue: 0, amountPaid: 0, paymentStatus: 'Not Paid',
    PickupPartner: 'Pappu Ji', pickuppartneradiMobile: '9543210098',
    nextDate: '2026-04-18', notes: '',
  },
  {
    id: 'P-006', orderId: 'P-006', donorId: 'D-006', donorName: 'Manoj Singh',
    society: 'Shanti Nagar', sector: 'Sector 15', city: 'Gurgaon',
    date: '2026-03-30', status: 'Pending', type: 'RST+SKS', pickupMode: 'Drive',
    rstItems: ['Paper', 'Iron', 'Wood'], sksItems: ['Adult Clothes'],
    totalKgs: 0, totalValue: 0, amountPaid: 0, paymentStatus: 'Not Paid',
    PickupPartner: 'Suresh Bhai', pickuppartneradiMobile: '9765432100',
    nextDate: '2026-03-30', notes: 'Community drive — Shanti Nagar block B',
  },
  {
    id: 'P-007', orderId: 'P-007', donorId: 'D-007', donorName: 'Priya Nair',
    society: 'Beverly Park I', sector: 'DLF Phase 2', city: 'Gurgaon',
    date: '2026-04-09', status: 'Pending', type: 'RST', pickupMode: 'Individual',
    rstItems: [], sksItems: [],
    totalKgs: 0, totalValue: 0, amountPaid: 0, paymentStatus: 'Not Paid',
    PickupPartner: 'Suresh Bhai', pickuppartneradiMobile: '9765432100',
    nextDate: '2026-04-09', notes: '',
  },
]

export const waTemplates = [
  {
    id: 'T-001',
    name: 'Pickup Confirmation',
    trigger: 'After Completed Pickup',
    message: `🙏 Thank you {Donor Name}!\n\nYour Raddi donation has been successfully collected by our team.\n\n♻️ RST Scrap Value: ₹{Amount} (paid by PickupPartner to FreePathshala)\n📅 Next Pickup: {Next Pickup Date}\n\nYour donation helps educate a child for {Days} more days!\n\n— Team FreePathshala`,
  },
  {
    id: 'T-002',
    name: 'Pickup Reminder (26 days)',
    trigger: '26 days after last pickup',
    message: `🌟 Hello {Donor Name}!\n\nTime to collect your Raddi! It's been a while since our last pickup.\n\n📅 Scheduled Pickup: {Pickup Date}\n\nYour Raddi = A child's future 🎓\n\n— Team FreePathshala`,
  },
  {
    id: 'T-003',
    name: 'At Risk Reminder (35 days)',
    trigger: '35 days after last pickup',
    message: `💛 Hi {Donor Name},\n\nWe miss your contributions! It's been 35 days since your last Raddi pickup.\n\n📅 Please schedule at your convenience.\n📞 Call us: 9XXXXXXXXX\n\n— Team FreePathshala`,
  },
  {
    id: 'T-004',
    name: 'Final Reminder (50 days)',
    trigger: '50 days after last pickup',
    message: `❤️ Dear {Donor Name},\n\nThis is our last reminder. 50 days since your last Raddi pickup.\n\nYour support truly matters for the children of FreePathshala.\n\nReach us anytime!\n— Team FreePathshala`,
  },
]

export const getDashboardStats = () => ({
  totalDonors:    donors.length,
  activeDonors:   donors.filter(d => d.status === 'Active').length,
  postponedDonors: donors.filter(d => d.status === 'Postponed').length,
  lostDonors:     donors.filter(d => d.status === 'Lost').length,
  totalPickupsThisMonth: pickups.filter(p => p.status === 'Completed').length,
  totalRSTValue:  pickups.reduce((s, p) => s + (p.totalValue || 0), 0),
  pendingPayments: pickups.filter(p => p.paymentStatus === 'Not Paid' || p.paymentStatus === 'Partially Paid').length,
  upcomingPickups: pickups.filter(p => p.status === 'Pending').length,
  overduePickups: donors.filter(d => {
    if (!d.nextPickup) return false
    return new Date(d.nextPickup) < new Date() && d.status === 'Active'
  }).length,
  drivePickups:      pickups.filter(p => p.pickupMode === 'Drive').length,
  individualPickups: pickups.filter(p => p.pickupMode === 'Individual').length,
})

export const monthlyData = [
  { month: 'Oct', value: 3200, pickups: 18 },
  { month: 'Nov', value: 2900, pickups: 15 },
  { month: 'Dec', value: 4100, pickups: 22 },
  { month: 'Jan', value: 3800, pickups: 20 },
  { month: 'Feb', value: 4600, pickups: 24 },
  { month: 'Mar', value: 5200, pickups: 28 },
]

export const itemBreakdown = [
  { name: 'Paper',     value: 35 },
  { name: 'Cardboard', value: 22 },
  { name: 'Plastic',   value: 18 },
  { name: 'Iron',      value: 12 },
  { name: 'E-Waste',   value: 8 },
  { name: 'Others',    value: 5 },
]

export const locations = {
  Gurgaon: { sectors: GURGAON_SOCIETIES },
}

export const schedulerTimeSlots = [
  '08:00 AM - 10:00 AM', '10:00 AM - 12:00 PM',
  '12:00 PM - 02:00 PM', '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM', '06:00 PM - 08:00 PM',
]

export function getSectorsForCity(city) {
  if (locations[city]?.sectors) return Object.keys(locations[city].sectors)
  return CITY_SECTORS[city] || []
}

export function getSocietiesForSector(city, sector) {
  if (!city || !sector) return []
  if (locations[city]?.sectors?.[sector]) return locations[city].sectors[sector]
  return GURGAON_SOCIETIES[sector] || []
}