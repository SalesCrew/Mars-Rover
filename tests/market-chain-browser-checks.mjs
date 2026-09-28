// With Vite running, open market-chain-preview.html?view=<view> using agent-browser,
// then evaluate: import('/tests/market-chain-browser-checks.mjs').then(m => m.verify())
const expected = ['Adeg', 'BILLA Plus Privat', 'BILLA Privat', 'Billa+', 'Eurospar', 'Futterhaus', 'Hagebau', 'Interspar', 'Lezanimo', 'Spar', 'Wau,Miau', 'Zoofachhandel'];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const settle = () => new Promise(resolve => setTimeout(resolve, 100));
const button = text => [...document.querySelectorAll('button')].find(element => element.textContent.trim() === text);
const label = text => [...document.querySelectorAll('label')].find(element => element.textContent.trim() === text);
const optionLabels = () => [...document.querySelectorAll('[class*=filterOption]')].filter(element => element.tagName === 'LABEL').map(element => element.textContent.trim()).filter(text => text !== 'Alle');
const checkOptions = labels => assert(JSON.stringify([...labels].sort()) === JSON.stringify([...expected].sort()), `Unexpected chain options: ${JSON.stringify(labels)}`);
const rowAddresses = () => [...new Set([...document.body.innerText.matchAll(/Teststra(?:ß|ss)e (\d+)/gi)].map(match => Number(match[1])))].sort((a, b) => a - b);
const checkRows = async expectedRows => {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (JSON.stringify(rowAddresses()) === JSON.stringify(expectedRows)) return;
    await settle();
  }
  assert(false, `Unexpected market rows: ${JSON.stringify(rowAddresses())}`);
};

export async function verify() {
  const view = new URLSearchParams(location.search).get('view') || 'create';
  await settle();
  if (view === 'create' || view === 'edit') {
    label('Handelskette').parentElement.querySelector('[class*=dropdown]').click();
    await settle();
    checkOptions([...document.querySelectorAll('[class*=dropdownOption]')].map(element => element.textContent.trim()));
    if (view === 'edit') assert(document.querySelector('[class*=dropdownOptionActive]').textContent.trim() === 'BILLA Plus Privat', 'Edit form must canonicalize the existing alias');
  } else if (view === 'export') {
    label('Testfragebogen').querySelector('input').click();
    await settle();
    checkOptions([...document.querySelectorAll('label')].map(element => element.textContent.trim()).filter(text => !['Testfragebogen', 'Testfrage', 'Alles in ein Quartal komprimieren'].includes(text)));
    for (const text of ['Testfrage', 'Lezanimo', 'Wau,Miau']) label(text).querySelector('input').click();
    await settle();
    button('Exportieren').click();
    await settle();
    assert(JSON.stringify(window.__exportSelection.chains) === JSON.stringify(['Lezanimo', 'Wau,Miau']), 'Export must submit canonical selected chains');
  } else if (view === 'gl' || view === 'admin-gl') {
    if (view === 'admin-gl') { button('Märkte').click(); await settle(); }
    for (const [chain, rows] of [['Spar', [12, 13, 14]], ['Billa+', [2, 3, 4]], ['BILLA Plus Privat', [5, 6]], ['Lezanimo', [16]], ['Wau,Miau', [17]]]) {
      if (view === 'gl') { document.querySelector('[class*=chainFilterBtn]').click(); await settle(); }
      const options = [...document.querySelectorAll(view === 'gl' ? '[class*=chainOption]' : '[class*=chainFilterBadge]')];
      checkOptions(options.map(element => element.textContent.trim()).filter(text => text !== 'Alle Ketten'));
      const selected = options.find(element => element.textContent.trim() === chain);
      selected.click();
      await settle();
      await checkRows(rows);
      if (view === 'admin-gl') { selected.click(); await settle(); }
    }
  } else if (['markets', 'wave', 'create-fragebogen', 'detail-fragebogen'].includes(view)) {
    if (view === 'create-fragebogen') { button('Weiter zu Einstellungen').click(); await settle(); }
    if (view === 'detail-fragebogen') { document.querySelector('[class*=marketSelectorButton]').click(); await settle(); }
    if (view === 'markets') labelForMarketHeader().querySelector('button').click();
    else button(view.includes('fragebogen') ? 'Chain' : 'Kette').click();
    await settle();
    checkOptions(optionLabels());
    for (const [chain, rows] of [['Spar', [12, 13, 14]], ['Billa+', [2, 3, 4]], ['BILLA Plus Privat', [5, 6]], ['Lezanimo', [16]], ['Wau,Miau', [17]]]) {
      label(chain).querySelector('input').click();
      await settle();
      await checkRows(rows);
      label(chain).querySelector('input').click();
      await settle();
    }
  } else if (view === 'markets-error') {
    assert(document.body.innerText.includes('Fehler beim Laden der Märkte'), 'Missing load error');
    assert(!document.body.innerText.includes('Hofer') && !document.body.innerText.includes('Merkur'), 'Load failure must not invent chains');
    assert(rowAddresses().length === 0, 'Load failure must not invent markets');
    return { view, pass: true, expectedLoadFailure: true, writes: window.__blockedWrites };
  }
  assert(window.__blockedWrites.length === 0, 'Unexpected write attempt');
  assert(window.__consoleErrors.length === 0, `Console errors: ${JSON.stringify(window.__consoleErrors)}`);
  assert(!document.querySelector('vite-error-overlay'), 'Vite error overlay');
  return { view, pass: true, chainOptions: expected.length, writes: window.__blockedWrites };
}

function labelForMarketHeader() {
  return [...document.querySelectorAll('[class*=headerCell]')].find(element => element.querySelector('span')?.textContent.trim() === 'Handelskette');
}
