import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Buildings,
  Check,
  CheckCircle,
  MagnifyingGlass,
  Copy,
  Eye,
  DownloadSimple,
  Plus,
  X,
} from '@phosphor-icons/react';
import {
  CUSTOMER_PAGES,
  customerAccessService,
  type AccountInput,
  type CustomerAccount,
  type CustomerPage,
} from '../../services/customerAccessService';
import styles from './CustomerAccess.module.css';

const empty = (): AccountInput => ({
  firstName: '',
  lastName: '',
  email: '',
  isActive: true,
  permissions: {},
});
export function CustomerAccessPanel({ onClose }: { onClose: () => void }) {
  const [accounts, setAccounts] = useState<CustomerAccount[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<AccountInput>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    customerAccessService
      .accounts()
      .then((r) => {
        if (active) setAccounts(r.accounts);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
      if (e.key === 'Tab') {
        const nodes = dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),[tabindex="0"]'
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      prior?.focus();
    };
  }, [onClose, saving]);
  const choose = (account: CustomerAccount | null) => {
    setSelected(account?.id ?? null);
    setForm(
      account
        ? {
            email: account.email,
            firstName: account.firstName,
            lastName: account.lastName,
            isActive: account.isActive,
            permissions: structuredClone(account.permissions),
            version: account.version,
          }
        : empty()
    );
    setError('');
    setSuccess('');
    setPassword('');
    setCopied(false);
  };
  const toggle = (page: CustomerPage, action: 'view' | 'export') =>
    setForm((previous) => {
      const permissions = { ...previous.permissions };
      const p = permissions[page] ?? { view: false, export: false };
      const next =
        action === 'view'
          ? { view: !p.view, export: false }
          : { view: true, export: !p.export };
      if (next.view) permissions[page] = next;
      else delete permissions[page];
      return { ...previous, permissions };
    });
  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    setPassword('');
    try {
      const result = await customerAccessService.save(
        form,
        selected ?? undefined
      );
      setAccounts((previous) => [
        result.account,
        ...previous.filter((a) => a.id !== result.account.id),
      ]);
      setSelected(result.account.id);
      setForm({ ...form, version: result.account.version });
      setPassword(result.oneTimePassword ?? '');
      setSuccess(
        result.oneTimePassword
          ? 'Zugang angelegt. Zugangsdaten jetzt kopieren.'
          : 'Änderungen gespeichert. Die Rechte gelten ab der nächsten Anfrage.'
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-access-title"
        ref={dialog}
        tabIndex={-1}
      >
        <header className={styles.dialogHeader}>
          <div className={styles.heading}>
            <div className={styles.headingIcon}>
              <Buildings size={22} weight="bold" />
            </div>
            <div>
              <h2 id="customer-access-title" className={styles.title}>
                Kundenzugänge
              </h2>
              <p>Seiten freigeben und Exportrechte verwalten</p>
            </div>
          </div>
          <button
            className={styles.closeButton}
            aria-label="Kundenzugänge schließen"
            disabled={saving}
            onClick={onClose}
          >
            <X size={20} weight="bold" />
          </button>
        </header>
        <div className={styles.dialogBody}>
          <aside className={styles.accounts}>
            <div className={styles.accountsHeading}>
              <strong>Kundenkonten</strong>
              <span>
                {loading
                  ? 'Wird geladen …'
                  : `${accounts.length} ${accounts.length === 1 ? 'Kundenzugang' : 'Kundenzugänge'}`}
              </span>
            </div>
            <button
              className={styles.newButton}
              onClick={() => choose(null)}
              disabled={saving}
            >
              <Plus size={17} /> Neuer Zugang
            </button>
            <div className={styles.accountSearch}>
              <MagnifyingGlass size={18} />
              <input
                className={styles.accountSearchInput}
                aria-label="Kundenzugänge suchen"
                placeholder="Name oder E-Mail suchen"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {loading ? (
              <p className={styles.muted}>Zugänge werden geladen …</p>
            ) : (
              accounts
                .filter((a) =>
                  (a.firstName + ' ' + a.lastName + ' ' + a.email)
                    .toLowerCase()
                    .includes(search.toLowerCase())
                )
                .map((a) => (
                  <button
                    className={`${styles.account} ${selected === a.id ? styles.selected : ''}`}
                    key={a.id}
                    onClick={() => choose(a)}
                    disabled={saving}
                  >
                    <span className={styles.accountTop}>
                      <strong className={styles.accountName}>
                        {a.firstName} {a.lastName}
                      </strong>
                      <span
                        className={`${styles.statusBadge} ${!a.isActive ? styles.statusInactive : ''}`}
                      >
                        {a.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </span>
                    <span className={styles.accountEmail}>{a.email}</span>
                    <small className={styles.accountMeta}>
                      {Object.keys(a.permissions).length} Seiten freigegeben
                    </small>
                  </button>
                ))
            )}
            {!loading && !accounts.length && (
              <p className={styles.muted}>Noch keine Kundenzugänge.</p>
            )}
          </aside>
          <form
            className={styles.editor}
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <div className={styles.editorContent}>
              <div className={styles.editorHeading}>
                <h3>{selected ? 'Zugang bearbeiten' : 'Neuer Kundenzugang'}</h3>
                <span className={styles.roleBadge}>Kunde</span>
              </div>
              <fieldset disabled={saving} className={styles.fields}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Vorname</span>
                  <input
                    className={styles.formInput}
                    required
                    maxLength={100}
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Nachname</span>
                  <input
                    className={styles.formInput}
                    required
                    maxLength={100}
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                  />
                </label>
                <label className={`${styles.field} ${styles.full}`}>
                  <span className={styles.fieldLabel}>Login-E-Mail</span>
                  <input
                    className={styles.formInput}
                    required
                    type="email"
                    maxLength={254}
                    readOnly={!!selected}
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </label>
              </fieldset>
              <div className={styles.activeRow}>
                <span>Zugang aktiv</span>
                <button
                  type="button"
                  role="switch"
                  aria-label="Zugang aktiv"
                  aria-checked={form.isActive}
                  className={`${styles.switch} ${form.isActive ? styles.on : ''}`}
                  disabled={saving}
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                >
                  <span />
                </button>
              </div>
              <div className={styles.sectionHeading}>
                <h3>Seitenrechte</h3>
                <span>
                  {Object.keys(form.permissions).length} von{' '}
                  {CUSTOMER_PAGES.length} Seiten
                </span>
              </div>
              <div className={styles.permissionHeading}>
                <span>Seite</span>
                <span>
                  <Eye size={15} /> Ansehen
                </span>
                <span>
                  <DownloadSimple size={15} /> Exportieren
                </span>
              </div>
              <div className={styles.permissions}>
                {CUSTOMER_PAGES.map((p) => (
                  <div
                    className={`${styles.permissionRow} ${form.permissions[p.key]?.view ? styles.permissionGranted : ''}`}
                    key={p.key}
                  >
                    <span>{p.label}</span>
                    {(['view', 'export'] as const).map((action) => (
                      <button
                        type="button"
                        role="switch"
                        aria-label={`${p.label}: ${action === 'view' ? 'Ansehen' : 'Exportieren'}`}
                        aria-checked={!!form.permissions[p.key]?.[action]}
                        className={`${styles.check} ${form.permissions[p.key]?.[action] ? styles.checked : ''}`}
                        key={action}
                        disabled={saving}
                        onClick={() => toggle(p.key, action)}
                      >
                        {form.permissions[p.key]?.[action] && (
                          <Check size={15} weight="bold" />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <p className={styles.hint}>
                Ohne Freigabe bleibt die Seite verborgen. Exportieren schließt
                Ansehen ein. Kunden können keine Daten bearbeiten.
              </p>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              {success && (
                <p className={styles.success} role="status">
                  {success}
                </p>
              )}
              {password && (
                <div className={styles.credentials}>
                  <strong className={styles.credentialLabel}>
                    Passwort – wird nur jetzt angezeigt
                  </strong>
                  <code className={styles.credentialCode}>{password}</code>
                  <button
                    className={styles.copyButton}
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          `Rover\n${form.email}\n${password}`
                        );
                        setCopied(true);
                      } catch {
                        setError('Bitte Zugangsdaten manuell kopieren.');
                      }
                    }}
                  >
                    <Copy size={16} />
                    {copied ? 'Kopiert' : 'Zugangsdaten kopieren'}
                  </button>
                </div>
              )}
            </div>
            <footer className={styles.footer}>
              <button
                className={styles.cancelButton}
                type="button"
                onClick={onClose}
                disabled={saving}
              >
                Schließen
              </button>
              <button
                className={styles.primary}
                disabled={saving || loading}
                type="submit"
              >
                <CheckCircle size={18} weight="bold" />
                {saving
                  ? 'Speichert …'
                  : selected
                    ? 'Änderungen speichern'
                    : 'Zugang erstellen'}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
