import { useCallback, useEffect, useId, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { ArrowsClockwise, CheckCircle, CircleNotch, X } from '@phosphor-icons/react';
import { wellenService, type WellePricePreview } from '../../services/wellenService';
import { toApiError } from '../../utils/apiErrors';
import styles from './WellePriceCorrectionModal.module.css';

const money = (value: string) => Number(value).toLocaleString('de-AT', { style: 'currency', currency: 'EUR' });
const errorMessage = (error: unknown) => {
  const details = toApiError(error, { code: 'MR-WELLE-PRICE-REQUEST-002', message: 'Preisvergleich fehlgeschlagen. Bitte erneut prüfen.' });
  return `${details.message} [${details.code}]`;
};
const types: Record<string, string> = {
  display: 'Display', kartonware: 'Kartonware', einzelprodukt: 'Einzelprodukt', palette: 'Palette', schuette: 'Schütte',
};

export function WellePriceCorrectionModal({ welleId, welleName, onDone }: {
  welleId: string;
  welleName: string;
  onDone: () => void;
}) {
  const [preview, setPreview] = useState<WellePricePreview | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const busyRef = useRef(false);
  const requestVersion = useRef(0);
  const onDoneRef = useRef(onDone);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  const loadPreview = useCallback(async () => {
    const version = ++requestVersion.current;
    busyRef.current = true;
    setBusy(true);
    setError('');
    setPreview(null);
    try {
      const data = await wellenService.submissionPrices(welleId);
      if (version !== requestVersion.current) return;
      if (data.count === 0 && data.skippedCount === 0) onDoneRef.current();
      else setPreview(data);
    } catch (err) {
      if (version === requestVersion.current) setError(errorMessage(err));
    } finally {
      if (version === requestVersion.current) {
        busyRef.current = false;
        setBusy(false);
      }
    }
  }, [welleId]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    void loadPreview();
    return () => {
      // This is a request generation counter, not a DOM ref: invalidate the latest request on unmount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestVersion.current++;
      previousFocus?.focus();
    };
  }, [loadPreview]);

  const applyPrices = async () => {
    if (!preview || preview.applied || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      setPreview(await wellenService.submissionPrices(welleId, preview.token));
    } catch (err) {
      // Never reuse a failed/stale confirmation. A fresh preview is required, also after a lost response.
      setPreview(null);
      setError(errorMessage(err));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return ReactDOM.createPortal(
    <div className={styles.overlay}>
      <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        onKeyDown={event => {
          if (event.key === 'Escape' && !busyRef.current) onDoneRef.current();
          if (event.key !== 'Tab') return;
          const elements = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]');
          if (!elements?.length) { event.preventDefault(); return; }
          const first = elements[0];
          const last = elements[elements.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
            event.preventDefault(); last.focus();
          } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
            event.preventDefault(); first.focus();
          }
        }}>
        <header className={styles.header}>
          <div><p className={styles.saved}><CheckCircle size={16} weight="fill" /> Welle gespeichert</p>
            <h2 id={titleId}>Buchungspreise abgleichen</h2><p className={styles.name}>{preview?.welleName || welleName}</p></div>
          <button className={styles.close} disabled={busy} onClick={onDone} aria-label="Schließen" title="Schließen"><X size={20} /></button>
        </header>
        <div className={styles.content} aria-busy={busy}>
          {busy && <p className={styles.loading} role="status"><CircleNotch size={20} className={styles.spinner} /> {preview ? 'Preise werden übernommen …' : 'Gespeicherte Buchungspreise werden geprüft …'}</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {!busy && preview && (preview.applied ?
            <p className={styles.saved} role="status"><CheckCircle size={20} weight="fill" /> {preview.updatedCount} Buchungspreise wurden aktualisiert.</p> : <>
              <p>{preview.count > 0 ? `${preview.count} Buchungen haben einen abweichenden oder noch nicht gespeicherten Preis. Aktuelle Produktpreise auch auf diese bestehenden Buchungen anwenden?` : 'Keine eindeutig zugeordneten Buchungspreise zu ändern.'}</p>
              <p className={styles.scope}>Nur diese Welle. Mengen, Märkte, GLs und Besuchsdaten bleiben unverändert.</p>
              {preview.count > 0 && <>
                <div className={styles.totals}>
                  <div><span>{preview.missingOldPriceCount ? 'Bisher bekannt' : 'Bisher'}</span><strong>{money(preview.oldTotal)}</strong></div>
                  <div><span>Nach Übernahme</span><strong>{money(preview.newTotal)}</strong></div>
                </div>
                {preview.missingOldPriceCount > 0 && <p className={styles.note}>{preview.missingOldPriceCount} Buchungen ohne gespeicherten Altpreis sind im bisherigen Betrag nicht enthalten.</p>}
                <div className={styles.tableScroll} tabIndex={0} aria-label="Abweichende Produktpreise">
                  <table><thead><tr><th>Produkt</th><th>Buchungen</th><th>Preis bisher</th><th>Preis neu</th></tr></thead>
                    <tbody>{preview.groups.map(group => <tr key={`${group.itemType}-${group.itemId}-${group.oldPrice}`}>
                      <td><span>{group.name}</span><small>{types[group.itemType] || group.itemType} · {group.quantity} Einheiten</small></td>
                      <td data-label="Buchungen">{group.count}</td><td data-label="Preis bisher">{group.oldPrice === null ? 'Nicht gespeichert' : money(group.oldPrice)}</td><td data-label="Preis neu">{money(group.newPrice)}</td>
                    </tr>)}</tbody></table>
                </div>
              </>}
            </>)}
          {!busy && !!preview?.skippedCount && <p className={styles.warning}>{preview.skippedCount} Buchungen konnten keinem Produkt mit gültigem Wellenpreis zugeordnet werden. Sie bleiben unverändert und müssen separat geprüft werden.</p>}
        </div>
        <footer className={styles.footer}>
          <button disabled={busy} onClick={onDone}>{preview?.applied || !preview?.count ? 'Schließen' : 'Buchungspreise beibehalten'}</button>
          {!preview && !busy && <button className={styles.primary} onClick={() => void loadPreview()}><ArrowsClockwise size={18} /> Erneut prüfen</button>}
          {!!preview?.count && !preview.applied && <button className={styles.primary} disabled={busy} onClick={() => void applyPrices()}><CheckCircle size={18} /> Preise übernehmen</button>}
        </footer>
      </div>
    </div>, document.body,
  );
}
