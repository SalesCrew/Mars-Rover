import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { VorbestellerPage } from '../src/components/admin/VorbestellerPage';
import { WellePriceCorrectionModal } from '../src/components/admin/WellePriceCorrectionModal';
import '../src/index.css';
import '../src/styles/design-system.css';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const mode = new URLSearchParams(location.search).get('mode') || 'wizard';
const state = { calls: [] as { method: string; url: string; body: unknown }[], mode, applied: false };
Object.assign(window, { priceTest: state });
const wave = {
  id: id(1), name: 'BILLA Plus Herbstwelle', startDate: '2026-09-01', endDate: '2026-11-30',
  status: 'active', image: null, types: ['palette', 'schuette'], goalType: 'value', goalValue: 10000,
  displays: [], kartonwareItems: [], einzelproduktItems: [],
  paletteItems: [{ id: id(30), name: 'Aktionspalette', size: '1/4', products: [{ id: id(13), name: 'Dreamies Mix', valuePerVE: 24.5, ve: 8 }] }],
  schutteItems: [{ id: id(40), name: 'Schüttenaktion', size: '1/4', products: [{ id: id(14), name: 'Whiskas Snacks', valuePerVE: 18.75, ve: 12 }] }],
  kwDays: [{ kw: '38', days: ['Mo', 'Di'] }], assignedMarketIds: ['test-market'], assignedMarketCount: 1,
  fotoEnabled: false, fotoOnly: false, noLimitWelle: false, fotoTags: [],
};
const preview = () => ({
  welleId: wave.id, welleName: wave.name, token: 'a'.repeat(64), count: state.applied || mode === 'empty' ? 0 : 27,
  skippedCount: 0, missingOldPriceCount: 0, oldTotal: '975.00', newTotal: '1110.00',
  groups: [
    { itemId: id(13), itemType: 'palette', name: 'Aktionspalette / Dreamies Mix', oldPrice: '21.50', newPrice: '24.50', count: 18, quantity: 30 },
    { itemId: id(14), itemType: 'schuette', name: 'Schüttenaktion / Whiskas Snacks', oldPrice: '16.50', newPrice: '18.75', count: 9, quantity: 20 },
  ], applied: false, updatedCount: 0,
});

// This fixture intercepts EVERY fetch. It never forwards a request to a real backend.
window.fetch = async (input, init) => {
  const url = String(input);
  const method = init?.method || 'GET';
  state.calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : null });
  const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  if (url.includes('/submission-prices')) {
    await new Promise(resolve => setTimeout(resolve, 150));
    if (method === 'POST') {
      if (state.mode === 'stale') return response({ code: 'MR-WELLE-PRICE-STALE-001', error: 'Preise oder Buchungen wurden inzwischen geändert. Bitte die neue Vorschau prüfen und erneut bestätigen.' }, 409);
      if (state.mode === 'apply-error') throw new TypeError('Simulated lost response');
      state.applied = true;
      return response({ ...preview(), count: 27, applied: true, updatedCount: 27 });
    }
    if (state.mode === 'preview-error') return response({ code: 'MR-WELLE-PRICE-PREVIEW-001', error: 'Die Welle ist gespeichert, aber die Buchungspreise konnten nicht geprüft werden.' },503);
    return response(preview());
  }
  if (/\/wellen(?:\?|$)/.test(url)) return response([wave]);
  if (url.includes(`/wellen/${wave.id}`) && method === 'PUT') return response({ message: 'Welle updated' });
  if (url.includes('/products')) return response([]);
  throw new Error(`Fixture blocked unexpected request: ${method} ${url}`);
};

function App() {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<string | null>(wave.id);
  const [done, setDone] = useState(false);
  if (mode !== 'wizard') return done ? <p>Fertig</p> : <WellePriceCorrectionModal welleId={wave.id} welleName={wave.name} onDone={() => setDone(true)} />;
  return <VorbestellerPage isCreateWelleModalOpen={open} onOpenCreateWelleModal={() => setOpen(true)}
    onCloseCreateWelleModal={() => setOpen(false)} waveIdToEdit={edit} onClearWaveIdToEdit={() => setEdit(null)} />;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
