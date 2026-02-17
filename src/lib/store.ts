'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// Types
// ============================================

export interface TimeEntry {
  id: string;
  startTime: string; // ISO string
  endTime: string | null;
  breakMinutes: number;
  notes: string;
  tags: string[];
  date: string; // YYYY-MM-DD
  isOvertime: boolean;
  hourlyRate: number | null;
}

export interface MileageEntry {
  id: string;
  date: string;
  startMileage: number;
  endMileage: number | null;
  tripMiles: number;
  startLocation: string;
  endLocation: string;
  notes: string;
  linkedTimeEntryId: string | null;
  purpose: 'work' | 'personal' | 'commute';
}

export interface FuelLog {
  id: string;
  date: string;
  time: string;
  mileage: number;
  gallons: number;
  costPerGallon: number;
  totalCost: number;
  station: string;
  notes: string;
  receiptPhoto: string | null;
  fuelType: 'regular' | 'mid' | 'premium' | 'diesel';
}

export interface DailyNote {
  id: string;
  date: string;
  content: string;
  tags: string[];
  whatIDid: string;
  createdAt: string;
  updatedAt: string;
  mood: 'great' | 'good' | 'okay' | 'tough' | null;
  weather: string | null;
}

export interface SavedLocation {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  usageCount: number;
  lastUsed: string;
}

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  isDefault: boolean;
}

export interface LocationLog {
  id: string;
  shiftId: string | null;
  lat: number;
  lng: number;
  placeName: string;
  placeType: string;
  timestamp: string; // ISO
  weather?: {
    temp: number;
    condition: string;
    icon: string;
  };
}

export interface UndoAction {
  id: string;
  type: 'delete-time' | 'delete-mileage' | 'delete-fuel' | 'delete-note';
  data: unknown;
  timestamp: number;
}

export interface DashboardCard {
  id: string;
  visible: boolean;
  order: number;
}

export interface NotificationSettings {
  enabled: boolean;
  shiftReminder: boolean;
  breakReminder: boolean;
  breakIntervalHours: number;
  goalAlerts: boolean;
  fuelBudgetAlert: boolean;
}

export interface WeeklyGoal {
  hoursTarget: number;
  milesTarget: number;
  fuelBudget: number;
}

export interface UserProfile {
  name: string;
  company: string;
  role: string;
  defaultStartHour: number;
  defaultEndHour: number;
  mileageUnit: 'miles' | 'km';
  fuelUnit: 'gallons' | 'liters';
  onboardingComplete: boolean;
  hourlyRate: number;
  overtimeThreshold: number;
  overtimeMultiplier: number;
  weeklyGoal: WeeklyGoal;
  currency: string;
  dateFormat: 'US' | 'EU';
}

export type ToastType = 'success' | 'error' | 'info';

export interface AppState {
  // User
  profile: UserProfile;
  setProfile: (profile: Partial<UserProfile>) => void;
  setWeeklyGoal: (goal: Partial<WeeklyGoal>) => void;

  // Active Timer
  activeTimerStart: string | null;
  isTimerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => string;

  // Active Mileage Trip
  activeTripStart: number | null;
  isTripRunning: boolean;
  startTrip: (startMileage: number) => void;
  endTrip: (endMileage: number) => string;

  // Time Entries
  timeEntries: TimeEntry[];
  addTimeEntry: (entry: Omit<TimeEntry, 'id'>) => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;

  // Mileage Entries
  mileageEntries: MileageEntry[];
  addMileageEntry: (entry: Omit<MileageEntry, 'id'>) => void;
  updateMileageEntry: (id: string, updates: Partial<MileageEntry>) => void;
  deleteMileageEntry: (id: string) => void;

  // Fuel Logs
  fuelLogs: FuelLog[];
  addFuelLog: (log: Omit<FuelLog, 'id'>) => void;
  updateFuelLog: (id: string, updates: Partial<FuelLog>) => void;
  deleteFuelLog: (id: string) => void;

  // Daily Notes
  dailyNotes: DailyNote[];
  addDailyNote: (note: Omit<DailyNote, 'id'>) => void;
  updateDailyNote: (id: string, updates: Partial<DailyNote>) => void;
  deleteDailyNote: (id: string) => void;

  // Saved Locations
  savedLocations: SavedLocation[];
  addLocation: (location: Omit<SavedLocation, 'id'>) => void;
  removeLocation: (id: string) => void;

  // Custom Tags
  customTags: string[];
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;

  // Streak
  streakCount: number;
  lastLogDate: string | null;
  updateStreak: () => void;

  // Pinned Notes
  pinnedNoteIds: string[];
  togglePinNote: (id: string) => void;

  // Favorites / Quick Entries
  recentStations: string[];
  addRecentStation: (station: string) => void;

