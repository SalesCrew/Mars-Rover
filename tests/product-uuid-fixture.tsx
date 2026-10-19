import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ExcelColumnMapper } from '../src/components/admin/ExcelColumnMapper';
import { VorbestellerModal } from '../src/components/gl/VorbestellerModal';
import { productService } from '../src/services/productService';
import { API_BASE_URL } from '../src/config/database';
import type { Product } from '../src/types/product-types';
import '../src/index.css';
import '../src/styles/design-system.css';

const query = new URLSearchParams(location.search);
const api = new URL(query.get('api')!);
if (api.hostname !== '127.0.0.1') throw new Error('Fixture only permits loopback APIs');
const originalFetch = window.fetch.bind(window);
const state = { imported: [] as Product[], saved: [] as Product[], calls: [] as {url:string;method:string;status:number}[] };
Object.assign(window, { uuidTest: state });
window.fetch = async (input, init) => {
  const raw = String(input);
  if (!raw.startsWith(API_BASE_URL)) throw new Error(`Fixture blocked unexpected fetch: ${raw}`);
  const url = `${api.origin}${raw.slice(API_BASE_URL.length).startsWith('/') ? '/api' : ''}${raw.slice(API_BASE_URL.length)}`;
  const method = init?.method || 'GET';
  const headers = new Headers(init?.headers);
  headers.set('test-role', method === 'POST' && url.endsWith('/products') ? 'admin' : 'gl');
  const response = await originalFetch(url, { ...init, headers });
  state.calls.push({url,method,status:response.status});
  return response;
};
const glId = '00000000-0000-4000-8000-000000000002';
localStorage.setItem('mars_rover_user',JSON.stringify({id:glId,role:'gl',username:'fixture',email:'fixture@example.invalid',firstName:'Test',lastName:'GL',gebietsleiter_id:glId}));
localStorage.setItem('mars_rover_access_token','isolated-fixture');
localStorage.setItem('mars_rover_refresh_token','isolated-fixture');

function App() {
  const [file,setFile] = useState<File | null>(null);
  const [open,setOpen] = useState(query.get('mode') === 'legacy');
  const [done,setDone] = useState(false);
  const imported = async (products:Product[]) => {
    state.imported=products;
    state.saved=await productService.createProducts(products);
    setFile(null);setDone(true);
  };
  return <AuthProvider>
    {!open && <><input aria-label="Excel-Datei" type="file" onChange={e=>setFile(e.target.files?.[0] || null)} />
      {done && <button onClick={()=>setOpen(true)}>Zusatzumsatz erfassen</button>}</>}
    {file && <ExcelColumnMapper file={file} department="pets" onImport={imported} onCancel={()=>setFile(null)} />}
    {open && <VorbestellerModal isOpen onClose={()=>setOpen(false)} preSelectedWaveId="00000000-0000-4000-8000-000000000001" />}
  </AuthProvider>;
}
createRoot(document.getElementById('root')!).render(<App />);
