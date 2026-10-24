#!/usr/bin/env node
/**
 * build_lang_pages.js — 生成根目录页与四个分语言静态页（zh/ zh-hant/ en/ ja/）
 *
 * 背景：四语界面共用同一份 index.html，语言在浏览器端切换。为了让各语言搜索引擎
 * 分别收录，为每种语言生成一个静态子页（/zh/ /zh-hant/ /en/ /ja/）：
 *   - <head> SEO 块按语言本地化（title/description/keywords/OG/JSON-LD/inLanguage）；
 *   - canonical 与 og:url 指向自身，五页共享同一组 hreflang 互指（根目录为 x-default）；
 *   - 资源相对路径加 ../（css/js/favicon），线上与本地 file:// 都能打开；
 *   - <html lang/data-lang> 预置该语言；<head> 引导脚本识别路径后预置语言并写入
 *     localStorage——因此分语言页不弹首访弹窗，根目录页行为完全不变。
 *
 * 用法：在 runelearn/ 根目录执行 `node build_lang_pages.js`（会重写 index.html 的
 * <head> 与四个子页；<body> 从 index.html 逐字复制，改页面结构请直接改 index.html
 * 再重跑本脚本）。
 *
 * 注意：改 SEO 文案或托管域名，只改本文件顶部的 SITE 与 SEO 常量，然后重跑；
 *       不要手改任何页面 <title> 到 JSON-LD </script> 之间的内容（那是生成产物）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;

/* 托管地址（换域名时只改这一处，五个页面 + sitemap 的思路同源） */
const SITE = 'https://sysgrapes.github.io/RuneLearn';

/* 每种语言的 SEO 文案：描述/关键词按语言撰写；
 * 英文用「Roco Script」、日文用「ロコ文」、繁体按台湾用词（与界面口径一致）。 */
const SEO = {
  zh: {
    desc: 'RuneLearn 洛克文：免费的离线小工具——识记英文字母与单词、把英文转换成洛克文字形（可自定义颜色与描边、一键导出透明 PNG），界面支持简体中文、繁體中文、English、日本語四种语言。',
    kw: '洛克文,洛克文字形,RuneLearn,英文字母识记,英语单词记忆,洛克文转换,透明PNG导出,离线工具,English,日本語',
    altName: '洛克文识记与转换',
    langTag: 'zh-CN',
    locale: 'zh_CN'
  },
  'zh-Hant': {
    desc: 'RuneLearn 洛克文：免費的離線小工具——識記英文字母與單字、把英文轉換成洛克文字型（可自訂顏色與描邊、一鍵匯出透明 PNG），介面支援简体中文、繁體中文、English、日本語四種語言。',
    kw: '洛克文,洛克文字型,RuneLearn,英文字母識記,英語單字記憶,洛克文轉換,透明PNG匯出,離線工具,English,日本語',
    altName: '洛克文識記與轉換',
    langTag: 'zh-Hant',
    locale: 'zh_TW'
  },
  en: {
    desc: 'RuneLearn · Roco Script: a free offline tool to learn English letters and words, and to convert English into Roco glyphs (custom colors and outlines, one-click transparent PNG export). The interface supports English, 简体中文, 繁體中文 and 日本語.',
    kw: 'Roco Script,RuneLearn,English letters,English words,learn glyphs,convert text,transparent PNG,offline tool,洛克文,ロコ文',
    altName: 'Learn & Convert the Roco Script',
    langTag: 'en',
    locale: 'en_US'
  },
  ja: {
    desc: 'RuneLearn ロコ文：無料のオフラインツール——英字と英単語を覚えたり、英語をロコ文の字形に変換（色・枠線をカスタム、透明 PNG で書き出し）できます。インターフェースは简体中文 / 繁體中文 / English / 日本語に対応。',
    kw: 'ロコ文,RuneLearn,英字,英単語,学習,変換,透明PNG,オフラインツール,洛克文',
    altName: 'ロコ文の学習と変換',
    langTag: 'ja',
    locale: 'ja_JP'
  }
};

/* 页面表：dir 为空串 = 根目录页（x-default，静态文案为简体中文）；
 * 路径段 → i18n 语言键（zh-hant 目录对应 zh-Hant 语言）。 */
const PAGES = [
  { dir: '',       key: 'zh',      htmlLang: 'zh-CN',   locale: 'zh_CN', multi: true },
  { dir: 'zh',     key: 'zh',      htmlLang: 'zh-CN',   locale: 'zh_CN', multi: false },
  { dir: 'zh-hant', key: 'zh-Hant', htmlLang: 'zh-Hant', locale: 'zh_TW', multi: false },
  { dir: 'en',     key: 'en',      htmlLang: 'en',      locale: 'en_US', multi: false },
  { dir: 'ja',     key: 'ja',      htmlLang: 'ja',      locale: 'ja_JP', multi: false }
];