  // Vehicles
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  activeVehicleId: string | null;
  setActiveVehicle: (id: string | null) => void;

  // Location Tracking
  locationLogs: LocationLog[];
  addLocationLog: (log: Omit<LocationLog, 'id'>) => void;
  clearShiftLocations: (shiftId: string) => void;
  activeShiftId: string | null;
  isLocationTrackingEnabled: boolean;
  setLocationTracking: (enabled: boolean) => void;

  // Undo Stack
  undoStack: UndoAction[];
  pushUndo: (action: Omit<UndoAction, 'id' | 'timestamp'>) => void;
  popUndo: () => UndoAction | null;
  clearUndo: () => void;

  // Dashboard Customization
  dashboardCards: DashboardCard[];
  setDashboardCards: (cards: DashboardCard[]) => void;
  toggleDashboardCard: (cardId: string) => void;

  // Notification Settings
  notificationSettings: NotificationSettings;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;

  // Toast
  toast: { message: string; type: ToastType } | null;
  showToast: (message: string, type?: ToastType) => void;
  clearToast: () => void;
}

// ============================================
// Utility
// ============================================

const genId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
const today = () => new Date().toISOString().split('T')[0];

// ============================================
// Store
// ============================================

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Profile
      profile: {
        name: '',
        company: '',
        role: '',
        defaultStartHour: 7,
        defaultEndHour: 17,
        mileageUnit: 'miles',
        fuelUnit: 'gallons',
        onboardingComplete: false,
        hourlyRate: 0,
        overtimeThreshold: 8,
        overtimeMultiplier: 1.5,
        weeklyGoal: {
          hoursTarget: 40,
          milesTarget: 500,
          fuelBudget: 200,
        },
        currency: 'USD',
        dateFormat: 'US',
      },
      setProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),
      setWeeklyGoal: (goal) =>
        set((s) => ({
          profile: {
            ...s.profile,
            weeklyGoal: { ...s.profile.weeklyGoal, ...goal },
          },
        })),

      // Timer
      activeTimerStart: null,
      isTimerRunning: false,
      startTimer: () =>
        set({
          activeTimerStart: new Date().toISOString(),
          isTimerRunning: true,
        }),
      stopTimer: () => {
        const state = get();
        const id = genId();
        if (state.activeTimerStart) {
          const start = new Date(state.activeTimerStart);
          const end = new Date();
          const hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          const isOT = hoursWorked > state.profile.overtimeThreshold;

          const entry: TimeEntry = {
            id,
            startTime: state.activeTimerStart,
            endTime: end.toISOString(),
            breakMinutes: 0,
            notes: '',
            tags: [],
            date: today(),
            isOvertime: isOT,
            hourlyRate: state.profile.hourlyRate || null,
          };
          set((s) => ({
            timeEntries: [entry, ...s.timeEntries],
            activeTimerStart: null,
            isTimerRunning: false,
          }));
          state.updateStreak();
        }
        return id;
      },

      // Trip
      activeTripStart: null,
      isTripRunning: false,
      startTrip: (startMileage) =>
        set({ activeTripStart: startMileage, isTripRunning: true }),
      endTrip: (endMileage) => {
        const state = get();
        const id = genId();
        if (state.activeTripStart !== null) {
          const entry: MileageEntry = {
            id,
            date: today(),
            startMileage: state.activeTripStart,
            endMileage: endMileage,
            tripMiles: endMileage - state.activeTripStart,
            startLocation: '',
            endLocation: '',
            notes: '',
            linkedTimeEntryId: null,
            purpose: 'work',
          };
          set((s) => ({
            mileageEntries: [entry, ...s.mileageEntries],
            activeTripStart: null,
            isTripRunning: false,
          }));
          state.updateStreak();
        }
        return id;
      },

      // Time Entries
      timeEntries: [],
      addTimeEntry: (entry) =>
        set((s) => ({
          timeEntries: [{ ...entry, id: genId() }, ...s.timeEntries],
        })),
      updateTimeEntry: (id, updates) =>
        set((s) => ({
          timeEntries: s.timeEntries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      deleteTimeEntry: (id) =>
        set((s) => ({
          timeEntries: s.timeEntries.filter((e) => e.id !== id),
        })),

      // Mileage Entries
      mileageEntries: [],
      addMileageEntry: (entry) =>
        set((s) => ({
          mileageEntries: [{ ...entry, id: genId() }, ...s.mileageEntries],
        })),
      updateMileageEntry: (id, updates) =>
        set((s) => ({
          mileageEntries: s.mileageEntries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      deleteMileageEntry: (id) =>
        set((s) => ({
          mileageEntries: s.mileageEntries.filter((e) => e.id !== id),
        })),

      // Fuel Logs
      fuelLogs: [],
      addFuelLog: (log) =>
        set((s) => ({
          fuelLogs: [{ ...log, id: genId() }, ...s.fuelLogs],
        })),
      updateFuelLog: (id, updates) =>
        set((s) => ({
          fuelLogs: s.fuelLogs.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),
      deleteFuelLog: (id) =>
        set((s) => ({
          fuelLogs: s.fuelLogs.filter((l) => l.id !== id),
        })),

      // Daily Notes
      dailyNotes: [],
      addDailyNote: (note) =>
        set((s) => ({
          dailyNotes: [{ ...note, id: genId() }, ...s.dailyNotes],
        })),
      updateDailyNote: (id, updates) =>
        set((s) => ({
          dailyNotes: s.dailyNotes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        })),
      deleteDailyNote: (id) =>
        set((s) => ({
          dailyNotes: s.dailyNotes.filter((n) => n.id !== id),
        })),

      // Saved Locations
      savedLocations: [],
      addLocation: (location) =>
        set((s) => ({
          savedLocations: [{ ...location, id: genId() }, ...s.savedLocations],
        })),
      removeLocation: (id) =>
        set((s) => ({
          savedLocations: s.savedLocations.filter((l) => l.id !== id),
        })),

      // Tags
      customTags: ['CA', 'FL', 'TX', 'NY', 'Advance', 'Travel', 'Office', 'Field', 'Per Diem', 'Jobsite', 'Meeting'],
      addTag: (tag) =>
        set((s) => ({
          customTags: [...new Set([...s.customTags, tag])],
        })),
      removeTag: (tag) =>
        set((s) => ({
          customTags: s.customTags.filter((t) => t !== tag),
        })),

      // Streak
      streakCount: 0,
      lastLogDate: null,
      updateStreak: () => {
        const state = get();
        const todayStr = today();
        if (state.lastLogDate === todayStr) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (state.lastLogDate === yesterdayStr) {
          set({ streakCount: state.streakCount + 1, lastLogDate: todayStr });
        } else {
          set({ streakCount: 1, lastLogDate: todayStr });
        }
      },

      // Pinned Notes
      pinnedNoteIds: [],
      togglePinNote: (id) =>
        set((s) => ({
          pinnedNoteIds: s.pinnedNoteIds.includes(id)
            ? s.pinnedNoteIds.filter((p) => p !== id)
            : [...s.pinnedNoteIds, id],
        })),

      // Recent Stations
      recentStations: [],
      addRecentStation: (station) =>
        set((s) => ({
          recentStations: [station, ...s.recentStations.filter((rs) => rs !== station)].slice(0, 5),
        })),

      // Vehicles
      vehicles: [],
      addVehicle: (vehicle) =>
        set((s) => ({
          vehicles: [{ ...vehicle, id: genId() }, ...s.vehicles],
        })),
      updateVehicle: (id, updates) =>
        set((s) => ({
          vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v)),
        })),
      deleteVehicle: (id) =>
        set((s) => ({
          vehicles: s.vehicles.filter((v) => v.id !== id),
          activeVehicleId: s.activeVehicleId === id ? null : s.activeVehicleId,
        })),
      activeVehicleId: null,
      setActiveVehicle: (id) => set({ activeVehicleId: id }),

      // Location Tracking
      locationLogs: [],
      addLocationLog: (log) =>
        set((s) => ({
          locationLogs: [{ ...log, id: genId() }, ...s.locationLogs],
        })),
      clearShiftLocations: (shiftId) =>
        set((s) => ({
          locationLogs: s.locationLogs.filter((l) => l.shiftId !== shiftId),
        })),
      activeShiftId: null,
      isLocationTrackingEnabled: true,
      setLocationTracking: (enabled) => set({ isLocationTrackingEnabled: enabled }),

      // Undo Stack
      undoStack: [],
      pushUndo: (action) =>
        set((s) => ({
          undoStack: [{ ...action, id: genId(), timestamp: Date.now() }, ...s.undoStack].slice(0, 10),
        })),
      popUndo: () => {
        const state = get();
        if (state.undoStack.length === 0) return null;
        const [action, ...rest] = state.undoStack;
        set({ undoStack: rest });

        // Restore based on type
        if (action.type === 'delete-time') {
          set((s) => ({ timeEntries: [action.data as TimeEntry, ...s.timeEntries] }));
        } else if (action.type === 'delete-mileage') {
          set((s) => ({ mileageEntries: [action.data as MileageEntry, ...s.mileageEntries] }));
        } else if (action.type === 'delete-fuel') {
          set((s) => ({ fuelLogs: [action.data as FuelLog, ...s.fuelLogs] }));
        } else if (action.type === 'delete-note') {
          set((s) => ({ dailyNotes: [action.data as DailyNote, ...s.dailyNotes] }));
        }
        return action;
      },
      clearUndo: () => set({ undoStack: [] }),

      // Dashboard Customization
      dashboardCards: [
        { id: 'goal-ring', visible: true, order: 0 },
        { id: 'weather', visible: true, order: 1 },
        { id: 'earnings', visible: true, order: 2 },
        { id: 'insights', visible: true, order: 3 },
        { id: 'quick-actions', visible: true, order: 4 },
        { id: 'weekly-chart', visible: true, order: 5 },
        { id: 'recent-activity', visible: true, order: 6 },
        { id: 'shift-map', visible: true, order: 7 },
      ],
      setDashboardCards: (cards) => set({ dashboardCards: cards }),
      toggleDashboardCard: (cardId) =>
        set((s) => ({
          dashboardCards: s.dashboardCards.map((c) =>
            c.id === cardId ? { ...c, visible: !c.visible } : c
          ),
        })),

      // Notification Settings
      notificationSettings: {
        enabled: true,
        shiftReminder: true,
        breakReminder: true,
        breakIntervalHours: 4,
        goalAlerts: true,
        fuelBudgetAlert: true,
      },
      setNotificationSettings: (settings) =>
        set((s) => ({
          notificationSettings: { ...s.notificationSettings, ...settings },
        })),

      // Toast
      toast: null,
      showToast: (message, type = 'success') => {
        set({ toast: { message, type } });
        setTimeout(() => set({ toast: null }), 3000);
      },
      clearToast: () => set({ toast: null }),
    }),
    {
      name: 'fieldpulse-storage',
    }
  )
);

// ============================================
// Computed Helpers
// ============================================

export function getTodayEntries(entries: TimeEntry[]) {
  const todayStr = today();
  return entries.filter((e) => e.date === todayStr);
}

export function getHoursFromEntry(entry: TimeEntry): number {
  if (!entry.endTime) return 0;
  const start = new Date(entry.startTime).getTime();
  const end = new Date(entry.endTime).getTime();
  const hours = (end - start) / (1000 * 60 * 60);
  return Math.max(0, hours - entry.breakMinutes / 60);
}

export function getTotalHoursToday(entries: TimeEntry[]): number {
  return getTodayEntries(entries).reduce((sum, e) => sum + getHoursFromEntry(e), 0);
}

export function getTotalMilesToday(entries: MileageEntry[]): number {
  const todayStr = today();
  return entries
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.tripMiles, 0);
}

export function getTotalFuelToday(logs: FuelLog[]): number {
  const todayStr = today();
  return logs
    .filter((l) => l.date === todayStr)
    .reduce((sum, l) => sum + l.gallons, 0);
}

export function getWeekEntries(entries: TimeEntry[]): TimeEntry[] {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return entries.filter((e) => new Date(e.date) >= startOfWeek);
}

export function getWeeklyHours(entries: TimeEntry[]): { day: string; hours: number }[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  return days.map((day, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayEntries = entries.filter((e) => e.date === dateStr);
    const hours = dayEntries.reduce((sum, e) => sum + getHoursFromEntry(e), 0);
    return { day, hours: Math.round(hours * 10) / 10 };
  });
}

export function getWeeklyMiles(entries: MileageEntry[]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return entries
    .filter((e) => new Date(e.date) >= startOfWeek)
    .reduce((sum, e) => sum + e.tripMiles, 0);
}

export function getWeeklyFuelCost(logs: FuelLog[]): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return logs
    .filter((l) => new Date(l.date) >= startOfWeek)
    .reduce((sum, l) => sum + l.totalCost, 0);
}

