import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '../src/contexts/AuthContext';
import { VorbestellerHistoryPage } from '../src/components/gl/VorbestellerHistoryPage';
import '../src/index.css';
import '../src/styles/design-system.css';

const glId = '00000000-0000-4000-8000-000000000001';
const photoWaveId = '00000000-0000-4000-8000-000000000002';
const mixedWaveId = '00000000-0000-4000-8000-000000000003';
const today = new Date();
const date = (dayOffset: number) => {
  const value = new Date(today);
  value.setDate(value.getDate() + dayOffset);
  return value.toISOString().slice(0, 10);
};

localStorage.setItem('mars_rover_user', JSON.stringify({
  id: glId, username: 'vorschau', email: 'vorschau@example.invalid',
  role: 'gl', firstName: 'Julian', lastName: 'Beispiel'
}));
localStorage.setItem('mars_rover_access_token', 'isolated-preview-token');
localStorage.setItem('mars_rover_refresh_token', 'isolated-preview-refresh');

const waves = [
  {
    id: photoWaveId, name: 'BILLA Plus Fotowelle Herbst',
    startDate: date(-10), endDate: date(20), status: 'active',
    goalType: 'percentage', displayCount: 0, kartonwareCount: 0,
    fotoOnly: true, fotoEnabled: true, photoCount: 8
  },
  {
    id: mixedWaveId, name: 'ADEG Platzierungen September',
    startDate: date(-12), endDate: date(18), status: 'active',
    goalType: 'value', currentValue: 48, displayCount: 1, kartonwareCount: 0,
    fotoOnly: false, fotoEnabled: true, photoCount: 2
  }
];

const photoMarkets = {
  [photoWaveId]: [
    { marketId: 'market-1', marketName: 'BILLA Plus', marketChain: 'BILLA Plus', marketAddress: 'Lindengasse 12', marketPostalCode: '4040', marketCity: 'Linz', photoCount: 4, lastUploadedAt: date(-1) + 'T14:20:00Z' },
    { marketId: 'market-2', marketName: 'BILLA Plus', marketChain: 'BILLA Plus', marketAddress: 'Hauptplatz 8', marketPostalCode: '4020', marketCity: 'Linz', photoCount: 3, lastUploadedAt: date(-2) + 'T09:30:00Z' },
    { marketId: 'market-3', marketName: 'BILLA Plus', marketChain: 'BILLA Plus', marketAddress: 'Bahnhofstrasse 5', marketPostalCode: '4600', marketCity: 'Wels', photoCount: 1, lastUploadedAt: date(-4) + 'T11:05:00Z' }
  ],
  [mixedWaveId]: [
    { marketId: 'market-4', marketName: 'ADEG Wöss 4143', marketChain: 'ADEG', marketAddress: 'Kirchenplatz 1', marketPostalCode: '4143', marketCity: 'Neustift', photoCount: 2, lastUploadedAt: date(-1) + 'T15:36:00Z' }
  ]
};

const submissions = [{
  id: 'submission-1', marketName: 'ADEG Wöss 4143', marketChain: 'ADEG',
  marketId: 'market-4', marketAddress: 'Kirchenplatz 1', marketPostalCode: '4143', marketCity: 'Neustift',
  itemType: 'display', itemName: 'Whiskas Snack Display', quantity: 2,
  valuePerUnit: 24, value: 48, timestamp: date(-1) + 'T15:36:00Z'
}];

const reply = (data: unknown) => new Response(JSON.stringify(data), {
  status: 200, headers: { 'Content-Type': 'application/json' }
});

window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (init?.method && init.method !== 'GET') throw new Error('Preview blocks all writes');
  if (url.includes('/wellen/dashboard/waves')) return reply(waves);
  if (url.includes(`/wellen/${photoWaveId}/gl-photo-markets/`)) return reply(photoMarkets[photoWaveId]);
  if (url.includes(`/wellen/${mixedWaveId}/gl-photo-markets/`)) return reply(photoMarkets[mixedWaveId]);
  if (url.includes(`/wellen/${mixedWaveId}/gl-submissions/`)) return reply(submissions);
  if (url.includes('/vorverkauf') || url.includes('/fragebogen/')) return reply([]);
  throw new Error(`Preview blocks unexpected request: ${url}`);
};

createRoot(document.getElementById('root')!).render(
  <AuthProvider><VorbestellerHistoryPage /></AuthProvider>
);
