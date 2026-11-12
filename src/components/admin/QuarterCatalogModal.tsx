import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { quarterCatalogService, type CatalogEntry, type CatalogItemType, type QuarterReconciliation } from '../../services/quarterCatalogService';
import styles from './QuarterCatalogModal.module.css';

interface Props { type?: CatalogItemType; onSelect?: (entry: CatalogEntry) => void; onClose: () => void; onChanged?: () => void; }
export function QuarterCatalogModal({ type, onSelect, onClose, onChanged }: Props) {
  const current = new Intl.DateTimeFormat('en-CA',{ timeZone:'Europe/Vienna',year:'numeric',month:'numeric' }).formatToParts(new Date());
  const [year,setYear]=useState(Number(current.find(p=>p.type==='year')!.value));
  const [quarter,setQuarter]=useState(Math.ceil(Number(current.find(p=>p.type==='month')!.value)/3));
  const [entries,setEntries]=useState<CatalogEntry[]>([]),[search,setSearch]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [upload,setUpload]=useState<{filename:string;sha256:string;rows:CatalogEntry[]}|null>(null);
  const [preview,setPreview]=useState<QuarterReconciliation|null>(null);
  const input=useRef<HTMLInputElement>(null);
  const dialog=useRef<HTMLElement>(null);
  useEffect(()=>{
    const previous=document.activeElement,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';input.current?.focus();
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape'){e.preventDefault();onClose();return;}
      if(e.key==='Tab'){
        const nodes=dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex="0"]');
        if(nodes?.length){const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
      }
    };
    document.addEventListener('keydown',key);
    return()=>{document.removeEventListener('keydown',key);document.body.style.overflow=overflow;if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};
  },[onClose]);
  useEffect(()=>{let active=true;setError('');setBusy(true);setUpload(null);quarterCatalogService.list(year,quarter).then(r=>{if(active)setEntries(r.items);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[year,quarter]);
  const filtered=entries.filter(e=>(!type||e.item_type===type)&&`${e.artikel_nr} ${e.name}`.toLowerCase().includes(search.toLowerCase()));
  const price=(n:number)=>Number(n).toLocaleString('de-AT',{style:'currency',currency:'EUR'});
  const label=type==='display'?'Display':type==='kartonware'?'Kartonware':type==='einzelprodukt'?'Einzelprodukt':'Quartalspreise';
  const work=async(fn:()=>Promise<void>)=>{setBusy(true);setError('');try{await fn();}catch(e){setError(e instanceof Error?e.message:'Aktion fehlgeschlagen.');}finally{setBusy(false);}};
  const downloadReport=()=>{
    if(!preview)return;
    const cell=(value:unknown)=>`"${String(value??'').replace(/"/g,'""').replace(/^[=+@-]/,"'")}"`;
    const rows=[['Buchung','Welle','Artikelnummer','Artikel','Quartal','Status','Alter Preis/Stk','Neuer Preis/Stk'],
      ...preview.changes.map(c=>[c.id,c.waveName,c.article,c.name,`Q${c.quarter} ${c.year}`,'Belegter Quartalspreis',c.oldPrice,c.newPrice]),
      ...preview.unresolved.map(c=>[c.id,c.waveName,c.article,c.name,`Q${c.quarter} ${c.year}`,c.reason,'',''])];
    const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(row=>row.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='Quartalspreis-Abgleich.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return createPortal(<div className={styles.overlay}><section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="quarter-catalog-title" className={styles.modal}>
    <header><h2 id="quarter-catalog-title">{type?`${label} aus Katalog auswählen`:label}</h2><button type="button" onClick={onClose} disabled={busy} aria-label="Quartalskatalog schließen">✕</button></header>
    <div className={styles.content}>
      <p>Artikelnummer und Preis stammen aus der freigegebenen Quartalsliste. Der Preis der Bestellung richtet sich nach dem Quartal der GL-Eingabe.</p>
      <div className={styles.controls}>
        <label>Jahr<input type="number" min="2000" max="2100" value={year} disabled={!!type||busy} onChange={e=>setYear(Number(e.target.value))}/></label>
        <label>Quartal<select value={quarter} disabled={!!type||busy} onChange={e=>setQuarter(Number(e.target.value))}>{[1,2,3,4].map(q=><option key={q} value={q}>Q{q}</option>)}</select></label>
        <label className={styles.search}>Artikel suchen<input ref={input} type="search" placeholder="Artikelnummer oder Name" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      </div>
      {error&&<p role="alert" className={styles.error}>{error}</p>}{message&&<p role="status">{message}</p>}
      {!type&&<div className={styles.import}>
        <label>Preisliste importieren<input type="file" accept=".xlsx" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void work(async()=>{const { parseQuarterPriceWorkbook } = await import('../../utils/quarterPriceWorkbook');const parsed=await parseQuarterPriceWorkbook(file,year,quarter);setUpload({filename:file.name,...parsed});setMessage(`${parsed.rows.length} Katalogeinträge aus ${file.name} geprüft. Noch nicht gespeichert.`);});e.target.value='';}}/></label>
        {upload&&<button disabled={busy} onClick={()=>void work(async()=>{const result=await quarterCatalogService.import({year,quarter,...upload});setMessage(`${result.inserted} Einträge importiert, ${result.unchanged} bereits identisch vorhanden.`);setUpload(null);setEntries((await quarterCatalogService.list(year,quarter)).items);onChanged?.();})}>Geprüfte Preisliste für Q{quarter} {year} übernehmen</button>}
        <button disabled={busy} onClick={()=>void work(async()=>{setPreview(await quarterCatalogService.preview());})}>Historische Buchungspreise prüfen</button>
      </div>}
      {preview&&<section className={styles.preview}><h3>Historische Preisvorschau</h3><p>{preview.count} Buchungen können anhand belegter Quartalspreise abgeglichen werden. {preview.unresolved.length} Buchungen bleiben wegen fehlender Zuordnung oder Preisbelege unverändert.</p>
        <p>Mengen, Buchungsdatum und Bestellzuordnungen bleiben erhalten.</p>
        <div className={styles.table}><table><thead><tr><th>Artikel</th><th>Quartal</th><th>Alter Preis/Stk</th><th>Neuer Preis/Stk</th></tr></thead><tbody>{preview.changes.slice(0,50).map(c=><tr key={c.id}><td>{c.article}</td><td>Q{c.quarter} {c.year}</td><td>{c.oldPrice==null?'Fehlt':price(c.oldPrice)}</td><td>{price(c.newPrice)}</td></tr>)}</tbody></table></div>
        {preview.count>50&&<p>Die ersten 50 Änderungen werden angezeigt.</p>}
        <button type="button" disabled={busy} onClick={downloadReport}>Vollständigen Prüfbericht herunterladen</button>
        <button disabled={busy||!preview.count} onClick={()=>void work(async()=>{const result=await quarterCatalogService.apply(preview.token);setMessage(`${result.updated} historische Buchungspreise abgeglichen.`);setPreview(null);onChanged?.();})}>{preview.count} geprüfte Buchungspreise übernehmen</button>
      </section>}
      {busy&&<p role="status">Wird geprüft …</p>}
      {!busy&&!filtered.length&&<p>Für diese Auswahl sind keine freigegebenen Artikel vorhanden. Bitte zuerst die passende Quartalspreisliste importieren.</p>}
      <div className={styles.list}>{filtered.map(e=><button key={`${e.department}:${e.item_type}:${e.artikel_nr}`} className={styles.item} disabled={!onSelect||busy} onClick={()=>onSelect?.(e)}>
        <strong>{e.artikel_nr} · {e.name}</strong><span>{e.department==='pets'?'Pet':'Food'} · {e.item_type==='display'?'1 Display':`1 VE = ${e.units_per_ve} Stück`} · {price(e.price_per_order)} / {e.item_type==='display'?'Display':'VE'}{e.scope_note?` · ${e.scope_note}`:''}</span>
      </button>)}</div>
    </div>
  </section></div>,document.body);
}
