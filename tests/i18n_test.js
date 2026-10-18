'use strict';
/* 多语言 / 首访语言弹窗 / 释义显隐 验证（离线 Node DOM 桩，零依赖）：node tests\i18n_test.js
 *
 * 覆盖：
 * [1] 资源完整性：四份语言资源 key 对齐、index.html 标注的 key 与简体资源一致、页脚免责声明与源代码入口齐全
 * [1.1] 繁体不是简体的字符替换（用词习惯与用字都要对）
 * [1.2] 日语术语：洛克文 = ロコ文，无「ロック文字」残留
 * [1.3] 英文术语：洛克文 = Roco Script，无 Rune 残留（品牌名 RuneLearn 除外）
 * [2] 页脚语言切换：立即生效（静态文案 / 占位提示 / 难度 / 按钮）+ localStorage 持久化
 * [3] 首访语言弹窗：无语言记忆时内容模糊 + 自绘对话框（标题行/提示分段/按钮各带 data-lang）；
 *     选定后关闭、解除模糊并记住；二次访问不再弹
 * [4] 认单词中文释义：仅简体界面显示（繁体/英/日隐藏），切回简体恢复（判定区与历史悬停提示）
 * [5] 历史数据本地化：旧记录（存的是简体标签）在新语言下也能正确显示
 * [6] 健壮性：非法语言值、localStorage 抛错、语言资源缺失、CSS 字体栈/弹窗字号/placeholder/按钮高度/源代码链接样式与下划线动效/板块描述字号
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const appSrc = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const wbSrc = fs.readFileSync(path.join(__dirname, '../js/wordbank.js'), 'utf8');
const i18nSrc = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8');
const htmlSrc = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const cssSrc = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');

/* ---------- 最小 DOM 桩 ---------- */
function makeEl(tag) {
  const e = {
    tagName: tag || 'DIV', children: [], listeners: {}, attributes: {}, style: {}, value: '', disabled: false,
    _textContent: '', _innerHTML: '', className: '',
    classList: {
      _s: new Set(),
      toggle(c, on) { const has = this._s.has(c); const want = (on === undefined) ? !has : !!on; if (want) this._s.add(c); else this._s.delete(c); },
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); }
    },
    addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); },
    dispatch(t, ev) { (this.listeners[t] || []).slice().forEach(fn => fn(ev || {})); },
    appendChild(c) { this.children.push(c); if (c) c.parentNode = this; return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); if (c) c.parentNode = null; return c; },
    remove() { },
    focus() { },
    querySelector() { return null; }, querySelectorAll() { return []; },
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; },
    removeAttribute(k) { delete this.attributes[k]; },
    getContext() { return { measureText(t) { return { width: String(t).length * 40 }; }, font: '', fillText() { }, clearRect() { } }; },
    toBlob(cb) { cb({}); }
  };
  Object.defineProperty(e, 'textContent', { get() { return (this.children && this.children.length) ? this.children.map(c => c.textContent || '').join('') : this._textContent; }, set(v) { this._textContent = String(v); this.children = []; } });
  Object.defineProperty(e, 'innerHTML', { get() { return this._innerHTML; }, set(v) { this._innerHTML = String(v); } });
  Object.defineProperty(e, 'parentNode', { get() { return this._parent || null; }, set(v) { this._parent = v; } });
  return e;
}

/* 从 index.html 抽出所有 data-i18n / data-i18n-title 标注（含 HTML 里的默认中文） */
function scanHtmlKeys() {
  const keys = [], titles = [], reKey = /data-i18n="([^"]+)"[^>]*>([^<]*)/g, reTitle = /data-i18n-title="([^"]+)"[^>]*title="([^"]*)"/g;
  let m;
  while ((m = reKey.exec(htmlSrc))) keys.push({ key: m[1], text: m[2].trim() });
  while ((m = reTitle.exec(htmlSrc))) titles.push({ key: m[1], text: m[2] });
  return { keys, titles };
}
const HTML_KEYS = scanHtmlKeys();

