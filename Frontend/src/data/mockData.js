// ─── Mock Data for FreePathshala Tool ──────────────────────────────────────
// NOTE: Donors DONATE items (RST waste / SKS goods) to FreePathshala.
//       Donors do NOT receive money. The RST Value is what the Kabadiwala
//       pays FreePathshala for the recyclable scrap items.

export const RST_ITEMS = [
  'Glass Bottle', 'Glass Other', 'Plastic Bottle / Box', 'Other Plastic',
  'Paper', 'Cardboard Box', 'Iron', 'E-Waste', 'Wood', 'Others',
]

export const SKS_ITEMS = [
  'Kids Clothes', 'Kids Shoes', 'Toys', 'Sports Items', 'Adult Clothes',
  'Adult Shoes', 'Utensils', 'Furniture', 'New Stationery', 'Others',
]

export const DONOR_STATUSES = ['Active', 'Postponed', 'Lost']
export const PICKUP_STATUSES = ['Completed', 'Postponed', 'Pending', 'Did Not Open Door']
export const PAYMENT_STATUSES = ['Paid', 'Not Paid', 'Partially Paid']
export const POSTPONE_REASONS = ['Donor unavailable', 'Rescheduled', 'Kabadiwala unavailable', 'Other']
export const LOST_REASONS = ['Not interested', 'Shifted', 'Society restriction', 'No Raddi', 'Other']

// Drive = bulk/community collection; Individual = single household pickup
export const PICKUP_MODES = ['Individual', 'Drive']

export const CITIES = ['Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad']

// Sector lists per city (Gurgaon has the most comprehensive list)
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
    'Sector 58', 'Sector 59', 'Sector 60', 'Sector 61', 'Sector 62',
    'Sector 63', 'Sector 63A', 'Sector 64', 'Sector 65', 'Sector 66',
    'Sector 67', 'Sector 68', 'Sector 69', 'Sector 70', 'Sector 70A',
    'Sector 71', 'Sector 72', 'Sector 72A', 'Sector 73', 'Sector 74',
    'Sector 74A', 'Sector 75', 'Sector 76', 'Sector 77', 'Sector 78',
    'Sector 79', 'Sector 80', 'Sector 81', 'Sector 82', 'Sector 82A',
    'Sector 83', 'Sector 84', 'Sector 85', 'Sector 86', 'Sector 87',
    'Sector 88', 'Sector 88A', 'Sector 88B', 'Sector 89', 'Sector 89A',
    'Sector 89B', 'Sector 90', 'Sector 91', 'Sector 92', 'Sector 93',
    'Sector 95', 'Sector 95A', 'Sector 95B', 'Sector 99', 'Sector 99A',
    'Sector 100', 'Sector 101', 'Sector 102', 'Sector 103', 'Sector 104',
    'Sector 105', 'Sector 106', 'Sector 107', 'Sector 108', 'Sector 109',
    'Sector 110', 'Sector 110A', 'Sector 111', 'Sector 112', 'Sector 113',
    'Sector 114', 'Sector 115',
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

// Legacy flat list (kept for backwards compat)
export const SECTORS = CITY_SECTORS.Gurgaon.slice(0, 30)
export const SOCIETIES = [
  'Green Park Residency', 'Shanti Nagar', 'Patel Enclave', 'Sunder Vihar',
  'Vasant Kunj Apartments', 'Adarsh Colony', 'DLF City', 'Hamilton Court',
  'Orchid Petals', 'The Close', 'Vipul Greens', 'Unitech Harmony',
  'Supertech Czar', 'Tata Primanti',
]

export const donors = [
  {
    id: 'D001', mobile: '9876543210', name: 'Anjali Sharma', house: 'A-101',
    society: 'Green Park Residency', sector: 'Sector 22', city: 'Delhi',
    status: 'Active', lastPickup: '2026-03-10', nextPickup: '2026-04-08',
    // totalRST = total RST scrap value donated by this donor (collected by kabadiwala)
    totalRST: 2400, totalSKS: 5, createdAt: '2025-06-01',
  },
  {
    id: 'D002', mobile: '9123456780', name: 'Ramesh Gupta', house: 'B-45',
    society: 'Patel Enclave', sector: 'Sector 5', city: 'Noida',
    status: 'Active', lastPickup: '2026-03-01', nextPickup: '2026-04-02',
    totalRST: 1850, totalSKS: 2, createdAt: '2025-07-15',
  },
  {
    id: 'D003', mobile: '9988776655', name: 'Sunita Verma', house: 'C-12',
    society: 'Sunder Vihar', sector: 'Sector 10', city: 'Delhi',
    status: 'Postponed', lastPickup: '2026-02-10', nextPickup: '2026-04-15',
    totalRST: 3100, totalSKS: 8, createdAt: '2025-05-20',
  },
  {
    id: 'D004', mobile: '9012345678', name: 'Vikas Mehra', house: '204',
    society: 'Vasant Kunj Apartments', sector: 'Phase 1', city: 'Delhi',
    status: 'Lost', lastPickup: '2025-12-05', nextPickup: null,
    totalRST: 700, totalSKS: 0, createdAt: '2025-04-10', lostReason: 'Shifted',
  },
  {
    id: 'D005', mobile: '9345678901', name: 'Pooja Kapoor', house: '3B',
    society: 'Adarsh Colony', sector: 'Sector 44', city: 'Gurgaon',
    status: 'Active', lastPickup: '2026-03-20', nextPickup: '2026-04-18',
    totalRST: 980, totalSKS: 3, createdAt: '2025-09-11',
  },
  {
    id: 'D006', mobile: '9456789012', name: 'Manoj Singh', house: 'D-77',
    society: 'Shanti Nagar', sector: 'Sector 15', city: 'Noida',
    status: 'Active', lastPickup: '2026-02-28', nextPickup: '2026-03-30',
    totalRST: 4200, totalSKS: 12, createdAt: '2025-03-08',
  },
]

