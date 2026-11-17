import { API_BASE_URL } from '../config/database';

export { ADMIN_PAGES as CUSTOMER_PAGES } from '../config/adminNavigation';
import type { AdminPage } from '../config/adminNavigation';
export type CustomerPage = AdminPage;
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
};