export function getOvertimeHours(entries: TimeEntry[], threshold: number): number {
  const todayStr = today();
  const todayEntries = entries.filter((e) => e.date === todayStr);
  const totalHours = todayEntries.reduce((sum, e) => sum + getHoursFromEntry(e), 0);
  return Math.max(0, totalHours - threshold);
}

export function calculateEarnings(entries: TimeEntry[], rate: number, otMultiplier: number, otThreshold: number): { regular: number; overtime: number; total: number } {
  const byDate: Record<string, TimeEntry[]> = {};
  entries.forEach((e) => {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  let regular = 0;
  let overtime = 0;

  Object.values(byDate).forEach((dayEntries) => {
    const dayHours = dayEntries.reduce((sum, e) => sum + getHoursFromEntry(e), 0);
    const regHours = Math.min(dayHours, otThreshold);
    const otHours = Math.max(0, dayHours - otThreshold);
    regular += regHours * rate;
    overtime += otHours * rate * otMultiplier;
  });

  return { regular, overtime, total: regular + overtime };
}

export function getMileageReimbursement(entries: MileageEntry[], ratePerMile: number = 0.67): number {
  return entries
    .filter((e) => e.purpose === 'work')
    .reduce((sum, e) => sum + e.tripMiles * ratePerMile, 0);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatHoursMinutes(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
