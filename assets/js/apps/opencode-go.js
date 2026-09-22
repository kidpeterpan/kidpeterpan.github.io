(() => {
  const root = document.getElementById('app-root');
  if (!root) return;

  const {
    normalizeModels,
    valueScores,
    sortModels,
    topBy,
    toMarkdownTable,
    COLUMNS,
    formatDate,
    fmtInt,
    fmtPerf,
    fmtValue,
  } = window.OpenCodeGoCore;

  /* ข้อมูลจาก data/opencode-go.yaml ผ่าน partial app-data.html — ไม่มีไฟล์
     หน้าก็ยังเรนเดอร์เป็นตารางว่างพร้อมข้อความ ไม่พัง */
  const appData = (() => {
    const el = document.getElementById('app-data');
    if (!el) return {};
    try { return JSON.parse(el.textContent) || {}; } catch (e) { return {}; }
  })();

  const models = valueScores(normalizeModels(appData.models));
  const updated = formatDate(appData.updated);

  let sortKey = 'value';
  let sortDir = 'desc';

  root.innerHTML = `
    <div class="app-table-wrap">
      <div class="app-table-head">
        <p class="app-table-title">Comparing ${models.length} models · click a header to sort</p>
        <div class="app-table-actions">
          ${updated ? `<p class="app-updated">Updated ${updated}</p>` : ''}
          <button type="button" class="app-copy-btn" id="ocg-copy">⧉ Copy Top 10 by Quality</button>
        </div>
      </div>
      <div class="app-table" id="ocg-table"></div>
    </div>
  `;

  const table = document.getElementById('ocg-table');
  const copyBtn = document.getElementById('ocg-copy');

  const COPY_LABEL = '⧉ Copy Top 10 by Quality';
  const TOP_N = 10;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(t);
    }
    const ta = document.createElement('textarea');
    ta.value = t;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
  }

  copyBtn.addEventListener('click', () => {
    const md = toMarkdownTable(topBy(models, 'perf', TOP_N));
    copyText(md)
      .then(() => {
        copyBtn.textContent = 'Copied ✓';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = COPY_LABEL;
          copyBtn.classList.remove('copied');
        }, 1500);
      })
      .catch(() => { copyBtn.textContent = 'Copy failed'; });
  });

  function render() {
    const rows = sortModels(models, sortKey, sortDir);

    const head = COLUMNS.map((c) => {
      const active = c.key === sortKey;
      const arrow = active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
      const aria = active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
      return `<th aria-sort="${aria}"><button type="button" class="sort-btn${active ? ' active' : ''}" data-key="${c.key}">${c.label}${arrow}</button></th>`;
    }).join('');

    const body = rows.length === 0
      ? `<tr class="app-table-ellipsis"><td colspan="${COLUMNS.length}">No model data</td></tr>`
      : rows.map((m) => `
        <tr>
          <td class="model-cell">
            <span class="model-name">${esc(m.name)}</span>
            ${m.note ? `<span class="model-note">${esc(m.note)}</span>` : ''}
          </td>
          <td>${fmtInt(m.req5h)}</td>
          <td>${fmtInt(m.reqWeek)}</td>
          <td>${fmtInt(m.reqMonth)}</td>
          <td>${fmtInt(m.speed)}</td>
          <td>${fmtPerf(m.perf)}</td>
          <td>${fmtValue(m.value)}</td>
        </tr>
      `).join('');

    table.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;

    table.querySelectorAll('.sort-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (key === sortKey) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortKey = key;
          sortDir = key === 'name' ? 'asc' : 'desc';
        }
        render();
      });
    });
  }

  render();
})();
