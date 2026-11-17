import {
  House,
  MapPin,
  Users,
  CalendarCheck,
  TrendUp,
  Receipt,
  Gift,
  ClipboardText,
  Clock,
  Camera,
  Package,
} from '@phosphor-icons/react';

// Both the sidebar and access editor use the production admin page catalog.
export const ADMIN_PAGES = [
  { key: 'dashboard', label: 'Dashboard', icon: House },
  { key: 'markets', label: 'Märkte', icon: MapPin },
  { key: 'gebietsleiter', label: 'Gebietsleiter', icon: Users },
  { key: 'vorbesteller', label: 'Vorbesteller', icon: CalendarCheck },
  { key: 'vorverkauf', label: 'Vorverkauf', icon: TrendUp },
  { key: 'produktersatz', label: 'Produktersatz', icon: Receipt },
  { key: 'nara-incentive', label: 'NaRa Incentive', icon: Gift },
  { key: 'fragebogen', label: 'Fragebogen', icon: ClipboardText },
  { key: 'zeiterfassung', label: 'Zeiterfassung', icon: Clock },
  { key: 'fotos', label: 'Fotos', icon: Camera },
  { key: 'produkte', label: 'Produkte', icon: Package },
] as const;
export type AdminPage = (typeof ADMIN_PAGES)[number]['key'];
