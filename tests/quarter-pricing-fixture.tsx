import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '../src/contexts/AuthContext';
import { VorbestellerPage } from '../src/components/admin/VorbestellerPage';
import { VorbestellerModal } from '../src/components/gl/VorbestellerModal';
import '../src/index.css';
import '../src/styles/design-system.css';
const query=new URLSearchParams(location.search),mode=query.get('mode')||'admin';
const actualFetch=window.fetch.bind(window);
window.fetch=(input,init)=>{
  const url=new URL(typeof input==='string'?input:input instanceof Request?input.url:String(input),location.href);
  if(!['127.0.0.1','localhost'].includes(url.hostname))throw new Error('Synthetic fixture blocked external request');
  const headers=new Headers(init?.headers);headers.set('test-role',mode==='gl'?'gl':'admin');
  return actualFetch(input,{...init,headers});
};
const actor='00000000-0000-4000-8000-000000000099';
localStorage.setItem('mars_rover_user',JSON.stringify({id:actor,gebietsleiter_id:actor,role:'gl',username:'synthetic',email:'synthetic@example.invalid',firstName:'Synthetic',lastName:'GL'}));
localStorage.setItem('mars_rover_access_token','isolated-fixture');localStorage.setItem('mars_rover_refresh_token','isolated-fixture');
function App(){const[open,setOpen]=useState(false);return mode==='gl'?<AuthProvider><VorbestellerModal isOpen onClose={()=>{}} preSelectedWaveId={query.get('wave')}/></AuthProvider>:<><button onClick={()=>setOpen(true)}>Neue synthetische Welle</button><VorbestellerPage isCreateWelleModalOpen={open} onOpenCreateWelleModal={()=>setOpen(true)} onCloseCreateWelleModal={()=>setOpen(false)}/></>;}
createRoot(document.getElementById('root')!).render(<App/>);
