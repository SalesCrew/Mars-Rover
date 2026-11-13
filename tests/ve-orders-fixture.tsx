import React,{useState,useEffect} from 'react';import {createRoot} from 'react-dom/client';
import {AuthProvider} from '../src/contexts/AuthContext';
import {VorbestellerModal} from '../src/components/gl/VorbestellerModal';
import VorbestellerHistoryPage from '../src/components/gl/VorbestellerHistoryPage';
import {WaveProgressDetailModal} from '../src/components/admin/WaveProgressDetailModal';
import '../src/index.css';import '../src/styles/design-system.css';
const query=new URLSearchParams(location.search),mode=query.get('mode')||'gl',wave=query.get('wave'),actor='00000000-0000-4000-8000-000000000099';
const actualFetch=window.fetch.bind(window);
window.fetch=(input,init)=>{const url=new URL(typeof input==='string'?input:input instanceof Request?input.url:String(input),location.href);if(!['127.0.0.1','localhost'].includes(url.hostname))throw Error('Isolated fixture blocks external requests');const headers=new Headers(init?.headers);headers.set('test-role',mode==='admin'?'admin':'gl');return actualFetch(input,{...init,headers});};
localStorage.setItem('mars_rover_user',JSON.stringify({id:actor,gebietsleiter_id:actor,role:mode==='admin'?'admin':'gl',username:'synthetic',email:'synthetic@example.invalid',firstName:'Synthetic',lastName:'GL'}));
localStorage.setItem('mars_rover_access_token','isolated-fixture');localStorage.setItem('mars_rover_refresh_token','isolated-fixture');
function App(){const[def,setDef]=useState<any>(null);useEffect(()=>{if(mode==='admin')void fetch(import.meta.env.VITE_API_URL+'/wellen/'+wave).then(r=>r.json()).then(setDef);},[]);return <AuthProvider>{mode==='history'?<VorbestellerHistoryPage/>:mode==='admin'?(def?<WaveProgressDetailModal welle={def} onClose={()=>{}}/>:null):<VorbestellerModal isOpen onClose={()=>{}} preSelectedWaveId={wave}/>}</AuthProvider>;}
createRoot(document.getElementById('root')!).render(<App/>);

