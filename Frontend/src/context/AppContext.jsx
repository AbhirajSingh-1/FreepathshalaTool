/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as api from "../services/api";
import { useRole } from "./RoleContext";

const AppContext = createContext(null);

const EMPTY_DASHBOARD = {
  totalDonors: 0,
  activeDonors: 0,
  postponedDonors: 0,
  lostDonors: 0,
  totalPickupsCompleted: 0,
  totalPickupsThisMonth: 0,
  totalRSTValue: 0,
  pendingPayments: 0,
  upcomingPickups: 0,
  overduePickups: 0,
  drivePickups: 0,
  individualPickups: 0,
  totalRaddiKg: 0,
  totalRevenue: 0,
  amountReceived: 0,
  pendingFromPickupPartners: 0,
  totalSKSItems: 0,
  totalSKSPickups: 0,
};

const EMPTY_SCHEDULER = { overdue: [], scheduled: [], atRisk: [], churned: [] };
const EMPTY_MASTER = {
  RST_ITEMS: [],
  SKS_ITEMS: [],
  rstItemsFull: [],
  sksItemsFull: [],
  PICKUP_MODES: [],
  DONOR_STATUSES: [],
  PICKUP_STATUSES: [],
  PAYMENT_STATUSES: [],
  POSTPONE_REASONS: [],
  LOST_REASONS: [],
};
const EMPTY_LOCATIONS = {
  cities: [],
  sectors: [],
  societies: [],
  citySectors: {},
  sectorSocieties: {},
};
const EMPTY_DASHBOARD_PAYLOAD = {
  stats: EMPTY_DASHBOARD,
  monthlyData: [],
  itemBreakdown: [],
  monthlyRSTChart: [],
  monthlySKSChart: [],
  rstBreakdown: [],
  sksBreakdown: [],
  rstFinancialSummary: {
    totalRevenue: 0,
    totalReceived: 0,
    totalPending: 0,
    collectionPct: 0,
    partnerBreakdown: [],
  },
  sksDispatchSummary: {
    totalDispatched: 0,
    totalReceived: 0,
    totalValue: 0,
    dispatches: 0,
    collectionPct: 0,
    recipientBreakdown: [],
  },
};

