const { listDonors } = require("./donor.service");
const { listPickups, listRaddiRecords } = require("./pickup.service");
const { listPickupPartners } = require("./pickupPartner.service");
const { listInflows, listOutflows, getStock } = require("./sks.service");

function monthKey(dateValue) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", { month: "short" });
}

async function getStats(filters = {}) {
  const [donors, pickups, partners, raddiRecords, sksInflows, sksOutflows, stock] = await Promise.all([
    listDonors({ limit: 500, ...filters }),
    listPickups({ limit: 500, ...filters }),
    listPickupPartners({ limit: 500 }),
    listRaddiRecords({ limit: 500, ...filters }),
    listInflows({ limit: 500, ...filters }),
    listOutflows({ limit: 500, ...filters }),
    getStock()
  ]);

  const completedPickups = pickups.filter((pickup) => pickup.status === "Completed");
  const pendingPayments = pickups.filter((pickup) => ["Not Paid", "Partially Paid"].includes(pickup.paymentStatus));
  const upcomingPickups = pickups.filter((pickup) => pickup.status === "Pending");
  const now = new Date();
  const overduePickups = donors.filter((donor) => donor.nextPickup && new Date(donor.nextPickup) < now && donor.status === "Active");

  const monthlyMap = new Map();
  completedPickups.forEach((pickup) => {
    const key = monthKey(pickup.date);
    if (!key) return;
    const current = monthlyMap.get(key) || { month: key, value: 0, pickups: 0 };
    current.value += Number(pickup.totalValue) || 0;
    current.pickups += 1;
    monthlyMap.set(key, current);
  });

  const itemMap = new Map();
  raddiRecords.forEach((record) => {
    (record.rstItems || []).forEach((item) => {
      itemMap.set(item, (itemMap.get(item) || 0) + 1);
    });
  });

  return {
    stats: {
      totalDonors: donors.length,
      activeDonors: donors.filter((donor) => donor.status === "Active").length,
      postponedDonors: donors.filter((donor) => donor.status === "Postponed").length,
      lostDonors: donors.filter((donor) => donor.status === "Lost").length,
      totalPickupsCompleted: completedPickups.length,
      totalPickupsThisMonth: completedPickups.length,
      totalRSTValue: pickups.reduce((sum, pickup) => sum + (Number(pickup.totalValue) || 0), 0),
      pendingPayments: pendingPayments.length,
      upcomingPickups: upcomingPickups.length,
      overduePickups: overduePickups.length,
      drivePickups: pickups.filter((pickup) => pickup.pickupMode === "Drive").length,
      individualPickups: pickups.filter((pickup) => pickup.pickupMode === "Individual").length,
      totalRaddiKg: raddiRecords.reduce((sum, record) => sum + (Number(record.totalKg) || 0), 0),
      totalRevenue: raddiRecords.reduce((sum, record) => sum + (Number(record.totalAmount) || 0), 0),
      amountReceived: partners.reduce((sum, partner) => sum + (Number(partner.amountReceived) || 0), 0),
      pendingFromPickupPartners: partners.reduce((sum, partner) => sum + (Number(partner.pendingAmount) || 0), 0),
      sksInflowCount: sksInflows.length,
      sksOutflowCount: sksOutflows.length,
      sksStockItems: stock.length
    },
    monthlyData: Array.from(monthlyMap.values()),
    itemBreakdown: Array.from(itemMap.entries()).map(([name, value]) => ({ name, value })),
    stock
  };
}

async function getSchedulerSummary() {
  const [donors, pickups] = await Promise.all([
    listDonors({ limit: 500 }),
    listPickups({ limit: 500 })
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  const overdue = [];
  const scheduled = [];
  const atRisk = [];
  const churned = [];

  pickups.forEach((pickup) => {
    if (pickup.status !== "Pending") return;
    const entry = {
      id: pickup.id,
      orderId: pickup.orderId || pickup.id,
      donorId: pickup.donorId,
      donorName: pickup.donorName || "",
      mobile: pickup.mobile || "",
      society: pickup.society || "",
      sector: pickup.sector || "",
      city: pickup.city || "",
      scheduledDate: pickup.date || "",
      timeSlot: pickup.timeSlot || "",
      notes: pickup.notes || "",
      pickupMode: pickup.pickupMode || "Individual"
    };

    if (pickup.date && pickup.date < today) {
      overdue.push({
        ...entry,
        daysOverdue: Math.floor((now - new Date(`${pickup.date}T00:00:00`)) / 86400000)
      });
    } else {
      scheduled.push(entry);
    }
  });

  donors.forEach((donor) => {
    if (donor.status === "Lost" || !donor.lastPickup) return;
    if (pickups.some((pickup) => pickup.donorId === donor.id && pickup.status === "Pending")) return;

    const days = Math.floor((now - new Date(donor.lastPickup)) / 86400000);
    const base = {
      id: `TAB-${donor.id}`,
      donorId: donor.id,
      donorName: donor.name,
      mobile: donor.mobile || "",
      society: donor.society || "",
      sector: donor.sector || "",
      city: donor.city || "",
      lastPickup: donor.lastPickup
    };

    if (days > 60) churned.push({ ...base, daysSincePickup: days, reason: donor.lostReason || "Inactive > 60 days" });
    else if (days > 30) atRisk.push({ ...base, daysSincePickup: days, missedCount: Math.floor(days / 30) });
  });

  return { overdue, scheduled, atRisk, churned };
}

module.exports = {
  getStats,
  getSchedulerSummary
};
