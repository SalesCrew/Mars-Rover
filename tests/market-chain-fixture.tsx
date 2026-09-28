import React from 'react';
import { createRoot } from 'react-dom/client';
import { CreateMarketModal } from '../src/components/admin/CreateMarketModal';
import { MarketDetailsModal } from '../src/components/admin/MarketDetailsModal';
import { MarketsPage } from '../src/components/admin/MarketsPage';
import { WelleMarketSelectorModal } from '../src/components/admin/WelleMarketSelectorModal';
import { CreateFragebogenModal } from '../src/components/admin/CreateFragebogenModal';
import { FragebogenDetailModal } from '../src/components/admin/FragebogenDetailModal';
import { FragebogenDistributionExportModal } from '../src/components/admin/FragebogenDistributionExportModal';
import { GLDetailModal } from '../src/components/admin/GLDetailModal';
import { MarketsVisitedModal } from '../src/components/gl/MarketsVisitedModal';
import { marketService } from '../src/services/marketService';
import type { AdminMarket } from '../src/types/market-types';
import '../src/index.css';
import '../src/styles/design-system.css';

// Deliberately include raw legacy aliases to test options AND row matching.
const chains = ['Adeg', 'Billa+', 'BILLA Plus', 'BILLA+', 'BILLA+ Privat', 'BILLA Plus Privat', 'BILLA Privat', 'Eurospar', 'Futterhaus', 'Hagebau', 'Interspar', 'Spar', 'Spar Gourmet', 'SPAR Privat Popovic', 'Zoofachhandel', 'Lezanimo', 'Wau Miau'];
const markets: AdminMarket[] = chains.map((chain, index) => ({
  id: `test-market-${index}`, internalId: String(index + 1), name: `Testmarkt ${index + 1}`,
  chain, banner: `Banner ${index}`, address: `Teststraße ${index + 1}`, city: 'Wien', postalCode: '1010',
  currentVisits: index % 3, frequency: 12, isActive: true,
  gebietsleiter: 'test-gl', gebietsleiterName: 'Test GL',
}));
const gl = { id: 'test-gl', name: 'Test GL', address: 'Teststraße 1', city: 'Wien', phone: '', email: 'test@example.invalid' };
const testModule = { id: 'test-module', name: 'Testmodul', questionCount: 0, questions: [], createdAt: '2026-09-01' };
const fragebogen = { id: 'test-fb', name: 'Testfragebogen', startDate: '2026-09-01', endDate: '2026-12-31', status: 'active' as const, moduleIds: [testModule.id], marketIds: markets.map(m => m.id), assignedGLCount: 1, responseCount: 0, createdAt: '2026-09-01' };
const view = new URLSearchParams(location.search).get('view') || 'create';
const writes: string[] = [];
const errors: string[] = [];
Object.assign(window, { __blockedWrites: writes, __consoleErrors: errors });
const originalError = console.error;
console.error = (...args: unknown[]) => { errors.push(args.map(String).join(' ')); originalError(...args); };
window.addEventListener('error', event => errors.push(event.message));
window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
const reply = (data: unknown) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
window.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href);
  const method = init?.method || (input instanceof Request ? input.method : 'GET');
  if (method !== 'GET') { writes.push(`${method} ${url.pathname}`); throw new Error('Fixture blocks all writes'); }
  if (url.pathname.endsWith('/admin-comment')) return reply({ comment: '' });
  if (url.pathname.endsWith('/market-status')) return reply([]);
  if (url.pathname.endsWith('/chain-performance')) return reply(null);
  if (url.pathname.endsWith('/gebietsleiter')) return reply([gl]);
  if (url.pathname.endsWith('/action-history')) return reply([]);
  throw new Error(`Fixture blocks unexpected request: ${url.pathname}`);
};
marketService.getAllMarkets = async () => {
  if (view === 'markets-error') throw new Error('Expected fixture loading failure');
  return markets;
};
const blockSave = async () => { writes.push('Unexpected save callback'); return false; };
const close = () => {};
const content = (() => {
  switch (view) {
    case 'edit': return <MarketDetailsModal market={markets[4]} allMarkets={markets} availableGLs={[]} onClose={close} onSave={blockSave} />;
    case 'markets':
    case 'markets-error': return <MarketsPage />;
    case 'wave': return <WelleMarketSelectorModal isOpen selectedMarketIds={[]} onClose={close} onConfirm={close} />;
    case 'create-fragebogen': return <CreateFragebogenModal isOpen availableModules={[testModule]} editingFragebogen={fragebogen} onClose={close} onSave={blockSave} />;
    case 'detail-fragebogen': return <FragebogenDetailModal fragebogen={fragebogen} modules={[]} onClose={close} />;
    case 'export': return <FragebogenDistributionExportModal isOpen isExporting={false} fragebogenOptions={[{ id: 'test-fb', name: 'Testfragebogen', availableChains: chains, yesnoQuestions: [{ id: 'q1', label: 'Testfrage', distributionsziel: true }] }]} onClose={close} onExport={async selection => { Object.assign(window, { __exportSelection: selection }); }} />;
    case 'admin-gl': return <GLDetailModal gl={gl} allMarkets={[...markets, { ...markets[0], id: 'unassigned-other', chain: 'Other GL chain', gebietsleiter: 'other-gl' }]} onClose={close} />;
    case 'gl': return <MarketsVisitedModal isOpen markets={markets} userId="test-gl" onClose={close} />;
    default: return <CreateMarketModal allMarkets={markets} availableGLs={[]} onClose={close} onSave={blockSave} />;
  }
})();
createRoot(document.getElementById('root')!).render(content);
