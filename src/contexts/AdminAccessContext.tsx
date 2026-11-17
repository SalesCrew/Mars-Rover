import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  customerAccessService,
  type CustomerPage,
  type CustomerPermissions,
} from '../services/customerAccessService';

type Access = {
  canWrite: boolean;
  canView: (page: CustomerPage) => boolean;
  canExport: (page: CustomerPage) => boolean;
};
const AdminAccessContext = createContext<Access>({
  canWrite: false,
  canView: () => false,
  canExport: () => false,
});
// Context hooks intentionally share the provider module.
// eslint-disable-next-line react-refresh/only-export-components
export const useAdminAccess = () => useContext(AdminAccessContext);
export function AdminAccessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [access, setAccess] = useState<{
    userId: string;
    permissions: CustomerPermissions;
  } | null>(null);
  const [error, setError] = useState(false);
  const customer = user?.role === 'customer';
  const customerId = customer ? user?.id : undefined;
  useEffect(() => {
    if (!customerId) return;
    const controller = new AbortController();
    const reload = async () => {
      try {
        const data = await customerAccessService.me(controller.signal);
        if (!controller.signal.aborted) {
          setAccess({ userId: customerId, permissions: data.permissions });
          setError(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setAccess(null);
          setError(true);
        }
      }
    };
    void reload();
    const timer = window.setInterval(reload, 30000);
    window.addEventListener('focus', reload);
    window.addEventListener('rover:access-denied', reload);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener('focus', reload);
      window.removeEventListener('rover:access-denied', reload);
    };
  }, [customerId]);
  const admin = user?.role === 'admin';
  const permissions =
    access?.userId === user?.id ? access?.permissions : undefined;
  const value = useMemo(
    () => ({
      canWrite: admin,
      canView: (page: CustomerPage) =>
        admin || permissions?.[page]?.view === true,
      canExport: (page: CustomerPage) =>
        admin ||
        (permissions?.[page]?.view === true &&
          permissions[page]?.export === true),
    }),
    [admin, permissions]
  );
  if (customer && !permissions)
    return (
      <div role="status">
        {error
          ? 'Zugang nicht verfügbar. Bitte erneut anmelden.'
          : 'Zugangsrechte werden geladen…'}
      </div>
    );
  return (
    <AdminAccessContext.Provider value={value}>
      {children}
    </AdminAccessContext.Provider>
  );
}
export function AdminWrite({ children }: { children: ReactNode }) {
  return useAdminAccess().canWrite ? children : null;
}
export function AdminExport({
  page,
  children,
}: {
  page: CustomerPage;
  children: ReactNode;
}) {
  return useAdminAccess().canExport(page) ? children : null;
}
// Detail forms retain their layout while customers see values without edit controls.
export function AdminReadField({
  value,
  children,
}: {
  value: ReactNode;
  children: ReactNode;
}) {
  return useAdminAccess().canWrite ? children : <span>{value ?? '—'}</span>;
}