/* hreflang 互指组：五个页面都带同一组（值与 SITE 同源） */
const HREFLANGS = [
  ['zh', '/zh/'],
  ['zh-Hant', '/zh-hant/'],
  ['en', '/en/'],
  ['ja', '/ja/'],
  ['x-default', '/']
];

/* 从 js/i18n.js 读取各语言 doc.title（保证标题与界面文案同源） */
function loadDocTitles() {
  const src = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
  const sandbox = { window: {}, root: {} };
  sandbox.window = sandbox;            // i18n.js 挂到 window/root 上都行
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'i18n.js' });
  const I = sandbox.RUNE_I18N || (sandbox.window && sandbox.window.RUNE_I18N);
  if (!I || !I.dict || !I.dictOf) throw new Error('i18n.js 未暴露 RUNE_I18N');
  const titles = {};
  PAGES.forEach(p => {
    const d = I.dictOf(p.key) || {};
    titles[p.key] = d['doc.title'] || ('RuneLearn · ' + p.key);
  });
  return titles;
}

/* <head> 引导脚本：五个页面共用（路径命中语言目录 → 预置并记忆、不弹窗） */
function guideScript() {
  return [
    '  <script>',
    '    /* 多语言引导：在首次绘制前确定语言与“首访语言弹窗”状态。',
    '     * 1) 分语言 URL（/zh/ /zh-hant/ /en/ /ja/）：路径即明确的语言选择——预置该语言、',
    '     *    写入记忆（之后访问根目录也保持该语言），不弹首访弹窗；',
    '     * 2) 否则若已记忆语言 → 直接写入 data-lang（字体与文案不闪动）；',
    '     * 3) 首次访问 → 挂 data-lang-gate 让内容先模糊（详见 css/style.css），弹窗由 app.js 构建。',
    '     * 判定逻辑复用 i18n.js 的 readStoredLang()，与 app.js 保持同一套规则。 */',
    '    (function () {',
    '      try {',
    '        var I = window.RUNE_I18N;',
    '        var lang = null;',
    '        /* 路径先转小写再匹配：手输 /zh-Hant/ 也能落到繁體中文（目录名本身是小写 zh-hant） */',
    "        var m = (location.pathname || '').toLowerCase().match(/\\/(zh-hant|zh|en|ja)\\/?$/);",
    '        if (m) {',
    "          lang = (m[1] === 'zh-hant') ? 'zh-Hant' : m[1];",
    '          try {',
    "            var sk = (I && I.storeKey) ? I.storeKey : 'runelearn.lang';",
    "            localStorage.setItem(sk, JSON.stringify(lang));",
    '          } catch (e0) { /* 存储不可用：本次会话仍按路径语言渲染 */ }',
    '        } else {',
    "          lang = (I && I.readStoredLang) ? I.readStoredLang() : null;",
    '        }',
    "        if (lang) {",
    "          document.documentElement.setAttribute('data-lang', lang);",
    '        } else {',
    "          document.documentElement.setAttribute('data-lang-gate', 'pending');",
    '        }',
    '      } catch (e) { /* 读取异常：不模糊，按默认语言正常渲染 */ }',
    '      /* 兜底：万一 app.js 未能执行（脚本缺失/报错），别把页面永远锁在模糊态 */',
    '      window.setTimeout(function () {',
    '        try {',
    "          if (!document.querySelector('.lang-gate')) {",
    "            document.documentElement.removeAttribute('data-lang-gate');",
    '          }',
    '        } catch (e2) { /* 忽略 */ }',
    '      }, 3000);',
    '    })();',
    '  </script>'
  ].join('\n');
}

