import { API_BASE_URL } from '../config/database';

export const CUSTOMER_PAGES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'vorbesteller', label: 'Umsatzwellen' },
  { key: 'fotos', label: 'Fotowellen' },
  { key: 'markets', label: 'Märkte' },
  { key: 'gebietsleiter', label: 'Gebietsleiter' },
  { key: 'vorverkauf', label: 'Vorverkauf' },
  { key: 'produktersatz', label: 'Produktersatz' },
  { key: 'nara-incentive', label: 'NaRa Incentive' },
  { key: 'fragebogen', label: 'Fragebogen' },
  { key: 'zeiterfassung', label: 'Zeiterfassung' },
  { key: 'produkte', label: 'Produkte' },
] as const;
export type CustomerPage = (typeof CUSTOMER_PAGES)[number]['key'];
export type CustomerPermissions = Partial<
  Record<CustomerPage, { view: boolean; export: boolean }>
>;
export type CustomerAccount = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  permissions: CustomerPermissions;
  version: number;
  createdAt: string;
};
export type AccountInput = Omit<
  CustomerAccount,
  'id' | 'createdAt' | 'version'
> & { version?: number };
export type ReportRow = Record<
  string,
  string | number | boolean | null | string[]
>;
export type CustomerReport = {
  title: string;
  columns: {
    key: string;
    label: string;
    format?: 'money' | 'date' | 'number';
  }[];
  rows: ReportRow[];
  generatedAt: string;
};
async function checked(response: Response) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Anfrage fehlgeschlagen.');
  }
  return response;
}
export const customerAccessService = {
  async accounts(): Promise<{ accounts: CustomerAccount[] }> {
    return (
      await checked(await fetch(`${API_BASE_URL}/customer/accounts`))
    ).json();
  },
  async save(
    input: AccountInput,
    id?: string
  ): Promise<{ account: CustomerAccount; oneTimePassword?: string }> {
    return (
      await checked(
        await fetch(`${API_BASE_URL}/customer/accounts${id ? '/' + id : ''}`, {
          method: id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
      )
    ).json();
  },
  async me(
    signal?: AbortSignal
  ): Promise<{ permissions: CustomerPermissions }> {
    return (
      await checked(await fetch(`${API_BASE_URL}/customer/me`, { signal }))
    ).json();
  },
  async report(
    page: CustomerPage,
    waveId?: string,
    signal?: AbortSignal
  ): Promise<CustomerReport> {
    return (
      await checked(
        await fetch(
          `${API_BASE_URL}/customer/pages/${page}${waveId ? '/waves/' + waveId : ''}`,
          { signal }
        )
      )
    ).json();
  },
  async image(id: string, signal?: AbortSignal): Promise<Blob> {
    return (
      await checked(
        await fetch(`${API_BASE_URL}/customer/photos/${id}`, { signal })
      )
    ).blob();
  },
  async export(
    page: CustomerPage,
    waveId?: string,
    query = '',
    photos = false
  ) {
    const response = await checked(
      await fetch(
        `${API_BASE_URL}/customer/pages/${page}/${photos ? 'photos.zip' : 'export'}?${new URLSearchParams({ ...(waveId ? { waveId } : {}), ...(query ? { q: query } : {}) })}`
      )
    );
    const url = URL.createObjectURL(await response.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = `rover-${page}.${photos ? 'zip' : 'xlsx'}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
