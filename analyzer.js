/* AccessLens: deterministic, browser-local HTML accessibility heuristics.
 * Nothing in inspected markup is inserted into the application's DOM.
 * No external dependencies or remote calls.
 */
(function (root) {
  'use strict';
  const MAX_LENGTH = 500000;
  const checkLabels = {
    'image-alt': 'Image missing alt attribute',
    'empty-link': 'Link lacks a detectable accessible name',
    'form-label': 'Form field lacks a detectable label',
    'duplicate-id': 'Duplicate id attribute',
    'heading-order': 'Heading order needs review'
  };
  const PRIORITY = { high: 0, medium: 1, review: 2 };

  function attrValue(el, attr) { return (el.getAttribute(attr) || '').trim(); }
  function concise(el) {
    const html = el.outerHTML || `<${el.tagName.toLowerCase()}>`;
    const oneLine = html.replace(/\s+/g, ' ').trim();
    return oneLine.length > 220 ? oneLine.slice(0, 217) + '...' : oneLine;
  }
  function cssPath(el) {
    const parts = [];
    for (let cursor = el; cursor && cursor.nodeType === 1 && parts.length < 5; cursor = cursor.parentElement) {
      const tag = cursor.tagName.toLowerCase();
      if (tag === 'html') break;
      const siblings = cursor.parentElement ? Array.from(cursor.parentElement.children).filter(c => c.tagName === cursor.tagName) : [];
      parts.unshift(tag + (siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(cursor) + 1})` : ''));
    }
    return parts.join(' > ');
  }
  function readNameFromIds(doc, value) {
    if (!value.trim()) return '';
    // getElementById is intentionally used instead of selector interpolation.
    return value.trim().split(/\s+/).map(id => doc.getElementById(id)).filter(Boolean)
      .map(el => (el.textContent || '').trim()).filter(Boolean).join(' ');
  }
  function hasAriaName(doc, el) {
    return Boolean(attrValue(el, 'aria-label') || readNameFromIds(doc, attrValue(el, 'aria-labelledby')));
  }
  function hasLinkName(doc, el) {
    if (hasAriaName(doc, el)) return true;
    if ((el.textContent || '').trim()) return true;
    if (el.querySelector('img[alt]:not([alt=""])')) return true;
    // SVG title may give a link a name, but this is still a lightweight heuristic.
    if (el.querySelector('svg > title')?.textContent?.trim()) return true;
    return false;
  }
  function hasFormLabel(doc, el) {
    if (hasAriaName(doc, el)) return true;
    const id = attrValue(el, 'id');
    if (id && Array.from(doc.querySelectorAll('label[for]')).some(label =>
      attrValue(label, 'for') === id && (label.textContent || '').trim())) return true;
    const parentLabel = el.closest('label');
    if (parentLabel && (parentLabel.textContent || '').trim()) return true;
    if (el.tagName.toLowerCase() === 'input' && attrValue(el, 'type').toLowerCase() === 'image' && attrValue(el, 'alt')) return true;
    return false;
  }
  function issue(id, rule, priority, el, description, suggestedFix) {
    return { id, rule, title: checkLabels[rule], priority, selector: cssPath(el), element: concise(el), description, suggestedFix };
  }
  function formSnippet(el) {
    const tag = el.tagName.toLowerCase();
    const id = attrValue(el, 'id');
    const type = attrValue(el, 'type');
    const idFor = id && !/[^a-zA-Z0-9_:\-.]/.test(id) ? id : 'email';
    const sample = tag === 'textarea' ? `<textarea id="${idFor}"></textarea>` : tag === 'select'
      ? `<select id="${idFor}"><option>Choose an option</option></select>`
      : `<input id="${idFor}"${type ? ` type="${type.replace(/[^a-zA-Z-]/g, '')}"` : ''}>`;
    return `<label for="${idFor}">Descriptive field name</label>\n${sample}`;
  }
  function analyzeHTML(source, sourceName = 'Untitled HTML') {
    if (typeof source !== 'string') throw new TypeError('HTML must be a string.');
    if (!source.trim()) throw new Error('Paste HTML or load a .html file before analyzing.');
    if (source.length > MAX_LENGTH) throw new Error('HTML exceeds the 500,000-character local limit.');
    // Prevent empty/plain-text pages from being misrepresented as inspected markup.
    if (!/<[a-z][\s\S]*?>/i.test(source)) throw new Error('No HTML elements found. Enter markup such as <main>...</main>.');
    // Put a restrictive CSP first in the inert document to suppress image/frame loads.
    // The inspected text never becomes live application markup.
    const csp = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src \'none\'; frame-src \'none\'; connect-src \'none\'; media-src \'none\'">';
    const doc = new DOMParser().parseFromString(csp + source, 'text/html');
    const findings = [];
    let seq = 1;
    const push = (rule, priority, el, description, suggestedFix) =>
      findings.push(issue(`AL-${String(seq++).padStart(3, '0')}`, rule, priority, el, description, suggestedFix));

    for (const img of doc.querySelectorAll('img:not([alt])')) {
      push('image-alt', 'high', img,
        'This image has no alt attribute. Describe meaningful images; decorative images should use alt="".',
        '<img src="image.jpg" alt="Describe the meaningful image">\n<!-- If purely decorative, use alt="" instead. -->');
    }
    for (const link of doc.querySelectorAll('a')) {
      if (!hasLinkName(doc, link)) {
        push('empty-link', 'high', link,
          'No readable text, detectable ARIA label, or nonempty image alt text was found for this link.',
          '<a href="/destination">Descriptive destination text</a>');
      }
    }
    for (const field of doc.querySelectorAll('input, select, textarea')) {
      const type = attrValue(field, 'type').toLowerCase();
      if (field.tagName.toLowerCase() === 'input' && ['hidden', 'submit', 'reset', 'button'].includes(type)) continue;
      if (!hasFormLabel(doc, field)) {
        push('form-label', 'high', field,
          'This interactive field has no explicit, enclosing, or detectable ARIA label. Placeholder text alone is not a label.',
          formSnippet(field));
      }
    }
    const ids = new Map();
    for (const node of doc.querySelectorAll('[id]')) {
      const id = node.getAttribute('id');
      if (ids.has(id)) {
        push('duplicate-id', 'medium', node,
          `The id ${JSON.stringify(id)} is already used by ${cssPath(ids.get(id)) || 'an earlier element'}. IDs should be unique in a document.`,
          `<!-- Give this element a unique id instead of ${JSON.stringify(id)}. -->`);
      } else ids.set(id, node);
    }
    let previousLevel = 0;
    for (const heading of doc.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
      const level = Number(heading.tagName.slice(1));
      if (previousLevel === 0 && level !== 1) {
        push('heading-order', 'review', heading,
          `The first heading is an h${level}, not an h1. Review the page's intended outline.`,
          '<h1>Main page heading</h1>\n<!-- Then use h2 for major sections. -->');
      } else if (previousLevel && level > previousLevel + 1) {
        push('heading-order', 'review', heading,
          `Heading level jumps from h${previousLevel} to h${level}; review the hierarchy.`,
          `<h${previousLevel + 1}>Nested section heading</h${previousLevel + 1}>`);
      }
      previousLevel = level;
    }
    findings.sort((a, b) => PRIORITY[a.priority] - PRIORITY[b.priority] || a.id.localeCompare(b.id));
    const counts = { high: 0, medium: 0, review: 0 };
    for (const finding of findings) counts[finding.priority]++;
    return { product: 'AccessLens', version: '1.0.0', source: String(sourceName).slice(0, 100),
      checks: Object.keys(checkLabels), counts, total: findings.length, findings,
      limitations: 'Five static HTML heuristics only. Not a WCAG conformance audit or an accessibility score. Human and assistive-technology review remain necessary.' };
  }
  function markdownReport(result) {
    const lines = [
      '# AccessLens inspection report', '', `Source: ${result.source}`, 'Mode: Local, static HTML inspection',
      '', '## Findings', '', `Total findings: ${result.total}`, `High priority: ${result.counts.high}`,
      `Medium priority: ${result.counts.medium}`, `Review suggested: ${result.counts.review}`, '',
      '> Priority is a workflow aid, not a WCAG severity rating or conformance claim.', ''
    ];
    if (!result.findings.length) lines.push('No issues were detected by the five checks. This is **not** a compliance pass.', '');
    for (const f of result.findings) {
      lines.push(`### ${f.id}: ${f.title}`, '', `- Priority: ${f.priority}`, `- Rule: ${f.rule}`,
        `- Approximate location: \`${f.selector.replace(/`/g, '\\`')}\``, `- Why: ${f.description}`, '',
        '**Element excerpt**', '', '```html', f.element, '```', '', '**Copy-ready example fix**', '',
        '```html', f.suggestedFix, '```', '');
    }
    lines.push('## Boundaries', '', result.limitations, '',
      'Suggestions are illustrative. Verify semantics, meaning and context before applying. Original input was never modified.', '');
    return lines.join('\n');
  }
  root.AccessLens = Object.freeze({ analyzeHTML, markdownReport, MAX_LENGTH });
})(typeof window !== 'undefined' ? window : globalThis);
