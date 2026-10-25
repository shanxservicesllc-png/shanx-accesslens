(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const flawed = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Garden Club | Sample</title></head>
<body>
  <main>
    <h1>Neighborhood Garden Club</h1>
    <h3>Volunteer updates</h3>
    <img src="garden.jpg">
    <p><a href="/schedule"></a></p>
    <div id="signup">Join the next meetup</div>
    <form>
      <input id="signup" name="email" type="email" placeholder="Email address">
      <label for="visitors">Visitor count</label>
      <input id="visitors" type="number">
      <button type="submit">Join</button>
    </form>
  </main>
</body>
</html>`;
  const corrected = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Garden Club | Sample</title></head>
<body>
  <main>
    <h1>Neighborhood Garden Club</h1>
    <h2>Volunteer updates</h2>
    <img src="garden.jpg" alt="Garden volunteers planting seedlings">
    <p><a href="/schedule">View volunteer schedule</a></p>
    <div id="signup-title">Join the next meetup</div>
    <form>
      <label for="signup-email">Email address</label>
      <input id="signup-email" name="email" type="email" placeholder="Email address">
      <label for="visitors">Visitor count</label>
      <input id="visitors" type="number">
      <button type="submit">Join</button>
    </form>
  </main>
</body>
</html>`;
  let sourceName = 'Pasted HTML';
  let current = null;
  let clipboardMessage = null;
  const input = $('htmlInput');
  function counts() { $('charCount').textContent = `${input.value.length.toLocaleString()} characters`; }
  function showError(message) { $('errorText').textContent = message; $('errorText').hidden = !message; }
  function clearResults() {
    current = null;
    for (const id of ['highCount', 'mediumCount', 'reviewCount']) $(id).textContent = '–';
    $('resultState').textContent = 'Not inspected'; $('resultState').classList.remove('done');
    $('introText').textContent = 'Run an inspection to see what needs attention. Start with the flawed example to see AccessLens in action.';
    $('findingHeader').textContent = 'FINDINGS / —';
    $('exportReport').disabled = true; $('copyReport').disabled = true;
    $('findings').replaceChildren(emptyMessage('Your findings will appear here.', 'Each includes the element, reason, and copy-ready repair.'));
    $('priorityFilter').value = 'all';
  }
  function setSource(value, name) { input.value = value; sourceName = name; counts(); clearResults(); showError(''); }
  function emptyMessage(main, detail) {
    const div = document.createElement('div'); div.className = 'empty-state';
    const glyph = document.createElement('div'); glyph.className = 'empty-icon'; glyph.textContent = '⌕'; glyph.setAttribute('aria-hidden', 'true');
    const detailSpan = document.createElement('span'); detailSpan.textContent = detail;
    div.append(glyph, document.createTextNode(main), detailSpan); return div;
  }
  function addEl(parent, tag, className, text) {
    const el = document.createElement(tag); if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    parent.append(el); return el;
  }
  async function copyText(text, button) {
    const original = button.textContent;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied ✓';
    } catch {
      // Fallback for local file:// contexts without the modern Clipboard API.
      const temp = document.createElement('textarea');
      temp.value = text; temp.setAttribute('readonly', '');
      temp.style.position = 'fixed'; temp.style.left = '-9999px';
      document.body.append(temp); temp.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { /* browser denied */ }
      temp.remove();
      if (!copied) { button.textContent = 'Copy unavailable'; return; }
      button.textContent = 'Copied ✓';
    }
    if (clipboardMessage) clearTimeout(clipboardMessage);
    clipboardMessage = setTimeout(() => { button.textContent = original; }, 1400);
  }
  function render() {
    if (!current) return;
    const filter = $('priorityFilter').value;
    const shown = current.findings.filter(f => filter === 'all' || f.priority === filter);
    const box = $('findings'); box.replaceChildren();
    if (!shown.length) {
      box.append(emptyMessage(current.total === 0 ? 'No issues detected in these five checks.' : 'No findings in this filter.',
        current.total === 0 ? 'A human accessibility review is still required.' : 'Choose “All findings” to view the rest.'));
      return;
    }
    for (const f of shown) {
      const article = addEl(box, 'article', 'finding');
      const heading = addEl(article, 'div', 'finding-heading');
      const titleGroup = addEl(heading, 'div', 'finding-title');
      addEl(titleGroup, 'span', 'issue-number', f.id); titleGroup.append(document.createTextNode(f.title));
      addEl(heading, 'span', `priority ${f.priority}`, f.priority === 'high' ? 'High' : f.priority === 'medium' ? 'Medium' : 'Review');
      addEl(article, 'div', 'location', f.selector || '(document root)');
      addEl(article, 'p', '', f.description);
      addEl(article, 'div', 'snip-label', 'FOUND ELEMENT');
      addEl(article, 'pre', '', f.element);
      const fixHead = addEl(article, 'div', 'fix-line');
      addEl(fixHead, 'div', 'snip-label', 'EXAMPLE REPAIR');
      const copy = addEl(fixHead, 'button', 'copy-fix', 'Copy fix');
      copy.type = 'button'; copy.setAttribute('aria-label', `Copy fix for ${f.id}`);
      copy.addEventListener('click', () => copyText(f.suggestedFix, copy));
      addEl(article, 'pre', '', f.suggestedFix);
    }
  }
  function inspect() {
    showError('');
    try {
      current = window.AccessLens.analyzeHTML(input.value, sourceName);
      $('highCount').textContent = current.counts.high;
      $('mediumCount').textContent = current.counts.medium;
      $('reviewCount').textContent = current.counts.review;
      $('resultState').textContent = 'Inspected'; $('resultState').classList.add('done');
      $('introText').textContent = `${current.total} specific finding${current.total === 1 ? '' : 's'} across five static checks. These priorities guide review, not WCAG conformance.`;
      $('findingHeader').textContent = `FINDINGS / ${current.total}`;
      $('priorityFilter').value = 'all';
      $('exportReport').disabled = false; $('copyReport').disabled = false;
      render();
    } catch (error) { clearResults(); showError(error?.message || 'Unable to inspect HTML.'); }
  }
  function exportReport() {
    if (!current) return;
    const blob = new Blob([window.AccessLens.markdownReport(current)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'accesslens-report.md';
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('loadFlawed').addEventListener('click', () => setSource(flawed, 'Flawed Garden Club example'));
  $('loadCorrected').addEventListener('click', () => setSource(corrected, 'Corrected Garden Club example'));
  $('fileInput').addEventListener('change', async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.size > 1000000) { showError('File is too large. Choose one under 1 MB.'); event.target.value = ''; return; }
    try { setSource(await file.text(), file.name); } catch { showError('Unable to read that local file.'); }
    event.target.value = '';
  });
  input.addEventListener('input', () => { sourceName = 'Pasted HTML'; counts(); clearResults(); showError(''); });
  $('analyzeButton').addEventListener('click', inspect);
  $('clearButton').addEventListener('click', () => setSource('', 'Pasted HTML'));
  $('priorityFilter').addEventListener('change', render);
  $('exportReport').addEventListener('click', exportReport);
  $('copyReport').addEventListener('click', () => { if (current) copyText(window.AccessLens.markdownReport(current), $('copyReport')); });
  counts();
})();
