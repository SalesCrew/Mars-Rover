import React from 'react';
import { createRoot } from 'react-dom/client';
import { FragebogenDistributionExportModal } from '../src/components/admin/FragebogenDistributionExportModal';
import '../src/index.css';
import '../src/styles/design-system.css';

// Real export dialog with isolated sample data; no production requests.
window.fetch = async () => { throw new Error('Preview blocks external requests'); };
Object.assign(window, { __consoleErrors: [], __exportSelections: [] });
window.addEventListener('error', event => {
  (window as unknown as { __consoleErrors: string[] }).__consoleErrors.push(event.message);
});
createRoot(document.getElementById('root')!).render(
  <FragebogenDistributionExportModal isOpen isExporting={false}
    fragebogenOptions={[
      { id: 'q2', name: 'Perfect Store PET (Q2)', availableChains: ['Spar', 'Billa+', 'Lezanimo', 'Wau,Miau'],
        yesnoQuestions: [
          { id: 'q2-1', label: 'Whiskas verfügbar?', distributionsziel: true },
          { id: 'q2-2', label: 'Pedigree verfügbar?', distributionsziel: true }
        ] },
      { id: 'q3', name: 'Perfect Store PET Q3', availableChains: ['Spar', 'Billa+', 'Lezanimo', 'Wau,Miau'],
        yesnoQuestions: [
          { id: 'q3-1', label: 'Whiskas verfügbar?', distributionsziel: true },
          { id: 'q3-2', label: 'Pedigree verfügbar?', distributionsziel: true }
        ] }
    ]}
    onClose={() => {}}
    onExport={async selection => {
      (window as unknown as { __exportSelections: unknown[] }).__exportSelections.push(selection);
    }}
  />
);
