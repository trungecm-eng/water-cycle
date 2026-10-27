import { content, panelMarkup } from '../content.js';

export function createPanel(root) {
  root.body.insertAdjacentHTML('afterbegin', panelMarkup);
  const panel = root.querySelector('.simulation-panel');
  const body = root.querySelector('#panel-body');
  const toggle = root.querySelector('#panel-toggle');
  const groups = [...root.querySelectorAll('[data-group]')];
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem('water-panel') || '{}') || {}; } catch {}
  let collapsed = saved.collapsed === true;
  for (const group of groups) group.open = saved.groups?.[group.dataset.group] !== false;
  function snapshot() {
    return Object.freeze({ collapsed, groups: Object.freeze(Object.fromEntries(groups.map(group => [group.dataset.group, group.open]))) });
  }
  function update() {
    panel.classList.toggle('collapsed', collapsed);
    body.hidden = collapsed;
    toggle.textContent = collapsed ? content.expand : content.collapse;
    toggle.setAttribute('aria-expanded', String(!collapsed));
    try { sessionStorage.setItem('water-panel', JSON.stringify(snapshot())); } catch {}
  }
  toggle.addEventListener('click', () => { collapsed = !collapsed; update(); });
  for (const group of groups) group.addEventListener('toggle', update);
  root.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key.toLowerCase() === 'b') { event.preventDefault(); collapsed = !collapsed; update(); }
  });
  update();
  return { snapshot };
}