const CORE_LIMITS = {
  donors: 500,
  pickups: 500,
  partners: 200,
  sks: 500,
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

function names(list = []) {
  return list.map(item => (typeof item === "string" ? item : item.name)).filter(Boolean);
}

function upsertById(list = [], item) {
  if (!item?.id) return list;
  return [item, ...list.filter(existing => existing.id !== item.id)];
}

function updateById(list = [], id, item) {
  if (!id || !item) return list;
  return list.some(existing => existing.id === id)
    ? list.map(existing => (existing.id === id ? item : existing))
    : upsertById(list, item);
}

function removeById(list = [], id) {
  return list.filter(item => item.id !== id);
}

function limitList(list = [], limit = 500) {
  return list.slice(0, limit);
}

function toNumber(value) {
  return Number(value) || 0;
}

function updateStock(stock = [], items = [], direction = 1) {
  const map = new Map(stock.map(item => [item.name, toNumber(item.qty)]));
  items.forEach(item => {
    if (!item?.name) return;
    const nextQty = (map.get(item.name) || 0) + direction * toNumber(item.qty);
    if (nextQty === 0) map.delete(item.name);
    else map.set(item.name, nextQty);
  });

  return Array.from(map.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function patchDonorAfterCompletedPickup(donor, pickup) {
  if (!donor || pickup.status !== "Completed") return donor;
  return {
    ...donor,
    lastPickup: pickup.date || donor.lastPickup,
    nextPickup: pickup.nextDate || donor.nextPickup || null,
    totalRST: toNumber(donor.totalRST) + toNumber(pickup.totalValue),
    totalSKS: toNumber(donor.totalSKS) + ((pickup.sksItems || []).length ? 1 : 0),
    status: "Active",
  };
}

function patchPartnerAfterCompletedPickup(partner, pickup) {
  if (!partner || pickup.status !== "Completed") return partner;
  const pending = Math.max(0, toNumber(pickup.totalValue) - toNumber(pickup.amountPaid));
  return {
    ...partner,
    totalPickups: toNumber(partner.totalPickups) + 1,
    totalValue: toNumber(partner.totalValue) + toNumber(pickup.totalValue),
    amountReceived: toNumber(partner.amountReceived) + toNumber(pickup.amountPaid),
    pendingAmount: toNumber(partner.pendingAmount) + pending,
  };
}

export function AppProvider({ children }) {
  const { role } = useRole();
  const locationRefreshTimer = useRef(null);

  const [donors, setDonors] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [PickupPartners, setPickupPartners] = useState([]);
  const [sksInflows, setSksInflows] = useState([]);
  const [sksOutflows, setSksOutflows] = useState([]);
  const [sksStock, setSksStock] = useState([]);

  const [dashboardPayload, setDashboardPayload] = useState(EMPTY_DASHBOARD_PAYLOAD);
  const [schedulerTabData, setSchedulerTabData] = useState(EMPTY_SCHEDULER);

  const [masterData, setMasterData] = useState(EMPTY_MASTER);
  const [locations, setLocations] = useState(EMPTY_LOCATIONS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardStats = useCallback((filters = {}, options) => (
    api.fetchDashboardStats({ limit: 2000, ...filters }, options)
  ), []);

  const refreshCoreData = useCallback(async ({ force = false } = {}) => {
    const safe = result => (result.status === "fulfilled" ? result.value : null);
    const canReadReports = role === "admin" || role === "manager";
    const requestOptions = { force };

    const results = await Promise.allSettled([
      api.fetchDonors({ limit: CORE_LIMITS.donors }, requestOptions),
      api.fetchPickups({ limit: CORE_LIMITS.pickups }, requestOptions),
      api.fetchPickupPartners({ limit: CORE_LIMITS.partners }, requestOptions),
      api.fetchSksInflows({ limit: CORE_LIMITS.sks }, requestOptions),
      api.fetchSksOutflows({ limit: CORE_LIMITS.sks }, requestOptions),
      api.fetchSksStock(requestOptions),
      api.fetchMasterData(requestOptions),
      api.fetchLocations(requestOptions),
      canReadReports
        ? api.fetchDashboardStats({ limit: 2000 }, requestOptions)
        : Promise.resolve(null),
      canReadReports
        ? api.fetchSchedulerSummary(requestOptions)
        : Promise.resolve(null),
    ]);

    const [
      donorsData,
      pickupsData,
      partnersData,
      inflowsData,
      outflowsData,
      stockData,
      master,
      locationTree,
      dashboardData,
      schedulerSummary,
    ] = results.map(safe);

    setDonors(donorsData || []);
    setPickups(pickupsData || []);
    setPickupPartners(partnersData || []);
    setSksInflows(inflowsData || []);
    setSksOutflows(outflowsData || []);
    setSksStock(stockData || []);
    setMasterData({ ...EMPTY_MASTER, ...(master || {}) });
    setLocations({ ...EMPTY_LOCATIONS, ...(locationTree || {}) });

    if (dashboardData) {
      setDashboardPayload({ ...EMPTY_DASHBOARD_PAYLOAD, ...dashboardData });
    }
    if (schedulerSummary) {
      setSchedulerTabData(schedulerSummary);
    }
  }, [role]);

  const refetchAll = useCallback(async (options = {}) => {
    const force = options?.force === true;
    setError("");
    setLoading(true);
    try {
      await refreshCoreData({ force });
    } catch (err) {
      setError(err.message || "Unable to load data");
    } finally {
      setLoading(false);
    }
  }, [refreshCoreData]);

  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  useEffect(() => () => {
    if (locationRefreshTimer.current) clearTimeout(locationRefreshTimer.current);
  }, []);

  const runMutation = useCallback(async (operation) => {
    setSaving(true);
    setError("");
    try {
      return await operation();
    } catch (err) {
      setError(err.message || "Request failed");
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const refreshLocationsQuietly = useCallback(() => {
    clearTimeout(locationRefreshTimer.current);
    locationRefreshTimer.current = setTimeout(async () => {
      try {
        const locationTree = await api.fetchLocations({ force: true });
        setLocations({ ...EMPTY_LOCATIONS, ...(locationTree || {}) });
      } catch {
        // Location lookups are supportive data; primary mutations should remain successful.
      }
    }, 500);
  }, []);

  const applyCompletedPickupLocally = useCallback((pickup, previousPickup = null) => {
    if (pickup.status !== "Completed" || previousPickup?.status === "Completed") return;

    setDonors(prev => prev.map(donor => (
      donor.id === pickup.donorId ? patchDonorAfterCompletedPickup(donor, pickup) : donor
    )));
    setPickupPartners(prev => prev.map(partner => {
      const matchesPartner = partner.id === pickup.partnerId || partner.name === pickup.PickupPartner;
      return matchesPartner ? patchPartnerAfterCompletedPickup(partner, pickup) : partner;
    }));
  }, []);

  const fetchFilteredDonors = useCallback(
    (params, options) => api.fetchDonors(params, options),
    []
  );

  const fetchFilteredPickups = useCallback(
    (params, options) => api.fetchPickups(params, options),
    []
  );

  const fetchPartnerSummary = useCallback(
    (params, options) => api.fetchPartnerSummary(params, options),
    []
  );

  const fetchFilteredRaddiRecords = useCallback(
    (params, options) => api.fetchRaddiRecords(params, options),
    []
  );

  const addDonor = useCallback(data => runMutation(async () => {
    const created = await api.createDonor(data);
    setDonors(prev => limitList(upsertById(prev, created), CORE_LIMITS.donors));
    refreshLocationsQuietly();
    return created;
  }), [runMutation, refreshLocationsQuietly]);

  const updateDonor = useCallback((id, data) => runMutation(async () => {
    const updated = await api.updateDonor(id, data);
    setDonors(prev => updateById(prev, id, updated));
    refreshLocationsQuietly();
    return updated;
  }), [runMutation, refreshLocationsQuietly]);

  const deleteDonor = useCallback(id => runMutation(async () => {
    const removed = await api.deleteDonor(id);
    setDonors(prev => removeById(prev, id));
    return removed;
  }), [runMutation]);

  const createPickup = useCallback(data => runMutation(async () => {
    const created = await api.createPickup(data);
    setPickups(prev => limitList(upsertById(prev, created), CORE_LIMITS.pickups));
    applyCompletedPickupLocally(created);
    refreshLocationsQuietly();
    return created;
  }), [runMutation, applyCompletedPickupLocally, refreshLocationsQuietly]);

  const schedulePickup = useCallback(data => createPickup({ ...data, status: "Pending" }), [createPickup]);

  const recordPickup = useCallback((id, data) => runMutation(async () => {
    const previousPickup = pickups.find(pickup => pickup.id === id);
    const recorded = await api.recordPickup(id, data);
    setPickups(prev => updateById(prev, id, recorded));
    applyCompletedPickupLocally(recorded, previousPickup);
    return recorded;
  }), [runMutation, applyCompletedPickupLocally, pickups]);

  const updatePickup = useCallback((id, data) => runMutation(async () => {
    const previousPickup = pickups.find(pickup => pickup.id === id);
    const updated = await api.updatePickup(id, data);
    setPickups(prev => updateById(prev, id, updated));
    applyCompletedPickupLocally(updated, previousPickup);
    refreshLocationsQuietly();
    return updated;
  }), [runMutation, applyCompletedPickupLocally, refreshLocationsQuietly, pickups]);

  const deletePickup = useCallback(id => runMutation(async () => {
    const removed = await api.deletePickup(id);
    setPickups(prev => removeById(prev, id));
    return removed;
  }), [runMutation]);

  const addPickupPartner = useCallback(data => runMutation(async () => {
    const created = await api.createPickupPartner(data);
    setPickupPartners(prev => limitList(upsertById(prev, created), CORE_LIMITS.partners));
    refreshLocationsQuietly();
    return created;
  }), [runMutation, refreshLocationsQuietly]);

  const updatePickupPartner = useCallback((id, data) => runMutation(async () => {
    const updated = await api.updatePickupPartner(id, data);
    setPickupPartners(prev => updateById(prev, id, updated));
    refreshLocationsQuietly();
    return updated;
  }), [runMutation, refreshLocationsQuietly]);

  const deletePickupPartner = useCallback(id => runMutation(async () => {
    const removed = await api.deletePickupPartner(id);
    setPickupPartners(prev => removeById(prev, id));
    return removed;
  }), [runMutation]);

  const recordPickupPartnerPayment = useCallback(
    (partnerId, data) => runMutation(() => api.recordPickupPartnerPayment(partnerId, data)),
    [runMutation]
  );

  const clearPartnerBalance = useCallback(
    ({ pickuppartnerId }, paymentInfo) => runMutation(() => api.clearPartnerBalance(pickuppartnerId, paymentInfo)),
    [runMutation]
  );

  const addSksInflow = useCallback(data => runMutation(async () => {
    const created = await api.createSksInflow(data);
    setSksInflows(prev => limitList(upsertById(prev, created), CORE_LIMITS.sks));
    setSksStock(prev => updateStock(prev, created.items, 1));
    return created;
  }), [runMutation]);

  const addSksOutflow = useCallback(data => runMutation(async () => {
    const created = await api.createSksOutflow(data);
    setSksOutflows(prev => limitList(upsertById(prev, created), CORE_LIMITS.sks));
    setSksStock(prev => updateStock(prev, created.items, -1));
    return created;
  }), [runMutation]);

  const deleteSksInflow = useCallback(id => runMutation(async () => {
    const existing = sksInflows.find(entry => entry.id === id);
    const removed = await api.deleteSksInflow(id);
    setSksInflows(prev => removeById(prev, id));
    if (existing) setSksStock(stock => updateStock(stock, existing.items, -1));
    return removed;
  }), [runMutation, sksInflows]);

  const deleteSksOutflow = useCallback(id => runMutation(async () => {
    const existing = sksOutflows.find(entry => entry.id === id);
    const removed = await api.deleteSksOutflow(id);
    setSksOutflows(prev => removeById(prev, id));
    if (existing) setSksStock(stock => updateStock(stock, existing.items, 1));
    return removed;
  }), [runMutation, sksOutflows]);

  const CITIES = useMemo(() => names(locations.cities), [locations.cities]);
  const CITY_SECTORS = useMemo(() => locations.citySectors || {}, [locations.citySectors]);
  const GURGAON_SOCIETIES = useMemo(() => {
    const grouped = {};
    Object.entries(locations.sectorSocieties || {}).forEach(([key, socs]) => {
      const [, sector] = key.split("::");
      if (sector) grouped[sector] = socs;
    });
    return grouped;
  }, [locations.sectorSocieties]);

  const value = useMemo(() => ({
    donors,
    pickups,
    PickupPartners,
    partners: PickupPartners,
    sksInflows,
    sksOutflows,
    sksStock,

    dashboardStats: dashboardPayload.stats || EMPTY_DASHBOARD,
    monthlyData: dashboardPayload.monthlyData || [],
    itemBreakdown: dashboardPayload.itemBreakdown || [],
    monthlyRSTChart: dashboardPayload.monthlyRSTChart || [],
    monthlySKSChart: dashboardPayload.monthlySKSChart || [],
    rstBreakdown: dashboardPayload.rstBreakdown || [],
    sksBreakdown: dashboardPayload.sksBreakdown || [],
    rstFinancialSummary: dashboardPayload.rstFinancialSummary || {},
    sksDispatchSummary: dashboardPayload.sksDispatchSummary || {},
    schedulerTabData,

    masterData,
    locations,
    CITIES,
    CITY_SECTORS,
    GURGAON_SOCIETIES,
    RST_ITEMS: masterData.RST_ITEMS || [],
    SKS_ITEMS: masterData.SKS_ITEMS || [],
    PICKUP_MODES: masterData.PICKUP_MODES || [],
    DONOR_STATUSES: masterData.DONOR_STATUSES || [],
    PICKUP_STATUSES: masterData.PICKUP_STATUSES || [],
    PAYMENT_STATUSES: masterData.PAYMENT_STATUSES || [],
    POSTPONE_REASONS: masterData.POSTPONE_REASONS || [],
    LOST_REASONS: masterData.LOST_REASONS || [],

    loading,
    saving,
    error,

    refetchAll,
    fetchDashboardStats,
    fetchFilteredDonors,
    fetchFilteredPickups,
    fetchPartnerSummary,
    fetchFilteredRaddiRecords,

    addDonor,
    updateDonor,
    deleteDonor,

    createPickup,
    schedulePickup,
    recordPickup,
    updatePickup,
    deletePickup,

    addPickupPartner,
    updatePickupPartner,
    deletePickupPartner,
    addPartner: addPickupPartner,
    updatePartner: updatePickupPartner,
    deletePartner: deletePickupPartner,

    recordPickupPartnerPayment,
    clearPartnerBalance,

    addSksInflow,
    addSksOutflow,
    deleteSksInflow,
    deleteSksOutflow,
  }), [
    donors,
    pickups,
    PickupPartners,
    sksInflows,
    sksOutflows,
    sksStock,
    dashboardPayload,
    schedulerTabData,
    masterData,
    locations,
    CITIES,
    CITY_SECTORS,
    GURGAON_SOCIETIES,
    loading,
    saving,
    error,
    refetchAll,
    fetchDashboardStats,
    fetchFilteredDonors,
    fetchFilteredPickups,
    fetchPartnerSummary,
    fetchFilteredRaddiRecords,
    addDonor,
    updateDonor,
    deleteDonor,
    createPickup,
    schedulePickup,
    recordPickup,
    updatePickup,
    deletePickup,
    addPickupPartner,
    updatePickupPartner,
    deletePickupPartner,
    recordPickupPartnerPayment,
    clearPartnerBalance,
    addSksInflow,
    addSksOutflow,
    deleteSksInflow,
    deleteSksOutflow,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
