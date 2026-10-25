/* Dependency-free Node tests against the exact browser analyzer and browser test cases.
 * Uses a Python stdlib HTMLParser DOM test-double because Node has no DOMParser.
 * The browser-native tests/run-tests.html remains the authoritative browser runner.
 */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.join(__dirname, '..');
class Element {
  constructor(data, parent) {
    this.tagName = data.tag.toUpperCase();
    this.attrs = data.attrs || {};
    this.parentElement = parent || null;
    this.parts = (data.parts || []).map(part => typeof part === 'string' ? part : new Element(part, this));
  }
  get children() { return this.parts.filter(x => x instanceof Element); }
  get nodeType() { return 1; }
  getAttribute(a) { return Object.hasOwn(this.attrs, a) ? this.attrs[a] : null; }
  hasAttribute(a) { return Object.hasOwn(this.attrs, a); }
  get textContent() { return this.parts.map(x => typeof x === 'string' ? x : x.textContent).join(''); }
  get outerHTML() {
    if (this.tagName === '#DOCUMENT') return this.parts.map(x => typeof x === 'string' ? x : x.outerHTML).join('');
    const tag = this.tagName.toLowerCase();
    const attrs = Object.entries(this.attrs).map(([k,v]) => ` ${k}="${v}"`).join('');
    const voids = ['img','input','hr','meta','br','link'];
    const open = `<${tag}${attrs}>`;
    return voids.includes(tag) ? open : open + this.parts.map(x => typeof x === 'string' ? x : x.outerHTML).join('') + `</${tag}>`;
  }
  closest(selector) { let el=this; while(el) {if(el.tagName.toLowerCase() === selector) return el; el=el.parentElement;}return null; }
  querySelectorAll(selector) {
    const result=[];
    const match=(el,s) => {
      const tag=el.tagName.toLowerCase();
      if(s==='img:not([alt])') return tag==='img'&&!el.hasAttribute('alt');
      if(s==='img[alt]:not([alt=""])') return tag==='img'&&el.hasAttribute('alt')&&el.getAttribute('alt')!=='';
      if(s==='[id]') return el.hasAttribute('id');
      if(s==='label[for]') return tag==='label'&&el.hasAttribute('for');
      return s.split(/,\s*/).map(x=>x.trim()).includes(tag);
    };
    const walk = el => { for(const c of el.children) { if (match(c,selector)) result.push(c); walk(c); }};
    if(selector==='svg > title') {
      for(const svg of this.querySelectorAll('svg')) result.push(...svg.children.filter(c=>c.tagName==='TITLE'));
    } else walk(this);
    return result;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
class Document extends Element {
  constructor(d) { super(d, null); }
  getElementById(id) { return this.querySelectorAll('[id]').find(el=>el.getAttribute('id')===id) || null; }
}
class DOMParser {
  parseFromString(html) {
    const child = cp.spawnSync('python', [path.join(__dirname, 'dom_bridge.py')], {input: html, encoding: 'utf8', maxBuffer: 3e6});
    if(child.status!==0) throw new Error('DOM test double failed: '+child.stderr);
    return new Document(JSON.parse(child.stdout));
  }
}
const source = fs.readFileSync(path.join(root, 'analyzer.js'),'utf8');
const results=[];
const output={append(item){results.push(item.textContent)}, replaceChildren(){results.length=0}};
const summary={textContent:'',dataset:{}};
const document={getElementById(id){return id==='results'?output:id==='summary'?summary:null},createElement(tag){return {tagName:tag,className:'',textContent:''}}};
const ctx=vm.createContext({DOMParser,document,console});
ctx.window=ctx;
vm.runInContext(source,ctx,{filename:'analyzer.js'});
vm.runInContext(fs.readFileSync(path.join(__dirname, 'tests.js'),'utf8'),ctx,{filename:'tests.js'});
for(const result of results) console.log(result);
console.log(summary.textContent + ' (Node DOM test double)');
if (summary.dataset.passed !== summary.dataset.total) process.exitCode=1;

// Integration fixtures: exact shipped fixture contents, analyzed by the app's own core.
const analyzeHTML=ctx.AccessLens.analyzeHTML;
const markdownReport=ctx.AccessLens.markdownReport;
const flawed=analyzeHTML(fs.readFileSync(path.join(root,'fixtures','flawed.html'),'utf8'),'flawed.html');
const corrected=analyzeHTML(fs.readFileSync(path.join(root,'fixtures','corrected.html'),'utf8'),'corrected.html');
const expected=JSON.stringify({high:3,medium:1,review:1});
if(flawed.total!==5 || JSON.stringify(flawed.counts)!==expected){console.error('FAIL fixture flawed',flawed.counts);process.exitCode=1;}
else console.log('PASS fixture flawed: 5 findings (3 high, 1 medium, 1 review)');
if(corrected.total!==0){console.error('FAIL fixture corrected',corrected.counts);process.exitCode=1;}
else console.log('PASS fixture corrected: 0 findings');
fs.writeFileSync(path.join(root,'evidence','example-flawed-report.md'),markdownReport(flawed));
fs.writeFileSync(path.join(root,'evidence','example-corrected-report.md'),markdownReport(corrected));