/* 生成单个页面的 <head>（prefix 为子目录资源前缀 '../'，根目录为空串） */
function buildHead(page, titles, prefix) {
  const s = SEO[page.key];
  const selfUrl = SITE + '/' + (page.dir ? page.dir + '/' : '');
  const L = [];
  L.push('<head>');
  L.push('  <meta charset="UTF-8">');
  L.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  L.push('  <title>' + titles[page.key] + '</title>');
  L.push('  <!-- SEO / 社交分享元数据：由 build_lang_pages.js 生成，勿手改。');
  L.push('       改托管域名或文案请改脚本顶部 SITE / SEO 常量后重跑 `node build_lang_pages.js`。');
  L.push('       分语言页（/zh/ /zh-hant/ /en/ /ja/）各自 canonical + hreflang 互指，根目录为 x-default；');
  L.push('       这些标签只给爬虫与分享卡片看，不影响页面可见内容。 -->');
  L.push('  <meta name="description" content="' + s.desc + '">');
  L.push('  <meta name="keywords" content="' + s.kw + '">');
  L.push('  <link rel="canonical" href="' + selfUrl + '">');
  HREFLANGS.forEach(h => {
    L.push('  <link rel="alternate" hreflang="' + h[0] + '" href="' + SITE + h[1] + '">');
  });
  L.push('  <meta property="og:type" content="website">');
  L.push('  <meta property="og:site_name" content="RuneLearn">');
  L.push('  <meta property="og:url" content="' + selfUrl + '">');
  L.push('  <meta property="og:title" content="' + titles[page.key] + '">');
  L.push('  <meta property="og:description" content="' + s.desc + '">');
  L.push('  <meta property="og:locale" content="' + page.locale + '">');
  const seenLoc = {};
  PAGES.forEach(p => {
    if (p.locale !== page.locale && !seenLoc[p.locale]) {
      seenLoc[p.locale] = 1;
      L.push('  <meta property="og:locale:alternate" content="' + p.locale + '">');
    }
  });
  L.push('  <meta name="twitter:card" content="summary">');
  L.push('  <meta name="twitter:title" content="' + titles[page.key] + '">');
  L.push('  <meta name="twitter:description" content="' + s.desc + '">');
  L.push('  <script type="application/ld+json">');
  L.push('  {');
  L.push('    "@context": "https://schema.org",');
  L.push('    "@type": "WebApplication",');
  L.push('    "name": "RuneLearn",');
  L.push('    "alternateName": "' + s.altName + '",');
  L.push('    "url": "' + selfUrl + '",');
  L.push('    "description": "' + s.desc + '",');
  L.push('    "applicationCategory": "EducationalApplication",');
  L.push('    "operatingSystem": "Any",');
  if (page.multi) {
    L.push('    "inLanguage": ["zh-CN", "zh-TW", "en", "ja"],');
  } else {
    L.push('    "inLanguage": ["' + s.langTag + '"],');
  }
  L.push('    "isAccessibleForFree": true,');
  L.push('    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }');
  L.push('  }');
  L.push('  </script>');
  L.push('  <link rel="icon" type="image/png" href="' + prefix + 'favicon.png">');
  L.push('  <link rel="stylesheet" href="' + prefix + 'css/style.css">');
  L.push('  <!-- 界面文案资源（简体 / 繁體 / English / 日本語）；必须在 app.js 之前加载 -->');
  L.push('  <script src="' + prefix + 'js/i18n.js"></script>');
  L.push(guideScript());
  L.push('</head>');
  return L.join('\n');
}

/* 从 index.html 取出 <body> 起的内容（逐字保留，含全部注释与结构） */
function extractBody(src) {
  const i = src.indexOf('<body>');
  if (i < 0) throw new Error('index.html 中找不到 <body>');
  return src.slice(i);
}

/* 子页资源相对路径加 ../（根目录 prefix 为空串，不做替换） */
function prefixBody(body, prefix) {
  if (!prefix) return body;
  return body
    .split('src="js/wordbank.js"').join('src="' + prefix + 'js/wordbank.js"')
    .split('src="js/app.js"').join('src="' + prefix + 'js/app.js"');
}

/* 生成全部五个页面：{ 相对路径: 文件内容 }（纯函数，测试可直接比对） */
function buildAll(srcHtml) {
  const titles = loadDocTitles();
  const body = extractBody(srcHtml);
  const out = {};
  PAGES.forEach(p => {
    const prefix = p.dir ? '../' : '';
    const html = '<!DOCTYPE html>\n<html lang="' + p.htmlLang + '" data-lang="' + p.key + '">\n' +
      buildHead(p, titles, prefix) + '\n' + prefixBody(body, prefix);
    out[(p.dir ? p.dir + '/' : '') + 'index.html'] = html;
  });
  return out;
}

/* CLI：重写五个文件 */
if (require.main === module) {
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const files = buildAll(src);
  Object.keys(files).forEach(rel => {
    const abs = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, files[rel]);
    console.log('written: ' + rel);
  });
  console.log('done. 5 pages (root + zh/zh-hant/en/ja).');
}

module.exports = { buildAll, SITE, SEO, PAGES, HREFLANGS };