function build(opts) {
  opts = opts || {};
  const els = {};
  const mk = (id) => { const e = makeEl('DIV'); e.id = id; els[id] = e; return e; };
  ['convert-input', 'convert-stage', 'convert-color', 'convert-stroke', 'convert-size', 'convert-stroke-color', 'convert-hint',
    'convert-clear', 'convert-export', 'brand-title', 'letter-glyph', 'letter-input', 'letter-verdict', 'letter-history',
    'letter-submit', 'letter-next', 'letter-history-clear', 'word-glyph', 'word-meta', 'word-input', 'word-verdict', 'word-history',
    'word-submit', 'word-next', 'word-history-clear', 'word-streak-hint', 'difficulty-tabs', 'lang-switch', 'panel-convert',
    'panel-recognize'].forEach(mk);

  // 依 index.html 的真实标注造静态文案桩
  const staticEls = HTML_KEYS.keys.map(item => { const e = makeEl('SPAN'); e.setAttribute('data-i18n', item.key); e._htmlDefault = item.text; return e; });
  const titleEls = HTML_KEYS.titles.map(item => { const e = makeEl('H1'); e.setAttribute('data-i18n-title', item.key); e._htmlDefault = item.text; return e; });

  const difficulties = ['easy', 'med', 'hard', 'expert'].map(k => { const e = makeEl('BUTTON'); e.setAttribute('data-diff', k); return e; });
  const body = makeEl('BODY');
  const documentElement = makeEl('HTML');
  const doc = {
    documentElement, body, title: '',
    querySelector(sel) { const id = sel.replace(/^#/, ''); return els[id] || null; },
    querySelectorAll(sel) {
      if (sel === '[data-i18n]') return staticEls;
      if (sel === '[data-i18n-title]') return titleEls;
      if (sel === '.difficulty') return difficulties;
      if (sel === '.main-tabs .tab') return [makeEl('BUTTON'), makeEl('BUTTON')];
      if (sel === '.sub-tabs .sub-tab') return [makeEl('BUTTON'), makeEl('BUTTON')];
      if (sel === '.script-btn') { const a = makeEl('BUTTON'); a.setAttribute('data-script', 'normal'); const b = makeEl('BUTTON'); b.setAttribute('data-script', 'rune'); return [a, b]; }
      if (sel === '.panel') return [els['panel-convert'], els['panel-recognize']];
      if (sel === '.subpanel') return [makeEl('DIV'), makeEl('DIV')];
      return [];
    },
    createElement(tag) { return makeEl(String(tag || 'div').toUpperCase()); },
    createTextNode(txt) { const e = makeEl('#text'); e._textContent = String(txt); return e; }
  };
  els['word-glyph'].parentNode = { clientWidth: 560, querySelector() { return null; }, appendChild() { }, remove() { } };

  const data = {};
  if (opts.seededLang) data['runelearn.lang'] = JSON.stringify(opts.seededLang);
  if (opts.seed) Object.keys(opts.seed).forEach(k => { data[k] = opts.seed[k]; });
  const storage = {
    _data: data,
    getItem(k) { if (opts.throwGet) throw new Error('denied'); return (k in data) ? data[k] : null; },
    setItem(k, v) { if (opts.throwSet) throw new Error('quota'); data[k] = String(v); },
    removeItem(k) { delete data[k]; }
  };

  const g = {
    document: doc, console, Math, Date, JSON,
    localStorage: storage,
    URL: { createObjectURL() { return 'blob:x'; }, revokeObjectURL() { } },
    setTimeout() { return 1; }, clearTimeout() { },
    window: {
      localStorage: storage, navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      setTimeout() { return 1; }, clearTimeout() { }
    }
  };
  g.global = g;
  if (!opts.noI18n) vm.runInNewContext(i18nSrc, g);
  vm.runInNewContext(wbSrc, g);
  vm.runInNewContext(appSrc, g);
  return { els, doc, storage, staticEls, titleEls, difficulties, ctx: g, body };
}

function findGate(doc) {
  for (let i = 0; i < doc.body.children.length; i++) {
    if (doc.body.children[i].className === 'lang-gate') return doc.body.children[i];
  }
  return null;
}
function gateParts(gate) {
  const card = gate.children[0];
  const lines = card.children[0].children;
  const actions = card.children[1];
  return { card, lines, actions, buttons: actions.children };
}

let fail = 0;
const ck = (name, cond, extra) => { if (!cond) { fail++; console.log('  FAIL:', name, extra === undefined ? '' : '| ' + extra); } else console.log('  ok:', name); };

/* ================= [1] 资源完整性 ================= */
const I18N = (function () { const g = { window: {}, console, Math, JSON, localStorage: { getItem() { return null; }, setItem() { } } }; g.global = g; vm.runInNewContext(i18nSrc, g); return g.window.RUNE_I18N; })();
const LANGS = ['zh', 'zh-Hant', 'en', 'ja'];
const zhKeys = Object.keys(I18N.dict.zh).sort();
ck('[1] 四份语言资源 key 完全一致', LANGS.every(k => JSON.stringify(Object.keys(I18N.dict[k]).sort()) === JSON.stringify(zhKeys)), LANGS.map(k => k + ':' + Object.keys(I18N.dict[k]).length).join(' '));
ck('[1] 语言顺序为 简体中文/繁體中文/English/日本語', I18N.langs.map(l => l.key).join(',') === LANGS.join(',') && I18N.langs.map(l => l.native).join(',') === '简体中文,繁體中文,English,日本語', I18N.langs.map(l => l.native).join('/'));
ck('[1] 语言 locale 标签正确', I18N.langs.map(l => l.locale).join(',') === 'zh-CN,zh-Hant,en,ja');
ck('[1] 首访弹窗四语提示齐全', I18N.gate.title.length === 4 && I18N.gate.tip.length === 4);
const missingKeys = HTML_KEYS.keys.concat(HTML_KEYS.titles).filter(it => LANGS.some(k => !I18N.dict[k][it.key]));
ck('[1] index.html 标注的 key 四种语言都有', missingKeys.length === 0, JSON.stringify(missingKeys));
const mismatch = HTML_KEYS.keys.filter(it => I18N.dict.zh[it.key] !== it.text).concat(HTML_KEYS.titles.filter(it => I18N.dict.zh[it.key] !== it.text));
ck('[1] HTML 静态默认文案与简体资源一致', mismatch.length === 0, JSON.stringify(mismatch));
const phOf = (id) => { const m = new RegExp('id="' + id + '"[^>]*placeholder="([^"]*)"').exec(htmlSrc); return m ? m[1] : null; };
ck('[1] 输入框 placeholder 默认值与简体资源一致',
  phOf('letter-input') === I18N.dict.zh['letter.placeholder.long'] &&
  phOf('word-input') === I18N.dict.zh['word.placeholder.long'] &&
  phOf('convert-input') === I18N.dict.zh['convert.placeholder'],
  [phOf('letter-input'), phOf('word-input'), phOf('convert-input')].join(' / '));
ck('[1] 页脚免责声明四语齐全且非空', LANGS.every(k => !!I18N.dict[k]['footer.disclaimer']), LANGS.map(k => k + ':' + I18N.dict[k]['footer.disclaimer']).join(' | '));
ck('[1] index.html 页脚含免责声明节点（data-i18n="footer.disclaimer"）',
  /data-i18n="footer\.disclaimer"[^>]*>([^<]*)</.test(htmlSrc) && /footer-disclaimer/.test(htmlSrc));
ck('[1] 页脚源代码入口四语齐全且非空', LANGS.every(k => !!I18N.dict[k]['footer.source']), LANGS.map(k => k + ':' + I18N.dict[k]['footer.source']).join(' | '));
ck('[1] index.html 页脚含源代码链接（data-i18n="footer.source"，指向 GitHub 仓库、新窗口打开）',
  /data-i18n="footer\.source"[^>]*>/.test(htmlSrc) &&
  /<a[^>]*class="footer-source"[^>]*href="https:\/\/github\.com\/SysGrapes\/RuneLearn"[^>]*target="_blank"/.test(htmlSrc));

/* ---------- [1.1] 繁体不是简体的字符替换：用词习惯与用字都要对 ---------- */
const HANT = I18N.dict['zh-Hant'], ZH = I18N.dict.zh;
ck('[1.1] 繁体按台湾用词习惯重写（單字/匯出/字型/紀錄/產生/換一題）',
  HANT['word.title'] === '認單字' && HANT['convert.export'] === '匯出透明 PNG' && HANT['convert.size'] === '字型大小' &&
  HANT['history.title'] === '歷史紀錄' && HANT['history.empty'] === '尚無紀錄' && HANT['convert.err.blob'] === '瀏覽器未能產生圖片' &&
  HANT['action.another'] === '換一題' && HANT['convert.desc'].indexOf('自訂') >= 0,
  [HANT['word.title'], HANT['convert.export'], HANT['convert.size'], HANT['history.title']].join(' / '));
const mustDiffer = ['doc.title', 'brand.sub', 'word.title', 'sub.word', 'convert.title', 'convert.size', 'convert.desc', 'convert.export',
  'history.title', 'history.empty', 'action.another', 'convert.err.blob', 'convert.clear', 'letter.placeholder.long', 'footer.slogan'];
const sameOnes = mustDiffer.filter(k => HANT[k] === ZH[k]);
ck('[1.1] 繁体与简体在关键文案上确有差异', sameOnes.length === 0, JSON.stringify(sameOnes));
// 简体专用字不应出现在繁体文案里（粗筛，防止“复制简体忘了改字”）
const SIMPLIFIED_ONLY = '单词汇录历题难专语选择体记识学习确认导显转换时间门问个们页电说让这边为';
const leaked = [];
Object.keys(HANT).forEach(k => {
  for (const ch of HANT[k]) if (SIMPLIFIED_ONLY.indexOf(ch) >= 0) leaked.push(k + ':' + ch);
});
I18N.gate.title.concat(I18N.gate.tip).forEach((s, i) => {
  if (i !== 1 && i !== 5) return;                       // 只查繁体的标题行与提示行
  for (const ch of s) if (SIMPLIFIED_ONLY.indexOf(ch) >= 0) leaked.push('gate[' + i + ']:' + ch);
});
ck('[1.1] 繁体文案里没有简体专用字', leaked.length === 0, JSON.stringify(leaked.slice(0, 12)));
// 繁体的“接口/界面”等习惯差别
ck('[1.1] 繁体用「介面」而非「界面」', I18N.gate.title[1].indexOf('介面') >= 0 && I18N.gate.title[1].indexOf('界面') < 0, I18N.gate.title[1]);

/* ---------- [1.2] 日语术语：洛克文 = ロコ文（Roco 的日文名为 ロコ） ---------- */
const JA = I18N.dict.ja;
const jaAll = Object.keys(JA).map(k => JA[k]).join('\n');
ck('[1.2] 日语统一用「ロコ文」、无「ロック」残留',
  JA['doc.title'].indexOf('ロコ文') >= 0 && JA['brand.sub'].indexOf('ロコ文') >= 0 &&
  JA['convert.title'] === 'ロコ文変換' && JA['tab.recognize'] === 'ロコ文の学習' &&
  JA['convert.scriptRune'] === 'ロコ文' && JA['history.col.glyph'] === 'ロコ文' &&
  JA['letter.desc'].indexOf('ロコ文') >= 0 && JA['word.desc'].indexOf('ロコ文') >= 0 &&
  jaAll.indexOf('ロック') < 0,
  [JA['doc.title'], JA['convert.title'], JA['history.col.glyph']].join(' / '));
ck('[1.2] 日语其他术语一并修正（エキスパート / 解禁 / のみ / 選択後）',
  JA['diff.expert'] === 'エキスパート' && JA['diff.expertLocked'].indexOf('解禁') >= 0 &&
  JA['diff.expertUnlocked'].indexOf('解禁') >= 0 && JA['word.err.invalid'].indexOf('のみ') >= 0 &&
  I18N.gate.tip[3].indexOf('選択後') >= 0,
  [JA['diff.expert'], JA['diff.expertUnlocked'], JA['word.err.invalid']].join(' / '));

/* ---------- [1.3] 英文术语：洛克文 = Roco Script（Rune 只允许出现在品牌名 RuneLearn） ---------- */
const EN = I18N.dict.en;
const enAll = Object.keys(EN).map(k => EN[k]).join('\n');
ck('[1.3] 英文统一用「Roco Script」、无 Rune 残留（品牌名 RuneLearn 除外）',
  EN['doc.title'] === 'RuneLearn · Learn the Roco Script' &&
  EN['brand.sub'] === 'Roco Script · Learn & Convert' &&
  EN['tab.convert'] === 'Roco Converter' && EN['tab.recognize'] === 'Roco Practice' &&
  EN['convert.title'] === 'Roco Converter' && EN['convert.scriptRune'] === 'Roco' &&
  EN['history.col.glyph'] === 'Roco glyph' &&
  EN['letter.desc'].indexOf('Roco glyph') >= 0 && EN['word.desc'].indexOf('Roco script') >= 0 &&
  EN['convert.desc'].indexOf('Roco Script') >= 0 &&
  enAll.replace(/RuneLearn/g, '').indexOf('Rune') < 0,
  [EN['doc.title'], EN['brand.sub'], EN['convert.scriptRune']].join(' / '));

/* ================= [2] 页脚语言切换 ================= */
const A = build({ seededLang: 'zh' });
const swA = A.els['lang-switch'].children;
ck('[2] 页脚生成四个语言按钮且顺序为 简/繁/英/日', swA.length === 4 && swA.map(b => b.getAttribute('data-lang')).join(',') === 'zh,zh-Hant,en,ja', swA.map(b => b.textContent).join(' / '));
ck('[2] 按钮用语言自称（简体中文/繁體中文/English/日本語）', swA.map(b => b.textContent).join(',') === '简体中文,繁體中文,English,日本語');
ck('[2] 当前语言按钮高亮', swA[0].classList.contains('active') && !swA[1].classList.contains('active'));
ck('[2] 已记忆语言时不弹首访弹窗', !findGate(A.doc) && A.doc.documentElement.getAttribute('data-lang-gate') === null);
ck('[2] data-lang-zh 旧标记已废弃（释义显隐改看 data-lang）', A.doc.documentElement.getAttribute('data-lang-zh') === null);

swA[1].dispatch('click');   // → 繁體中文
ck('[2] 切到繁体：<html data-lang/lang> 为 zh-Hant', A.doc.documentElement.getAttribute('data-lang') === 'zh-Hant' && A.doc.documentElement.getAttribute('lang') === 'zh-Hant');
ck('[2] 切到繁体：文案即时切为繁体', A.els['word-meta'].textContent === '難度：簡單' && A.staticEls.every(e => e.textContent === HANT[e.getAttribute('data-i18n')]));
ck('[2] 切到繁体：输入框提示与按钮为繁体', A.els['letter-input'].getAttribute('placeholder') === HANT['letter.placeholder.long'] && A.els['letter-submit'].textContent === HANT['action.submit']);
ck('[2] 切到繁体：记住语言', A.storage._data['runelearn.lang'] === '"zh-Hant"');

swA[2].dispatch('click');   // → English
ck('[2] 切换后 <html data-lang> 立即为 en', A.doc.documentElement.getAttribute('data-lang') === 'en');
ck('[2] 切换后 <html lang> 同步为 en', A.doc.documentElement.getAttribute('lang') === 'en');
ck('[2] 切换后 localStorage 记忆 en', A.storage._data['runelearn.lang'] === '"en"');
ck('[2] 高亮随切换移动', !swA[0].classList.contains('active') && swA[2].classList.contains('active'));
const notEn = A.staticEls.filter(e => e.textContent !== I18N.dict.en[e.getAttribute('data-i18n')]);
ck('[2] 全部静态文案即时切为英文（含页脚免责声明）', notEn.length === 0, '未更新条数=' + notEn.length);
ck('[2] 输入框提示切为英文长版',
  A.els['letter-input'].getAttribute('placeholder') === I18N.dict.en['letter.placeholder.long'] &&
  A.els['word-input'].getAttribute('placeholder') === I18N.dict.en['word.placeholder.long']);
ck('[2] 提交/继续按钮文案切为英文', A.els['letter-submit'].textContent === I18N.dict.en['action.submit'], A.els['letter-submit'].textContent);
ck('[2] 难度文案切为英文（word-meta）', A.els['word-meta'].textContent === 'Level: Easy', A.els['word-meta'].textContent);
ck('[2] 空历史提示切为英文', A.els['letter-history'].innerHTML.includes(I18N.dict.en['history.empty']));

swA[3].dispatch('click');   // → 日本語
ck('[2] 切到日文：<html> 与文案更新', A.doc.documentElement.getAttribute('data-lang') === 'ja' && A.els['word-meta'].textContent === I18N.dict.ja['word.meta'].replace('{diff}', I18N.dict.ja['diff.easy']));
ck('[2] 切到日文：难度按钮/历史表头走日文', A.els['word-history'].innerHTML.includes(I18N.dict.ja['history.empty']));
swA[0].dispatch('click');   // → 简体中文
ck('[2] 切回简体：文案回到简体', A.els['word-meta'].textContent === '难度：简单' && A.staticEls.every(e => e.textContent === I18N.dict.zh[e.getAttribute('data-i18n')]));

/* ================= [3] 首访语言弹窗 ================= */
const C = build({});          // 首次访问：没有语言记忆
const gate = findGate(C.doc);
ck('[3] 首访即构建自绘语言对话框', !!gate);
ck('[3] 首访内容处于模糊门禁态', C.doc.documentElement.getAttribute('data-lang-gate') === 'pending');
ck('[3] 弹窗带入场类 open（过渡动效生效）', !!gate && gate.classList.contains('open'));
const gp = gate ? gateParts(gate) : null;
ck('[3] 弹窗含简/繁/英/日四行标题', !!gp && gp.lines.length === 4 && gp.lines[1].textContent === I18N.gate.title[1] && gp.lines[3].textContent === I18N.gate.title[3]);
ck('[3] 弹窗四行标题各自带 data-lang（按语言选字体）', !!gp && gp.lines.map(l => l.getAttribute('data-lang')).join(',') === 'zh,zh-Hant,en,ja');
ck('[3] 弹窗含四个语言按钮（自绘，非原生 select）', !!gp && gp.buttons.length === 4 && gp.buttons.map(b => b.getAttribute('data-lang')).join(',') === 'zh,zh-Hant,en,ja');
ck('[3] 弹窗按钮用语言自称，不做翻译', !!gp && gp.buttons[1].textContent === '繁體中文' && gp.buttons[3].textContent === '日本語');
ck('[3] 弹窗含四语提示行', !!gate && gate.children[0].children[2] && gate.children[0].children[2].textContent === I18N.gate.tip.join(' · '));
// 提示行按语言分四段渲染，每段带 data-lang（CSS 按段给对应语言字体，避免同屏混排）
const tipEl = gate.children[0].children[2];
const tipSegs = tipEl.children.filter(c => c.tagName !== '#text');
ck('[3] 提示行分四段、各段带 data-lang',
  tipSegs.length === 4 && tipSegs.map(s => s.getAttribute('data-lang')).join(',') === 'zh,zh-Hant,en,ja' &&
  tipSegs[0].textContent === I18N.gate.tip[0] && tipSegs[3].textContent === I18N.gate.tip[3],
  tipSegs.map(s => (s.getAttribute('data-lang') || '?') + '=' + s.textContent.slice(0, 8)).join(' / '));
ck('[3] 提示分段之间以「 · 」连接（3 个分隔文本节点）',
  tipEl.children.filter(c => c.tagName === '#text').map(c => c.textContent).join('') === ' ·  ·  · ');

gp.buttons[3].dispatch('click');   // 选日文
ck('[3] 选择后关闭弹窗（去掉 open，播放淡出）', !gate.classList.contains('open'));
ck('[3] 选择后解除模糊（移除 data-lang-gate）', C.doc.documentElement.getAttribute('data-lang-gate') === null);
ck('[3] 选择后语言立即生效', C.doc.documentElement.getAttribute('data-lang') === 'ja' && C.els['letter-submit'].textContent === I18N.dict.ja['action.submit']);
ck('[3] 选择后记住语言', C.storage._data['runelearn.lang'] === '"ja"');
ck('[3] 选择后静态文案为日文', C.staticEls.every(e => e.textContent === I18N.dict.ja[e.getAttribute('data-i18n')]));

const C2 = build({});              // 首访选繁体（验证弹窗也能选到新语言）
const gate2 = findGate(C2.doc);
gateParts(gate2).buttons[1].dispatch('click');
ck('[3] 首访弹窗可选繁體中文并记住', C2.doc.documentElement.getAttribute('data-lang') === 'zh-Hant' && C2.storage._data['runelearn.lang'] === '"zh-Hant"');
ck('[3] 首访选繁体后文案为繁体', C2.els['letter-submit'].textContent === HANT['action.submit'] && C2.staticEls.every(e => e.textContent === HANT[e.getAttribute('data-i18n')]));

const D = build({ seededLang: 'ja' });   // 二次访问：已有记忆
ck('[3] 二次访问不再弹窗', !findGate(D.doc));
ck('[3] 二次访问不残留模糊', D.doc.documentElement.getAttribute('data-lang-gate') === null);
ck('[3] 二次访问直接按记忆语言渲染', D.doc.documentElement.getAttribute('data-lang') === 'ja' && D.els['word-meta'].textContent === I18N.dict.ja['word.meta'].replace('{diff}', I18N.dict.ja['diff.easy']));
const D2 = build({ seededLang: 'zh-Hant' });   // 记忆为繁体
ck('[3] 记忆为繁体时直接以繁体渲染且不弹窗', !findGate(D2.doc) && D2.doc.documentElement.getAttribute('data-lang') === 'zh-Hant' && D2.els['word-meta'].textContent === '難度：簡單');

/* ================= [4] 认单词中文释义显隐（仅简体显示） ================= */
const Z = build({ seededLang: 'zh' });
const word = Z.els['word-glyph'].textContent;
Z.els['word-input'].value = word;
Z.els['word-submit'].dispatch('click');
ck('[4] 简体界面：判定区展示词性与中文释义', Z.els['word-verdict'].innerHTML.includes('class="sense"') && Z.els['word-verdict'].innerHTML.includes('<span class="word-senses">'));
ck('[4] 简体界面：历史悬停带中文释义', Z.els['word-history'].innerHTML.includes('title="'));
ck('[4] 简体界面：判定标签与按钮为中文', Z.els['word-verdict'].innerHTML.includes(I18N.dict.zh['verdict.right']) && Z.els['word-submit'].textContent === I18N.dict.zh['action.continue']);

Z.els['lang-switch'].children[2].dispatch('click');   // → English
ck('[4] 英文界面：判定区隐藏中文释义', !Z.els['word-verdict'].innerHTML.includes('class="sense"') && !Z.els['word-verdict'].innerHTML.includes('word-senses'));
ck('[4] 英文界面：判定与正确答案仍在（只隐藏释义）', Z.els['word-verdict'].innerHTML.includes(I18N.dict.en['verdict.right']) && Z.els['word-verdict'].innerHTML.includes(word));
ck('[4] 英文界面：历史悬停不再带中文释义', !Z.els['word-history'].innerHTML.includes('title="'));
ck('[4] 英文界面：词库数据本身未被改写', !!JSON.parse(Z.storage._data['runelearn.word.history'])[0].senseText);

Z.els['lang-switch'].children[1].dispatch('click');   // → 繁體中文
ck('[4] 繁体界面：中文释义同样隐藏（释义是简体文本，避免简繁混排）', !Z.els['word-verdict'].innerHTML.includes('class="sense"') && !Z.els['word-verdict'].innerHTML.includes('word-senses'));
ck('[4] 繁体界面：判定与正确答案仍在（只隐藏释义）', Z.els['word-verdict'].innerHTML.includes(word));
ck('[4] 繁体界面：历史悬停不带释义', !Z.els['word-history'].innerHTML.includes('title="'));
ck('[4] 繁体界面：判定/按钮文案为繁体', Z.els['word-verdict'].innerHTML.includes(HANT['verdict.right']) && Z.els['word-submit'].textContent === HANT['action.continue']);
ck('[4] 繁体界面：词库数据同样未被改写', !!JSON.parse(Z.storage._data['runelearn.word.history'])[0].senseText);

Z.els['lang-switch'].children[3].dispatch('click');   // → 日本語
ck('[4] 日文界面：中文释义同样隐藏', !Z.els['word-verdict'].innerHTML.includes('class="sense"') && !Z.els['word-history'].innerHTML.includes('title="'));

Z.els['lang-switch'].children[0].dispatch('click');   // → 简体中文
ck('[4] 切回简体：释义恢复显示', Z.els['word-verdict'].innerHTML.includes('class="sense"'));
ck('[4] 切回简体：历史悬停恢复释义', Z.els['word-history'].innerHTML.includes('title="'));
/* ================= [5] 历史数据本地化（旧记录兼容） ================= */
const H = build({
  seededLang: 'zh',
  seed: {
    'runelearn.word.history': JSON.stringify([{ diff: '简单', answer: 'cat', glyph: 'cat', ok: true, time: '01-01 08:00:00', senseText: 'n. 猫' }]),
    'runelearn.letter.history': JSON.stringify([{ glyph: 'V', answer: 'V 或 W', ok: true, time: '01-01 08:00:01' }])
  }
});
ck('[5] 简体界面：旧记录显示中文标签', H.els['word-history'].innerHTML.includes('>简单<') && H.els['letter-history'].innerHTML.includes('V 或 W'));
H.els['lang-switch'].children[1].dispatch('click');   // → 繁體中文
ck('[5] 繁体界面：难度/表头本地化为繁体', H.els['word-history'].innerHTML.includes('>' + HANT['diff.easy'] + '<') && H.els['word-history'].innerHTML.includes('<th>難度</th>') && H.els['letter-history'].innerHTML.includes('<th>正確答案</th>'));
ck('[5] 繁体界面：旧记录里的纪录提示与表头一致（紀錄）', H.els['word-history'].innerHTML.includes(HANT['history.col.glyph']));
H.els['lang-switch'].children[2].dispatch('click');   // → English
ck('[5] 英文界面：难度/正确答案本地化为英文', H.els['word-history'].innerHTML.includes('>Easy<') && H.els['letter-history'].innerHTML.includes('V or W') && !H.els['word-history'].innerHTML.includes('>简单<'));
ck('[5] 英文界面：历史表头为英文', H.els['word-history'].innerHTML.includes('<th>Level</th>') && H.els['letter-history'].innerHTML.includes('<th>Answer</th>'));
H.els['lang-switch'].children[3].dispatch('click');   // → 日本語
ck('[5] 日文界面：难度/正确答案本地化为日文', H.els['word-history'].innerHTML.includes('>' + I18N.dict.ja['diff.easy'] + '<') && H.els['letter-history'].innerHTML.includes(I18N.dict.ja['letter.answerVW']));
H.els['lang-switch'].children[0].dispatch('click');   // → 简体中文
ck('[5] 切回简体：历史仍显示中文且释义提示恢复', H.els['word-history'].innerHTML.includes('>简单<') && H.els['word-history'].innerHTML.includes('title="n. 猫"'));
ck('[5] 历史数据未被改写（仍是原始中文标签）', JSON.parse(H.storage._data['runelearn.word.history'])[0].diff === '简单');

/* ================= [6] 健壮性 ================= */
const X = build({ seededLang: 'xx' });   // 非法语言值
ck('[6] 非法语言值被忽略并按首访处理', !!findGate(X.doc) && X.doc.documentElement.getAttribute('data-lang') === 'zh');

let threw = false;
try {
  const F = build({ throwGet: true, throwSet: true });
  F.els['lang-switch'].children[1].dispatch('click');
  F.els['letter-next'].dispatch('click');
  F.els['word-next'].dispatch('click');
} catch (e) { threw = true; console.log('    threw: ' + e.message); }
ck('[6] localStorage 读取/写入异常时不崩溃', !threw);

const N = build({ noI18n: true });        // 缺 i18n.js
ck('[6] 缺语言资源时仍能出题（不崩溃）', /^[A-Z]$/.test(N.els['letter-glyph'].textContent) && !!N.els['word-glyph'].textContent);

ck('[6] CSS 定义繁体黑体栈且不含简体专用字体冲突', /--font-hant:\s*"Noto Sans TC"/.test(cssSrc) && /"Microsoft JhengHei UI","Microsoft JhengHei"/.test(cssSrc));
ck('[6] CSS 定义日文字体栈且 Noto Sans JP 优先', /--font-ja:\s*"Noto Sans JP"/.test(cssSrc));
ck('[6] CSS 按 data-lang 切换界面字体（含繁体）',
  /html\[data-lang="ja"\]\s*\{[^}]*--font-cn\s*:\s*var\(--font-ja\)/.test(cssSrc) &&
  /html\[data-lang="zh-Hant"\]\s*\{[^}]*--font-cn\s*:\s*var\(--font-hant\)/.test(cssSrc) &&
  /html\[data-lang="en"\]\s*\{\s*--font-cn\s*:\s*var\(--font-latin\)/.test(cssSrc));
ck('[6] CSS 同屏多语言元素按 data-lang 选字体（语言按钮 / 弹窗标题行 / 提示分段）',
  /\.lang-gate-seg\[data-lang="ja"\]\{font-family:var\(--font-ja\)\}/.test(cssSrc) &&
  /\.lang-gate-seg\[data-lang="zh-Hant"\]\{font-family:var\(--font-hant\)\}/.test(cssSrc) &&
  /\.lang-gate-line\[data-lang="en"\]/.test(cssSrc) && /\.lang-btn\[data-lang="ja"\]/.test(cssSrc));
ck('[6] CSS 首访模糊规则挂在 data-lang-gate 上', /html\[data-lang-gate\]\s+\.page\s*\{[^}]*filter:\s*blur/.test(cssSrc));
ck('[6] CSS 首访弹窗整体字号已放大（标题 20px / 按钮 17px / 提示 14px）',
  /\.lang-gate-line\{font-size:20px/.test(cssSrc) && /\.lang-gate-btn\{[^}]*font-size:17px/.test(cssSrc) && /\.lang-gate-tip\{[^}]*font-size:14px/.test(cssSrc));
ck('[6] CSS 释义兜底规则改为「仅 data-lang="zh" 显示」', /html:not\(\[data-lang="zh"\]\)\s+\.word-senses\s*\{\s*display:\s*none/.test(cssSrc));
ck('[6] data-lang-zh 旧标记已彻底移除（CSS 与 app.js 都不再出现）', cssSrc.indexOf('data-lang-zh') < 0 && appSrc.indexOf('data-lang-zh') < 0);
ck('[6] CSS 为英/日 placeholder 单独收小字号（避免溢出输入框）',
  /html\[data-lang="en"\]\s+\.quiz-answer\s+\.text-input::placeholder,\s*\nhtml\[data-lang="ja"\]\s+\.quiz-answer\s+\.text-input::placeholder\s*\{\s*font-size:\s*18px\s*\}/.test(cssSrc));
ck('[6] CSS 提交按钮与输入框统一 52px 高', /\.quiz-answer\s+\.btn\{[^}]*height:52px/.test(cssSrc));
ck('[6] CSS 页脚免责声明样式存在', /\.footer-disclaimer\{[^}]*font-size/.test(cssSrc));
ck('[6] CSS 源代码链接与免责说明同字号同色、默认无下划线', /\.footer-source\{[^}]*font-size:12\.5px[^}]*color:#b0a688[^}]*text-decoration:none/.test(cssSrc));
ck('[6] CSS 源代码下划线动效：12s（0–10s 可见、10–12s 淡出）', /@keyframes\s+footer-source-underline\{[^}]*0%,83\.333%\{opacity:1\}[^}]*100%\{opacity:0\}/.test(cssSrc) && /\.footer-source::after\{[^}]*animation:footer-source-underline\s+12s/.test(cssSrc));
ck('[6] CSS 三个板块描述文字（panel-desc）字号为 16px', /\.panel-desc\{[^}]*font-size:16px/.test(cssSrc));
ck('[6] index.html 引入 i18n.js 且早于 app.js', htmlSrc.indexOf('js/i18n.js') > -1 && htmlSrc.indexOf('js/i18n.js') < htmlSrc.indexOf('js/app.js'));

console.log(fail === 0 ? '\n[1]~[6] i18n VERIFY: all ok' : ('\nFAILED ' + fail));
process.exit(fail === 0 ? 0 : 1);
