const assert = (condition, message) => { if (!condition) throw new Error(message); };
const settle = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const button = text => [...document.querySelectorAll('button')].find(item => item.textContent.trim() === text);
const dates = () => [...document.querySelectorAll('input[type=date]')];
const setDate = async (index, value) => {
  const input = dates()[index];
  // React tracks native values; use the native setter to mimic input changes.
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await settle();
};

export async function verify() {
  assert(window.__exportSelections, 'Isolated export fixture required');
  const questionCheckboxes = [...document.querySelectorAll('input[type=checkbox]')]
    .filter(input => /verfügbar/.test(input.closest('label')?.textContent || ''));
  questionCheckboxes.forEach(input => { if (!input.checked) input.click(); });
  await settle();
  await setDate(0, '2026-05-01');
  await setDate(1, '2026-09-30');
  button('Exportieren').click();
  await settle();
  const selection = window.__exportSelections.at(-1);
  assert(selection.startDate === '2026-05-01' && selection.endDate === '2026-09-30', 'Dates missing from export callback');
  assert(selection.questionIds.length === 4, 'Historical source question IDs must stay selected');
  const count = window.__exportSelections.length;
  await setDate(0, '2026-10-01');
  button('Exportieren').click();
  await settle();
  assert(window.__exportSelections.length === count, 'Invalid range must not export');
  assert(document.body.textContent.includes('Beginn-Datum darf nicht'), 'Missing invalid range message');
  button('Zeitraum zurücksetzen').click();
  await settle();
  assert(dates().every(input => !input.value), 'Reset must clear both dates');
  button('Exportieren').click();
  await settle();
  assert(window.__exportSelections.at(-1).startDate === undefined, 'All dates must remain an available export');
  await setDate(0, '2026-05-01');
  await setDate(1, '2026-09-30');
  document.activeElement?.blur();
  return { pass: true, dateRange: selection, errors: window.__consoleErrors };
}
