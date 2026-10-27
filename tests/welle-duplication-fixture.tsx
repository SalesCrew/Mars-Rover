import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { VorbestellerPage } from '../src/components/admin/VorbestellerPage';
import '../src/index.css';
import '../src/styles/design-system.css';

function App() {
  const [open, setOpen] = useState(false);
  return <VorbestellerPage isCreateWelleModalOpen={open}
    onOpenCreateWelleModal={() => setOpen(true)} onCloseCreateWelleModal={() => setOpen(false)} />;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
