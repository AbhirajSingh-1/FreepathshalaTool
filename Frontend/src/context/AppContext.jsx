import {
  createContext, useContext, useState,
  useCallback, useMemo, useEffect,
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
  stats:               EMPTY_DASHBOARD,
  monthlyData:         [],
  itemBreakdown:       [],
  monthlyRSTChart:     [],
  monthlySKSChart:     [],
  rstBreakdown:        [],
  sksBreakdown:        [],
  rstFinancialSummary: { totalRevenue: 0, totalReceived: 0, totalPending: 0, collectionPct: 0, partnerBreakdown: [] },
  sksDispatchSummary:  { totalDispatched: 0, totalReceived: 0, totalValue: 0, dispatches: 0, collectionPct: 0, recipientBreakdown: [] },
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

function names(list = []) {
  return list.map((item) => (typeof item === "string" ? item : item.name)).filter(Boolean);
}

export function AppProvider({ children }) {
  const { role } = useRole();

  // Core collections
  const [donors,         setDonors]         = useState([]);
  const [pickups,        setPickups]         = useState([]);
  const [PickupPartners, setPickupPartners]  = useState([]);
  const [raddiRecords,   setRaddiRecords]    = useState([]);
  const [sksInflows,     setSksInflows]      = useState([]);
  const [sksOutflows,    setSksOutflows]     = useState([]);
  const [sksStock,       setSksStock]        = useState([]);

  // Dashboard (no-filter, initial load)
  const [dashboardPayload,    setDashboardPayload]    = useState(EMPTY_DASHBOARD_PAYLOAD);
  const [schedulerTabData,    setSchedulerTabData]    = useState(EMPTY_SCHEDULER);

  // Master / lookup
  const [masterData, setMasterData] = useState(EMPTY_MASTER);
  const [locations,  setLocations]  = useState(EMPTY_LOCATIONS);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  // ── fetchDashboardStats ─────────────────────────────────────────────────────
  // Exported so Dashboard page can call it directly with filter params.
  const fetchDashboardStats = useCallback(async (filters = {}) => {
    const data = await api.fetchDashboardStats({ limit: 2000, ...filters });
    return data;
  }, []);

  // ── refreshCoreData ─────────────────────────────────────────────────────────
  const refreshCoreData = useCallback(async () => {
    const safe = (p) => (p.status === "fulfilled" ? p.value : null);
    const canReadReports = role === "admin" || role === "manager";

    const results = await Promise.allSettled([
      api.fetchDonors({ limit: 2000 }),
      api.fetchPickups({ limit: 2000 }),
      api.fetchPickupPartners({ limit: 500 }),
      api.fetchRaddiRecords({ limit: 2000 }),
      api.fetchSksInflows({ limit: 1000 }),
      api.fetchSksOutflows({ limit: 1000 }),
      api.fetchSksStock(),
      api.fetchMasterData(),
      api.fetchLocations(),
      canReadReports ? api.fetchDashboardStats({ limit: 2000 }) : Promise.resolve(null),
      canReadReports ? api.fetchSchedulerSummary()              : Promise.resolve(null),
    ]);

    const [
      donorsData, pickupsData, partnersData, raddiData,
      inflowsData, outflowsData, stockData,
      master, locationTree,
      dashboardData, schedulerSummary,
    ] = results.map(safe);

    setDonors(donorsData       || []);
    setPickups(pickupsData      || []);
    setPickupPartners(partnersData  || []);
    setRaddiRecords(raddiData    || []);
    setSksInflows(inflowsData   || []);
    setSksOutflows(outflowsData  || []);
    setSksStock(stockData      || []);
    setMasterData({ ...EMPTY_MASTER,    ...(master       || {}) });
    setLocations({ ...EMPTY_LOCATIONS, ...(locationTree  || {}) });

    if (dashboardData) {
      setDashboardPayload({ ...EMPTY_DASHBOARD_PAYLOAD, ...dashboardData });
    }
    if (schedulerSummary) {
      setSchedulerTabData(schedulerSummary);
    }
  }, [role]);

  // ── refetchAll ──────────────────────────────────────────────────────────────
  const refetchAll = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      await refreshCoreData();
    } catch (err) {
      setError(err.message || "Unable to load data");
    } finally {
      setLoading(false);
    }
  }, [refreshCoreData]);

  useEffect(() => { refetchAll(); }, [refetchAll]);

  // ── runMutation ─────────────────────────────────────────────────────────────
  // Wraps any write operation and always triggers a full data refresh afterwards.
  const runMutation = useCallback(async (operation, skipRefresh = false) => {
    setSaving(true);
    setError("");
    try {
      const result = await operation();
      if (!skipRefresh) await refreshCoreData();
      return result;
    } catch (err) {
      setError(err.message || "Request failed");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [refreshCoreData]);

  // ── Donor mutations ─────────────────────────────────────────────────────────
  const addDonor    = useCallback((data)     => runMutation(() => api.createDonor(data)),        [runMutation]);
  const updateDonor = useCallback((id, data) => runMutation(() => api.updateDonor(id, data)),    [runMutation]);
  const deleteDonor = useCallback((id)       => runMutation(() => api.deleteDonor(id)),          [runMutation]);

  // ── Pickup mutations ────────────────────────────────────────────────────────
  const createPickup  = useCallback((data)     => runMutation(() => api.createPickup(data)),         [runMutation]);
  const schedulePickup = useCallback((data)    => runMutation(() => api.createPickup({ ...data, status: "Pending" })), [runMutation]);
  const recordPickup  = useCallback((id, data) => runMutation(() => api.recordPickup(id, data)),     [runMutation]);
  const updatePickup  = useCallback((id, data) => runMutation(() => api.updatePickup(id, data)),     [runMutation]);
  const deletePickup  = useCallback((id)       => runMutation(() => api.deletePickup(id)),           [runMutation]);

  // ── Partner mutations ───────────────────────────────────────────────────────
  const addPickupPartner    = useCallback((data)     => runMutation(() => api.createPickupPartner(data)),        [runMutation]);
  const updatePickupPartner = useCallback((id, data) => runMutation(() => api.updatePickupPartner(id, data)),   [runMutation]);
  const deletePickupPartner = useCallback((id)       => runMutation(() => api.deletePickupPartner(id)),         [runMutation]);

  // ── Payment mutations ───────────────────────────────────────────────────────
  const recordPickupPartnerPayment = useCallback(
    (partnerId, data) => runMutation(() => api.recordPickupPartnerPayment(partnerId, data)),
    [runMutation]
  );
  const clearPartnerBalance = useCallback(
    ({ pickuppartnerId }, paymentInfo) => runMutation(() => api.clearPartnerBalance(pickuppartnerId, paymentInfo)),
    [runMutation]
  );

  // ── SKS mutations ───────────────────────────────────────────────────────────
  const addSksInflow    = useCallback((data) => runMutation(() => api.createSksInflow(data)),  [runMutation]);
  const addSksOutflow   = useCallback((data) => runMutation(() => api.createSksOutflow(data)), [runMutation]);
  const deleteSksInflow  = useCallback((id)  => runMutation(() => api.deleteSksInflow(id)),    [runMutation]);
  const deleteSksOutflow = useCallback((id)  => runMutation(() => api.deleteSksOutflow(id)),   [runMutation]);

  // ── Derived / computed values ───────────────────────────────────────────────
  const CITIES = useMemo(() => names(locations.cities), [locations.cities]);
  const CITY_SECTORS    = locations.citySectors    || {};
  const GURGAON_SOCIETIES = useMemo(() => {
    const grouped = {};
    Object.entries(locations.sectorSocieties || {}).forEach(([key, socs]) => {
      const [, sector] = key.split("::");
      if (sector) grouped[sector] = socs;
    });
    return grouped;
  }, [locations.sectorSocieties]);

  // ── Context value ───────────────────────────────────────────────────────────
  const value = useMemo(() => ({
    // Collections
    donors,
    pickups,
    PickupPartners,
    partners:    PickupPartners,
    raddiRecords,
    sksInflows,
    sksOutflows,
    sksStock,

    // Dashboard (initial / unfiltered)
    dashboardStats:      dashboardPayload.stats          || EMPTY_DASHBOARD,
    monthlyData:         dashboardPayload.monthlyData    || [],
    itemBreakdown:       dashboardPayload.itemBreakdown  || [],
    monthlyRSTChart:     dashboardPayload.monthlyRSTChart  || [],
    monthlySKSChart:     dashboardPayload.monthlySKSChart  || [],
    rstBreakdown:        dashboardPayload.rstBreakdown    || [],
    sksBreakdown:        dashboardPayload.sksBreakdown    || [],
    rstFinancialSummary: dashboardPayload.rstFinancialSummary || {},
    sksDispatchSummary:  dashboardPayload.sksDispatchSummary  || {},
    schedulerTabData,

    // Master / lookup
    masterData,
    locations,
    CITIES,
    CITY_SECTORS,
    GURGAON_SOCIETIES,
    RST_ITEMS:       masterData.RST_ITEMS       || [],
    SKS_ITEMS:       masterData.SKS_ITEMS       || [],
    PICKUP_MODES:    masterData.PICKUP_MODES    || [],
    DONOR_STATUSES:  masterData.DONOR_STATUSES  || [],
    PICKUP_STATUSES: masterData.PICKUP_STATUSES || [],
    PAYMENT_STATUSES: masterData.PAYMENT_STATUSES || [],
    POSTPONE_REASONS: masterData.POSTPONE_REASONS || [],
    LOST_REASONS:    masterData.LOST_REASONS    || [],

    // UI
    loading,
    saving,
    error,

    // Actions
    refetchAll,
    fetchDashboardStats,  // ← exposes the API call for filtered dashboard data

    // Donor
    addDonor,
    updateDonor,
    deleteDonor,

    // Pickup
    createPickup,
    schedulePickup,
    recordPickup,
    updatePickup,
    deletePickup,

    // Partner
    addPickupPartner,
    updatePickupPartner,
    deletePickupPartner,
    addPartner:    addPickupPartner,
    updatePartner: updatePickupPartner,
    deletePartner: deletePickupPartner,

    // Payment
    recordPickupPartnerPayment,
    clearPartnerBalance,

    // SKS
    addSksInflow,
    addSksOutflow,
    deleteSksInflow,
    deleteSksOutflow,
  }), [
    donors, pickups, PickupPartners, raddiRecords, sksInflows, sksOutflows, sksStock,
    dashboardPayload, schedulerTabData, masterData, locations,
    CITIES, CITY_SECTORS, GURGAON_SOCIETIES,
    loading, saving, error,
    refetchAll, fetchDashboardStats,
    addDonor, updateDonor, deleteDonor,
    createPickup, schedulePickup, recordPickup, updatePickup, deletePickup,
    addPickupPartner, updatePickupPartner, deletePickupPartner,
    recordPickupPartnerPayment, clearPartnerBalance,
    addSksInflow, addSksOutflow, deleteSksInflow, deleteSksOutflow,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}