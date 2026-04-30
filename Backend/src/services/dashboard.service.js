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

function monthSortKey(dateValue) {
  if (!dateValue) return null;
  const str = String(dateValue).slice(0, 7);
  return str.length >= 7 ? str : null;
}

function buildMonthlyRSTChart(completedPickups) {
  const map = {};
  completedPickups.forEach((pickup) => {
    const key = monthSortKey(pickup.date);
    if (!key) return;
    const label = monthKey(pickup.date);
    if (!map[key]) map[key] = { month: label, value: 0, pickups: 0 };
    map[key].value += Number(pickup.totalValue) || 0;
    map[key].pickups += 1;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
    .slice(-7);
}

function buildMonthlySKSChart(completedPickups) {
  const map = {};
  completedPickups
    .filter((p) => (p.sksItems || []).length > 0)
    .forEach((pickup) => {
      const key = monthSortKey(pickup.date);
      if (!key) return;
      const label = monthKey(pickup.date);
      if (!map[key]) map[key] = { month: label, items: 0, pickups: 0 };
      map[key].items += (pickup.sksItems || []).length;
      map[key].pickups += 1;
    });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
    .slice(-7);
}

function buildRSTBreakdown(raddiRecords, completedPickups) {
  const map = {};
  raddiRecords.forEach((r) => {
    const itemKgMap = r.itemKgMap || {};
    Object.entries(itemKgMap).forEach(([item, kg]) => {
      if (kg > 0) map[item] = (map[item] || 0) + kg;
    });
    (r.rstOthers || []).forEach((o) => {
      if (o.name && o.amount > 0) map["Others"] = (map["Others"] || 0) + (parseFloat(o.weight) || 0);
    });
  });
  // Fallback: count from pickups if no kg data
  if (Object.keys(map).length === 0) {
    completedPickups.forEach((p) => {
      (p.rstItems || []).forEach((item) => { map[item] = (map[item] || 0) + 1; });
    });
  }
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  return Object.entries(map)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      pct: total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0
    }));
}

function buildSKSBreakdown(completedPickups) {
  const map = {};
  completedPickups.forEach((p) => {
    (p.sksItems || []).forEach((item) => {
      const key = item.startsWith("Others") ? "Others" : item;
      map[key] = (map[key] || 0) + 1;
    });
  });
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  return Object.entries(map)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name,
      value,
      pct: total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0
    }));
}

function buildRSTFinancialSummary(raddiRecords) {
  const totalRevenue = raddiRecords.reduce((s, r) => s + (r.totalAmount || 0), 0);
  const totalReceived = raddiRecords
    .filter((r) => r.paymentStatus === "Received")
    .reduce((s, r) => s + (r.totalAmount || 0), 0);
  const totalPending = raddiRecords
    .filter((r) => r.paymentStatus === "Yet to Receive")
    .reduce((s, r) => s + (r.totalAmount || 0), 0);

  // Partner breakdown
  const partnerMap = {};
  raddiRecords.forEach((r) => {
    const n = r.PickupPartnerName || "Unassigned";
    if (!partnerMap[n]) partnerMap[n] = { name: n, total: 0, received: 0, pending: 0 };
    partnerMap[n].total += r.totalAmount || 0;
    if (r.paymentStatus === "Received") partnerMap[n].received += r.totalAmount || 0;
    if (r.paymentStatus === "Yet to Receive") partnerMap[n].pending += r.totalAmount || 0;
  });
  const partnerBreakdown = Object.values(partnerMap).sort((a, b) => b.pending - a.pending);

  return {
    totalRevenue,
    totalReceived,
    totalPending,
    collectionPct: totalRevenue > 0 ? Math.round((totalReceived / totalRevenue) * 100) : 0,
    partnerBreakdown
  };
}

function buildSKSDispatchSummary(sksOutflows) {
  const totalDispatched = sksOutflows.reduce((s, r) => s + (r.items || []).reduce((a, it) => a + (it.qty || 0), 0), 0);
  const totalReceived = sksOutflows.reduce((s, r) => s + (Number(r.payment?.amount) || 0), 0);
  const totalValue = sksOutflows.reduce((s, r) => s + (Number(r.payment?.totalValue) || 0), 0);
  const paidCount = sksOutflows.filter((r) => r.payment?.status === "Paid").length;

  const recipientMap = {};
  sksOutflows.forEach((r) => {
    const n = r.partnerName || "Unknown";
    if (!recipientMap[n]) recipientMap[n] = { name: n, items: 0, received: 0 };
    recipientMap[n].items += (r.items || []).reduce((a, it) => a + (it.qty || 0), 0);
    recipientMap[n].received += Number(r.payment?.amount) || 0;
  });

  return {
    totalDispatched,
    totalReceived,
    totalValue,
    paidCount,
    dispatches: sksOutflows.length,
    collectionPct: totalValue > 0 ? Math.round((totalReceived / totalValue) * 100) : 0,
    recipientBreakdown: Object.values(recipientMap).sort((a, b) => b.items - a.items).slice(0, 5)
  };
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

  return {
    stats: {
      totalDonors: donors.length,
      activeDonors: donors.filter((donor) => donor.status === "Active").length,
      postponedDonors: donors.filter((donor) => donor.status === "Postponed").length,
      lostDonors: donors.filter((donor) => donor.status === "Lost").length,
      pickupDueDonors: donors.filter((donor) => donor.status === "Pickup Due").length,
      atRiskDonors: donors.filter((donor) => donor.status === "At Risk").length,
      churnedDonors: donors.filter((donor) => donor.status === "Churned").length,
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
    // Pre-computed chart data — frontend should use these directly
    monthlyRSTChart: buildMonthlyRSTChart(completedPickups),
    monthlySKSChart: buildMonthlySKSChart(completedPickups),
    rstBreakdown: buildRSTBreakdown(raddiRecords, completedPickups),
    sksBreakdown: buildSKSBreakdown(completedPickups),
    rstFinancialSummary: buildRSTFinancialSummary(raddiRecords),
    sksDispatchSummary: buildSKSDispatchSummary(sksOutflows),
    // Legacy fields
    monthlyData: buildMonthlyRSTChart(completedPickups),
    itemBreakdown: buildRSTBreakdown(raddiRecords, completedPickups),
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
