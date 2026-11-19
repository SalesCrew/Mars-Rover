import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '../src/contexts/AuthContext';
import { AdminAccessProvider } from '../src/contexts/AdminAccessContext';
import { WaveProgressDetailModal } from '../src/components/admin/WaveProgressDetailModal';
import { WaveProgressCard } from '../src/components/admin/WaveProgressCard';
import { WelleDetailModal } from '../src/components/admin/WelleDetailModal';
import { VorbestellerModal } from '../src/components/gl/VorbestellerModal';
import VorbestellerHistoryPage from '../src/components/gl/VorbestellerHistoryPage';
import { wellenService, type Welle } from '../src/services/wellenService';
import '../src/index.css';
import '../src/styles/design-system.css';
const query = new URLSearchParams(location.search),
  mode = query.get('mode') || 'admin',
  waveId = query.get('wave')!;
const actualFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const url = new URL(
    typeof input === 'string'
      ? input
      : input instanceof Request
        ? input.url
        : String(input),
    location.href
  );
  if (!['127.0.0.1', 'localhost'].includes(url.hostname))
    throw Error('Fixture blocks external requests');
  const headers = new Headers(init?.headers);
  headers.set(
    'test-role',
    mode === 'gl' || mode === 'history' ? 'gl' : 'admin'
  );
  return actualFetch(input, { ...init, headers });
};
const actor = '00000000-0000-4000-8000-000000000099';
localStorage.setItem(
  'mars_rover_user',
  JSON.stringify({
    id: actor,
    gebietsleiter_id: actor,
    role: mode === 'gl' || mode === 'history' ? 'gl' : 'admin',
    username: 'synthetic',
    email: 'synthetic@example.invalid',
    firstName: 'Synthetic',
    lastName: 'GL',
  })
);
localStorage.setItem('mars_rover_access_token', 'isolated-fixture');
localStorage.setItem('mars_rover_refresh_token', 'isolated-fixture');
function AdminView() {
  const [wave, setWave] = useState<Welle | null>(null);
  useEffect(() => {
    void wellenService.getWelleById(waveId).then(setWave);
  }, []);
  if (!wave) return <p>Laden…</p>;
  return mode === 'detail' ? (
    <WelleDetailModal welle={wave} onClose={() => {}} />
  ) : mode === 'card' ? (
    <WaveProgressCard
      wave={{
        ...wave,
        displayCount: 3,
        displayTarget: 10,
        kartonwareCount: 0,
        kartonwareTarget: 0,
        assignedMarkets: 1,
        participatingGLs: 1,
      }}
    />
  ) : (
    <WaveProgressDetailModal welle={wave} onClose={() => {}} />
  );
}
createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    {mode === 'gl' ? (
      <VorbestellerModal isOpen onClose={() => {}} preSelectedWaveId={waveId} />
    ) : mode === 'history' ? (
      <VorbestellerHistoryPage />
    ) : (
      <AdminAccessProvider>
        <AdminView />
      </AdminAccessProvider>
    )}
  </AuthProvider>
);
