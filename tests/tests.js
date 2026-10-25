(function () {
  'use strict';
  const { analyzeHTML, markdownReport, MAX_LENGTH } = window.AccessLens;
  const suite = [];
  const test = (name, run) => suite.push([name, run]);
  const eq = (actual, expected) => { if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)}; got ${JSON.stringify(actual)}`); };
  const rules = html => analyzeHTML(html).findings.map(f => f.rule);
  function err(html, expected) {
    let message = '';
    try { analyzeHTML(html); } catch (e) { message = e.message; }
    if (!message.includes(expected)) throw new Error(`Expected an error containing ${JSON.stringify(expected)}, got ${JSON.stringify(message)}`);
  }
  test('Missing image alt is detected', () => eq(rules('<img src="a.jpg">').filter(r => r === 'image-alt').length, 1));
  test('Decorative empty alt is accepted', () => eq(rules('<img src="a.jpg" alt="">').length, 0));
  test('Empty link is detected', () => eq(rules('<a href="/go"></a>')[0], 'empty-link'));
  test('Link with text is accepted', () => eq(rules('<a href="/go">Go to schedule</a>').length, 0));
  test('Image-only link with nonempty alt has a name', () => eq(rules('<a href="/"><img alt="Home" src="a.png"></a>').length, 0));
  test('Empty aria-label does not count as name', () => eq(rules('<a href="/" aria-label=" "></a>')[0], 'empty-link'));
  test('ARIA labelled-by existing text counts', () => eq(rules('<span id="name">Details</span><a href="/" aria-labelledby="name"></a>').length, 0));
  test('Input placeholder alone is not label', () => eq(rules('<input placeholder="Email">')[0], 'form-label'));
  test('Explicit form label counts', () => eq(rules('<label for="email">Email</label><input id="email">').length, 0));
  test('Implicit form label counts', () => eq(rules('<label>Search <input name="q"></label>').length, 0));
  test('ARIA label on form field counts', () => eq(rules('<textarea aria-label="Notes"></textarea>').length, 0));
  test('Hidden input is skipped', () => eq(rules('<input type="hidden">').length, 0));
  test('Duplicate id is detected only on second occurrence', () => eq(rules('<div id="same"></div><p id="same"></p>').filter(x => x === 'duplicate-id').length, 1));
  test('Unique ids are accepted', () => eq(rules('<div id="a"></div><p id="b"></p>').length, 0));
  test('Heading jump h1 to h3 is flagged for review', () => eq(rules('<h1>Title</h1><h3>Section</h3>')[0], 'heading-order'));
  test('Progressive h1/h2/h3 outline is accepted', () => eq(rules('<h1>Title</h1><h2>Part</h2><h3>Detail</h3>').length, 0));
  test('First h2 is marked for review', () => eq(rules('<h2>Title</h2>')[0], 'heading-order'));
  test('No fake overall score', () => eq(Object.hasOwn(analyzeHTML('<p>Hello</p>'), 'score'), false));
  test('Markdown export includes original issue and recommendation', () => {
    const report = markdownReport(analyzeHTML('<img src="a">'));
    if (!report.includes('Image missing alt') || !report.includes('EXAMPLE') && !report.includes('Copy-ready example fix')) throw new Error('Expected report detail');
  });
  test('HTML markup remains literal data when analyzed', () => eq(rules('<img src=x onerror="alert(1)">')[0], 'image-alt'));
  test('Empty input shows actionable validation error', () => err('  ', 'Paste HTML'));
  test('Plain text shows actionable validation error', () => err('just words', 'No HTML elements'));
  test('Oversize content shows actionable validation error', () => err('<p>' + 'a'.repeat(MAX_LENGTH) + '</p>', '500,000'));
  test('Non-string input is rejected', () => err(null, 'string'));

  let passed = 0; const target = document.getElementById('results');
  for (const [name, fn] of suite) {
    const li = document.createElement('li');
    try { fn(); li.textContent = `PASS · ${name}`; li.className = 'pass'; passed++; }
    catch (e) { li.textContent = `FAIL · ${name}: ${e.message}`; li.className = 'fail'; }
    target.append(li);
  }
  document.getElementById('summary').textContent = `${passed}/${suite.length} tests passed`;
  document.getElementById('summary').dataset.passed = String(passed);
  document.getElementById('summary').dataset.total = String(suite.length);
})();