export const kabadiwalas = [
  {
    id: 'K001', name: 'Suresh Bhai', mobile: '9765432100',
    area: 'Sector 22, Delhi', rating: 4.5, totalPickups: 34,
    totalValue: 8900, amountReceived: 7200, pendingAmount: 1700,
    transactions: [
      { date: '2026-03-10', pickupId: 'P001', donor: 'Anjali Sharma', value: 250, paid: 250, status: 'Paid' },
      { date: '2026-02-28', pickupId: 'P003', donor: 'Manoj Singh', value: 0, paid: 0, status: 'Paid' },
      { date: '2026-01-15', pickupId: 'PX01', donor: 'Ravi Kumar', value: 320, paid: 320, status: 'Paid' },
      { date: '2025-12-20', pickupId: 'PX02', donor: 'Sunita Joshi', value: 180, paid: 0, status: 'Not Paid' },
    ],
  },
  {
    id: 'K002', name: 'Raju Kabadiwalah', mobile: '9654321009',
    area: 'Noida, Phase 1', rating: 4.2, totalPickups: 22,
    totalValue: 5400, amountReceived: 4300, pendingAmount: 1100,
    transactions: [
      { date: '2026-03-01', pickupId: 'P002', donor: 'Ramesh Gupta', value: 180, paid: 100, status: 'Partially Paid' },
      { date: '2026-02-10', pickupId: 'PX03', donor: 'Asha Mehta', value: 210, paid: 210, status: 'Paid' },
    ],
  },
  {
    id: 'K003', name: 'Pappu Ji', mobile: '9543210098',
    area: 'Gurgaon, Sector 44', rating: 3.9, totalPickups: 15,
    totalValue: 3200, amountReceived: 2800, pendingAmount: 400,
    transactions: [
      { date: '2026-04-18', pickupId: 'P005', donor: 'Pooja Kapoor', value: 0, paid: 0, status: 'Not Paid' },
      { date: '2026-03-05', pickupId: 'PX04', donor: 'Deepak Nair', value: 400, paid: 400, status: 'Paid' },
    ],
  },
]

