const STORAGE_KEY = 'marspets_active_visit';
const STALE_HOURS = 24;

export interface PendingSync {
  create?: boolean;
  von?: boolean;
  bis?: boolean;
  final?: boolean;
}

export interface PersistedVisit {
  submissionId: string | null;
  glId: string;
  marketId: string;
  marketName: string;
  marketChain: string;
  besuchszeitVon: string;
  besuchszeitBis: string | null;
  kommentar: string;
  foodProzent: number;
  distanzKm: string;
  pendingSync: PendingSync;
  modules: any[];
  savedAt: string;
}

export function saveActiveVisit(data: PersistedVisit): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, savedAt: new Date().toISOString() }));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function getActiveVisit(): PersistedVisit | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: PersistedVisit = JSON.parse(raw);

    const savedAt = new Date(parsed.savedAt).getTime();
    if (Date.now() - savedAt > STALE_HOURS * 60 * 60 * 1000) {
      clearActiveVisit();
      return null;
    }

    return parsed;
  } catch {
    clearActiveVisit();
    return null;
  }
}

export function clearActiveVisit(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function updateActiveVisit(partial: Partial<PersistedVisit>): void {
  const current = getActiveVisit();
  if (!current) return;
  saveActiveVisit({ ...current, ...partial });
}

export function updatePendingSync(flags: Partial<PendingSync>): void {
  const current = getActiveVisit();
  if (!current) return;
  saveActiveVisit({ ...current, pendingSync: { ...current.pendingSync, ...flags } });
}

export function getPendingSync(): PendingSync | null {
  const current = getActiveVisit();
  if (!current) return null;
  return current.pendingSync;
}