export const pickups = [
  {
    id: 'P001', donorId: 'D001', donorName: 'Anjali Sharma', society: 'Green Park Residency',
    sector: 'Sector 22', city: 'Delhi',
    date: '2026-03-10', status: 'Completed', type: 'RST',
    pickupMode: 'Individual',
    rstItems: ['Paper', 'Cardboard Box', 'Plastic Bottle / Box'],
    sksItems: [],
    totalKgs: 12.5,
    // totalValue = RST scrap value paid by kabadiwala to FreePathshala
    totalValue: 250, amountPaid: 250, paymentStatus: 'Paid',
    kabadiwala: 'Suresh Bhai', kabadiMobile: '9765432100',
    nextDate: '2026-04-08',
    notes: '',
  },
  {
    id: 'P002', donorId: 'D002', donorName: 'Ramesh Gupta', society: 'Patel Enclave',
    sector: 'Sector 5', city: 'Noida',
    date: '2026-03-01', status: 'Completed', type: 'RST+SKS',
    pickupMode: 'Individual',
    rstItems: ['Iron', 'E-Waste'],
    sksItems: ['Kids Clothes', 'Toys'],
    totalKgs: 8.0, totalValue: 180, amountPaid: 100, paymentStatus: 'Partially Paid',
    kabadiwala: 'Raju Kabadiwalah', kabadiMobile: '9654321009',
    nextDate: '2026-04-02',
    notes: '',
  },
  {
    id: 'P003', donorId: 'D006', donorName: 'Manoj Singh', society: 'Shanti Nagar',
    sector: 'Sector 15', city: 'Noida',
    date: '2026-02-28', status: 'Completed', type: 'SKS',
    pickupMode: 'Drive',
    rstItems: [],
    sksItems: ['Adult Clothes', 'Adult Shoes', 'Utensils', 'Furniture'],
    totalKgs: 0, totalValue: 0, amountPaid: 0, paymentStatus: 'Paid',
    kabadiwala: 'Suresh Bhai', kabadiMobile: '9765432100',
    nextDate: '2026-03-30',
    notes: 'Drive organized by society RWA',
  },
  {
    id: 'P004', donorId: 'D003', donorName: 'Sunita Verma', society: 'Sunder Vihar',
    sector: 'Sector 10', city: 'Delhi',
    date: '2026-04-15', status: 'Postponed', type: 'RST',
    pickupMode: 'Individual',
    rstItems: ['Paper', 'Glass Bottle'],
    sksItems: [],
    totalKgs: 0, totalValue: 0, amountPaid: 0, paymentStatus: 'Not Paid',
    kabadiwala: '', kabadiMobile: '',
    nextDate: '2026-04-15', postponeReason: 'Donor unavailable',
    notes: '',
  },
  {
    id: 'P005', donorId: 'D005', donorName: 'Pooja Kapoor', society: 'Adarsh Colony',
    sector: 'Sector 44', city: 'Gurgaon',
    date: '2026-04-18', status: 'Pending', type: 'RST',
    pickupMode: 'Individual',
    rstItems: ['Cardboard Box', 'Plastic Bottle / Box'],
    sksItems: ['Kids Shoes', 'New Stationery'],
    totalKgs: 0, totalValue: 0, amountPaid: 0, paymentStatus: 'Not Paid',
    kabadiwala: 'Pappu Ji', kabadiMobile: '9543210098',
    nextDate: '2026-04-18',
    notes: '',
  },
  {
    id: 'P006', donorId: 'D006', donorName: 'Manoj Singh', society: 'Shanti Nagar',
    sector: 'Sector 15', city: 'Noida',
    date: '2026-03-30', status: 'Pending', type: 'RST+SKS',
    pickupMode: 'Drive',
    rstItems: ['Paper', 'Iron', 'Wood'],
    sksItems: ['Adult Clothes'],
    totalKgs: 0, totalValue: 0, amountPaid: 0, paymentStatus: 'Not Paid',
    kabadiwala: 'Suresh Bhai', kabadiMobile: '9765432100',
    nextDate: '2026-03-30',
    notes: 'Community drive — Shanti Nagar block B',
  },
]

export const waTemplates = [
  {
    id: 'T001',
    name: 'Pickup Confirmation',
    trigger: 'After Completed Pickup',
    message: `🙏 Thank you {Donor Name}!\n\nYour Raddi donation has been successfully collected by our team.\n\n♻️ RST Scrap Value: ₹{Amount} (paid by Kabadiwala to FreePathshala)\n📅 Next Pickup: {Next Pickup Date}\n\nYour donation helps educate a child for {Days} more days!\n\n— Team FreePathshala`,
  },
  {
    id: 'T002',
    name: 'Pickup Reminder (26 days)',
    trigger: '26 days after last pickup',
    message: `🌟 Hello {Donor Name}!\n\nTime to collect your Raddi! It's been a while since our last pickup.\n\n📅 Scheduled Pickup: {Pickup Date}\n\nYour Raddi = A child's future 🎓\n\n— Team FreePathshala`,
  },
  {
    id: 'T003',
    name: 'At Risk Reminder (35 days)',
    trigger: '35 days after last pickup',
    message: `💛 Hi {Donor Name},\n\nWe miss your contributions! It's been 35 days since your last Raddi pickup.\n\n📅 Please schedule at your convenience.\n📞 Call us: 9XXXXXXXXX\n\n— Team FreePathshala`,
  },
  {
    id: 'T004',
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
  // totalRSTValue = amount kabadiwala paid FreePathshala for scrap
  totalRSTValue:  pickups.reduce((s, p) => s + (p.totalValue || 0), 0),
  pendingPayments: pickups.filter(p => p.paymentStatus === 'Not Paid' || p.paymentStatus === 'Partially Paid').length,
  upcomingPickups: pickups.filter(p => p.status === 'Pending').length,
  overduePickups:  donors.filter(d => {
    if (!d.nextPickup) return false
    return new Date(d.nextPickup) < new Date() && d.status === 'Active'
  }).length,
  drivePickups: pickups.filter(p => p.pickupMode === 'Drive').length,
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
  { name: 'Paper', value: 35 },
  { name: 'Cardboard', value: 22 },
  { name: 'Plastic', value: 18 },
  { name: 'Iron', value: 12 },
  { name: 'E-Waste', value: 8 },
  { name: 'Others', value: 5 },
]