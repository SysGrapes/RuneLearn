/* RuneLearn — 洛克文识记与转换
 * 纯前端、无依赖；双击 index.html 即可运行（file:// 下无跨域问题，词库以 script 引入）。
 */
(function () {
  'use strict';

  /* ==================================================================
   * 1. 工具函数
   * ================================================================== */
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  // 词库：RUNE_WORDBANK 由 js/wordbank.js 通过 <script> 注入为全局变量
  var WKB = (typeof window !== 'undefined' && window.RUNE_WORDBANK) || null;

  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  var LS_LETTER = 'runelearn.letter.history';
  var LS_WORD = 'runelearn.word.history';
  var LS_EXPERT = 'runelearn.expertUnlocked';
  var LS_STREAK = 'runelearn.hardStreak';

  var GLYPH_COLOR = '#2f3a4d';

  /* XSS 防护：对任意内容做 HTML 转义 */
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* localStorage 安全读写：任何异常都回退，不抛错 */
  function storeGet(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      var v = JSON.parse(raw);
      return (v === undefined) ? fallback : v;
    } catch (e) { return fallback; }
  }
  function storeSet(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { /* 存储不可用/满时静默放弃 */ }
  }

  /* 规范化输入：去首尾空白、全角字母转半角、转小写 */
  function normalizeInput(s) {
    if (s == null) return '';
    var t = String(s).replace(/\u3000/g, ' ').trim();
    t = t.replace(/[\uFF21-\uFF3A]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); });
    t = t.replace(/[\uFF41-\uFF5A]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); });
    return t.toLowerCase();
  }
  function onlyAtoZ(s) { return /^[a-z]+$/.test(s); }

  /* 安全读取控件值：元素缺失或异常时返回 fallback，避免崩溃 */
  function inputVal(el, fallback) {
    if (!el || typeof el.value === 'undefined') return fallback;
    return el.value;
  }

  function randExcluding(limit, exclude) {
    if (!limit || limit <= 1) return 0;
    var i = Math.floor(Math.random() * limit);
    if (i === exclude) i = (i + 1) % limit;
    return i;
  }

  function nowTime() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
           p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function isVW(str) {
    var L = String(str || '').toUpperCase();
    return L === 'V' || L === 'W';
  }

  /* ==================================================================
   * 2. 板块 / 子板块切换（CSS animation 负责淡入动画）
   * ================================================================== */
  var mainButtons = $$('.main-tabs .tab');
  var subButtons = $$('.sub-tabs .sub-tab');

  function switchMain(name) {
    mainButtons.forEach(function (b) {
      var on = (b.getAttribute('data-main') === name);
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $$('.panel').forEach(function (p) {
      p.classList.toggle('active', (p.getAttribute('data-main') === name));
    });
  }
  function switchSub(name) {
    subButtons.forEach(function (b) {
      var on = (b.getAttribute('data-sub') === name);
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $$('.subpanel').forEach(function (p) {
      p.classList.toggle('active', (p.getAttribute('data-sub') === name));
    });
  }

  mainButtons.forEach(function (b) {
    b.addEventListener('click', function () { switchMain(b.getAttribute('data-main')); });
  });
  subButtons.forEach(function (b) {
    b.addEventListener('click', function () { switchSub(b.getAttribute('data-sub')); });
  });

  /* ==================================================================
   * 3.【洛克文转换】实时显示 + 导出透明 PNG
   * ================================================================== */
  var convInput = $('#convert-input');
  var convStage = $('#convert-stage');
  var convColor = $('#convert-color');
  var convStroke = $('#convert-stroke');
  var convSize = $('#convert-size');
  var convStrokeColor = $('#convert-stroke-color');
  var convHint = $('#convert-hint');
  var convertScript = 'rune';   // 'rune' 洛克文 | 'normal' 正常

  function scriptFontFamily() {
    return convertScript === 'normal'
      ? '"SSDunDun-CN","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif'
      : '"Rune",sans-serif';
  }

  function ensurePlaceholder() {
    if (convStage && !convStage.querySelector('.stage-placeholder')) {
      var ph = document.createElement('span');
      ph.className = 'stage-placeholder';
      ph.textContent = '输入文字后此处显示';
      convStage.appendChild(ph);
    }
  }
  function removePlaceholder() {
    var ph = convStage.querySelector('.stage-placeholder');
    if (ph) ph.remove();
  }

  function isLatinChar(ch) {
    return /^[A-Za-z]$/.test(ch);
  }

  /* [4] 按字符选择字体：洛克文模式下英文字母用 Rune，数字/汉字/符号用敦敦体；正常模式全用敦敦体。
     逐字符 textContent 写入 span，仍天然防 XSS。 */
  function renderSplittedGlyphs(container, text, script) {
    container.textContent = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var span = document.createElement('span');
      span.textContent = ch;
      if (script === 'rune') {
        span.className = isLatinChar(ch) ? 'rune-ch' : 'cn-ch';
      } else {
        span.className = 'cn-ch';
      }
      container.appendChild(span);
    }
  }

  /* 用 8 方向 text-shadow 实现“向外描边”（-webkit-text-stroke 是居中描边） */
  function buildOutline(w, color) {
    if (!w || w <= 0) return 'none';
    var d = w;
    var o = d * 0.72;   // 对角方向偏移（约 w/√2）
    var parts = [
      d + 'px 0 0 ' + color, (-d) + 'px 0 0 ' + color,
      '0 ' + d + 'px 0 ' + color, '0 ' + (-d) + 'px 0 ' + color,
      o + 'px ' + o + 'px 0 ' + color, o + 'px ' + (-o) + 'px 0 ' + color,
      (-o) + 'px ' + o + 'px 0 ' + color, (-o) + 'px ' + (-o) + 'px 0 ' + color
    ];
    return parts.join(',');
  }

  function updateConvert() {
    if (!convStage || !convInput) return;
    var text = convInput.value;
    if (!text) {
      convStage.textContent = '';
      convStage.style.textShadow = 'none';
      ensurePlaceholder();
      return;
    }
    removePlaceholder();
    renderSplittedGlyphs(convStage, text, convertScript);   // 字符级字体，天然防 XSS
    var sw = parseFloat(inputVal(convStroke, '0'));
    if (isNaN(sw)) sw = 0;
    var sz = parseFloat(inputVal(convSize, '64'));
    if (isNaN(sz)) sz = 64;
    convStage.style.color = inputVal(convColor, '#2f3a4d');
    convStage.style.fontFamily = scriptFontFamily();
    convStage.style.fontSize = sz + 'px';
    convStage.style.lineHeight = (sz * 1.4) + 'px';
    convStage.style.textShadow = buildOutline(sw, inputVal(convStrokeColor, '#7d6b3a'));
  }

  if (convInput) convInput.addEventListener('input', updateConvert);
  if (convColor) convColor.addEventListener('input', updateConvert);
  if (convStroke) convStroke.addEventListener('input', updateConvert);
  if (convSize) convSize.addEventListener('input', updateConvert);
  if (convStrokeColor) convStrokeColor.addEventListener('input', updateConvert);

  /* #1 转换输入框随行数自动增高（手机端更友好，无需滚动） */
  function autoGrowTextarea(el) {
    if (!el) return;
    el.style.height = 'auto';
    var h = el.scrollHeight;
    if (!h || h < 70) h = 70;
    el.style.height = h + 'px';
  }
  if (convInput) {
    autoGrowTextarea(convInput);
    convInput.addEventListener('input', function () { autoGrowTextarea(convInput); });
    convInput.addEventListener('focus', function () { autoGrowTextarea(convInput); });
  }

  /* Add.1.1 转换输入框聚焦时 placeholder 隐藏，失焦且为空时恢复 */
  if (convInput) {
    var convPh = convInput.getAttribute('placeholder') || '';
    convInput.addEventListener('focus', function () { convInput.setAttribute('placeholder', ''); });
    convInput.addEventListener('blur', function () {
      if (!convInput.value) convInput.setAttribute('placeholder', convPh);
    });
  }

  // 字形切换：正常 / 洛克文
  var scriptBtns = $$('.script-btn');
  scriptBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      convertScript = b.getAttribute('data-script');
      scriptBtns.forEach(function (x) { x.classList.toggle('active', x === b); });
      updateConvert();
    });
  });
  updateConvert();

  var clearBtn = $('#convert-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      convInput.value = '';
      updateConvert();
      autoGrowTextarea(convInput);
      if (convHint) { convHint.textContent = ''; convHint.classList.remove('done'); }
    });
  }
  updateConvert();

  /* [2] 点击切换字形（rune/原文） */
  var brandTitle = $('#brand-title');
  var brandRuneOn = false;
  if (brandTitle) {
    brandTitle.addEventListener('click', function () {
      brandRuneOn = !brandRuneOn;
      brandTitle.style.fontFamily = brandRuneOn ? '"Rune",sans-serif' : '';
      brandTitle.style.letterSpacing = brandRuneOn ? '1px' : '';
    });
  }

  /* 按当前字形加载对应的本地字体，确保 canvas 导出与 DOM 一致 */
  function loadExportFace() {
    if (window.FontFace && document.fonts) {
      var cfg = convertScript === 'normal'
        ? { name: 'SSDunDunCanvas', url: 'url("fonts/SSDunDun-CN.ttf")' }
        : { name: 'RuneCanvas', url: 'url("fonts/Rune-Regular.ttf")' };
      try {
        var face = new FontFace(cfg.name, cfg.url);
        return face.load().then(function (ff) {
          document.fonts.add(ff);
          return cfg.name.toString();
        }).catch(function () { return null; });
      } catch (e) { return Promise.resolve(null); }
    }
    return Promise.resolve(null);
  }

  function exportPNG(text, opt) {
    return loadExportFace().then(function (exportFamily) {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var fallback = convertScript === 'normal'
        ? '"SSDunDun-CN","PingFang SC",sans-serif'
        : '"Rune",sans-serif';
      var family = exportFamily ? ('"' + exportFamily + '"') : fallback;
      var pad = 50;
      var maxW = 1600;
      var lineH = 190;
      var px = 160;   // 当前测量用的字号（内部会修正）

      function fit() {
        // 以“最长一行”（按 \n 切分）为准缩小字号，使整段可放入 maxW
        px = 160;
        ctx.font = px + 'px ' + family + ', sans-serif';
        var longest = text.split('\n').reduce(function (m, s) { return Math.max(m, ctx.measureText(s).width); }, 0);
        while (longest > maxW && px > 30) {
          px -= 10;
          ctx.font = px + 'px ' + family + ', sans-serif';
          longest = text.split('\n').reduce(function (m, s) { return Math.max(m, ctx.measureText(s).width); }, 0);
        }
      }
      fit();

      // 先按 \n 硬换行，再对每行做可见字符软换行，避免超宽
      var lines = [];
      text.split('\n').forEach(function (seg) {
        var cur = '';
        var cw = 0;
        ctx.font = px + 'px ' + family + ', sans-serif';
        for (var k = 0; k < seg.length; k++) {
          var ch = seg.charAt(k);
          var chw = ctx.measureText(ch).width;
          if (cur && (cw + chw) > maxW) {
            lines.push(cur);
            cur = ch; cw = chw;
          } else {
            cur += ch; cw += chw;
          }
        }
        if (cur) lines.push(cur); else lines.push('');
      });
      if (!lines.length) lines.push('');

      var W = lines.reduce(function (m, l) { return Math.max(m, ctx.measureText(l).width); }, 0) + pad * 2;
      W = Math.ceil(Math.max(W, 60));
      var H = Math.ceil(lines.length * lineH + pad * 2);

      canvas.width = W;
      canvas.height = H;
      ctx.clearRect(0, 0, W, H);   // 保持透明背景

      ctx.font = px + 'px ' + family + ', sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(opt.strokeWidth, 0.01);
      ctx.strokeStyle = opt.strokeColor;
      ctx.fillStyle = opt.color;

      var O = opt.strokeWidth || 0;
      var D = O * 0.72;
      lines.forEach(function (ln, idx) {
        var cx = W / 2;
        var cy = pad + idx * lineH + lineH / 2;
        if (O > 0) {
          // 向外描边：8 个方向用描边色各画一遍，再在中心用字形色盖回
          var offs = [[O,0],[-O,0],[0,O],[0,-O],[D,D],[D,-D],[-D,D],[-D,-D]];
          ctx.fillStyle = opt.strokeColor;
          offs.forEach(function (p) { ctx.fillText(ln, cx + p[0], cy + p[1]); });
          ctx.fillStyle = opt.color;
        }
        ctx.fillText(ln, cx, cy);
      });

      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (blob) resolve(blob);
          else reject(new Error('浏览器未能生成图片'));
        }, 'image/png');
      });
    });
  }

  var exportBtn = $('#convert-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      var text = convInput.value;
      if (!text || !text.trim()) {
        if (convHint) { convHint.textContent = '请先输入要转换的内容（空白无法导出）'; convHint.classList.remove('done'); }
        return;
      }
      var strokeWidth = parseFloat(inputVal(convStroke, '0'));
      if (isNaN(strokeWidth)) strokeWidth = 0;
      exportPNG(text, {
        color: inputVal(convColor, '#2f3a4d'),
        strokeWidth: strokeWidth,
        strokeColor: inputVal(convStrokeColor, '#7d6b3a')
      }).then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'luokenwen-' + Date.now() + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        if (convHint) { convHint.textContent = '已导出透明 PNG 图片'; convHint.classList.add('done'); }
      }).catch(function (err) {
        if (convHint) {
          convHint.textContent = '导出失败：' + ((err && err.message) ? err.message : '未知错误');
          convHint.classList.remove('done');
        }
      });
    });
  }

  /* ==================================================================
   * 4.【认字母】
   * ================================================================== */
  var letterGlyph = $('#letter-glyph');
  var letterInput = $('#letter-input');
  var letterVerdict = $('#letter-verdict');
  var letterHistoryBox = $('#letter-history');
  var letterBtn = $('#letter-submit');
  var letterTimer = null;
  var letterState = { current: null, history: [], done: false };

  /* 复原到“答题中”状态（任何方式进入下一题时都要调用） */
  function letterReset() {
    letterState.done = false;
    if (letterBtn) letterBtn.textContent = '确定';
    if (letterTimer) { window.clearTimeout(letterTimer); letterTimer = null; }
  }

  function renderLetter() {
    if (!letterGlyph) return;
    letterReset();
    var idx = randExcluding(LETTERS.length, -1);
    var letter = LETTERS[idx];
    letterState.current = { letter: letter, isVW: isVW(letter) };
    letterGlyph.textContent = letter;   // 洛克文字形
    letterGlyph.style.color = GLYPH_COLOR;
    letterGlyph.style.textShadow = 'none';
    if (letterVerdict) letterVerdict.innerHTML = '';
    if (letterInput) { letterInput.value = ''; letterInput.focus(); }
  }

  function letterAnswer(cur) {
    // V/W 字形一致：正确答案固定显示为“V 或 W”
    if (cur && cur.isVW) return 'V 或 W';
    return cur ? cur.letter : '';
  }

  function submitLetter() {
    if (!letterInput || !letterVerdict) return;
    // 若已被判定，则按钮/回车充当“继续”：切到下一题
    if (letterState.done) { renderLetter(); return; }
    if (!letterState.current) { renderLetter(); return; }

    var raw = letterInput.value;
    var inp = normalizeInput(raw);
    if (!inp) {
      letterVerdict.innerHTML = '<span class="detail">请输入一个字母</span>';
      return;
    }
    if (!onlyAtoZ(inp) || inp.length !== 1) {
      letterVerdict.innerHTML = '<span class="detail">请输入单个英文字母（a–z）</span>';
      return;
    }

    var up = inp.toUpperCase();
    var cur = letterState.current;
    var ok;
    if (cur.isVW) {
      ok = isVW(up);                 // V 或 W 都判对
    } else {
      ok = (up === cur.letter);
    }
    var answer = letterAnswer(cur);

    letterState.history.unshift({
      glyph: cur.letter,             // 显示用的洛克文字形（V 的字形）
      answer: answer,                // “V 或 W” 或字母本身
      ok: ok,
      time: nowTime()
    });
    if (letterState.history.length > 200) letterState.history.length = 200;
    storeSet(LS_LETTER, letterState.history);
    renderLetterHistory(true);

    var mark = ok ? '正确' : '错误';
    var cls = ok ? 'right' : 'wrong';
    var answerText = escapeHtml(answer);
    // 正确答案：V/W 显示为“V 或 W”，其它字母用一般字形文字展示
    letterVerdict.innerHTML =
      '<span class="tag ' + cls + '">' + mark + '</span>' +
      '<span class="detail">正确答案：' + answerText + '</span>';

    // 提交后进入“已判定”态：按钮变“继续”，2.5 秒后自动切下一题
    letterState.done = true;
    if (letterBtn) letterBtn.textContent = '继续';
    if (letterTimer) window.clearTimeout(letterTimer);
    letterTimer = window.setTimeout(renderLetter, 2500);
  }

  function renderLetterHistory(flashFirst) {
    var h = letterState.history;
    if (!letterHistoryBox) return;
    if (!h || !h.length) {
      letterHistoryBox.innerHTML = '<div class="history-empty">暂无记录</div>';
      return;
    }
    var html = '<div class="history-scroll"><table class="history-table"><thead><tr>' +
      '<th>序号</th><th>洛克文字形</th><th>正确答案</th><th>正误</th><th>时间</th>' +
      '</tr></thead><tbody>';
    h.forEach(function (r, i) {
      var n = h.length - i;
      var glyphRune = '<span class="rune">' + escapeHtml(r.glyph) + '</span>';
      // 正确答案一律用一般字形展示（V/W 显示为“V 或 W”）
      var ansPlain = escapeHtml(r.answer);
      var flashCls = (flashFirst && i === 0) ? (r.ok ? ' flash-ok' : ' flash-no') : '';
      html += '<tr' + (flashCls ? ' class="' + flashCls.trim() + '"' : '') + '><td>' + n + '</td><td>' + glyphRune + '</td><td>' + ansPlain +
        '</td><td class="' + (r.ok ? 'ok' : 'no') + '">' + (r.ok ? '正确' : '错误') +
        '</td><td class="time">' + escapeHtml(r.time) + '</td></tr>';
    });
    html += '</tbody></table></div>';
    letterHistoryBox.innerHTML = html;
  }

  var letterSubmitBtn = $('#letter-submit');
  if (letterSubmitBtn) letterSubmitBtn.addEventListener('click', submitLetter);
  if (letterInput) {
    var letterPh = letterInput.getAttribute('placeholder') || '';
    letterInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); submitLetter(); }
    });
    // #6：聚焦时提示立即消失，失焦且为空时恢复
    letterInput.addEventListener('focus', function () { letterInput.setAttribute('placeholder', ''); });
    letterInput.addEventListener('blur', function () {
      if (!letterInput.value) letterInput.setAttribute('placeholder', letterPh);
    });
  }
  var letterNextBtn = $('#letter-next');
  if (letterNextBtn) letterNextBtn.addEventListener('click', renderLetter);
  var letterClearBtn = $('#letter-history-clear');
  if (letterClearBtn) {
    letterClearBtn.addEventListener('click', function () {
      letterState.history = [];
      storeSet(LS_LETTER, []);
      renderLetterHistory();
    });
  }

  /* ==================================================================
   * 5.【认单词】
   * ================================================================== */
  var DIFFS = [
    { key: 'easy', label: '简单' },
    { key: 'med', label: '中等' },
    { key: 'hard', label: '困难' },
    { key: 'expert', label: '专家' }
  ];
  function diffLabel(key) {
    for (var i = 0; i < DIFFS.length; i++) {
      if (DIFFS[i].key === key) return DIFFS[i].label;
    }
    return key;
  }

  var wordGlyph = $('#word-glyph');
  var wordMeta = $('#word-meta');
  var wordInput = $('#word-input');
  var wordVerdict = $('#word-verdict');
  var wordHistoryBox = $('#word-history');
  var streakHint = $('#word-streak-hint');
  var wordBtn = $('#word-submit');
  var wordTimer = null;
  var wordState = { diff: 'easy', current: null, history: [], done: false };

  // #7：连击进度不展示，只在解锁时提示；内部计数照常
  function updateStreakHint(n) {
    if (!streakHint) return;
    if (n >= 5) {
      streakHint.textContent = '已解锁专家难度';
      streakHint.className = 'detail unlocked';
    } else {
      streakHint.textContent = '';
      streakHint.className = 'detail';
    }
  }

  /* 复原到“答题中”状态 */
  function wordReset() {
    wordState.done = false;
    if (wordBtn) wordBtn.textContent = '确定';
    if (wordTimer) { window.clearTimeout(wordTimer); wordTimer = null; }
  }

  function howUnlocked() {
    if (storeGet(LS_EXPERT, false) === true) return true;
    var streak = storeGet(LS_STREAK, 0);
    return (typeof streak === 'number' && streak >= 5);
  }

  var expertBtn = $('.difficulty[data-diff="expert"]');
  function refreshExpertVisibility() {
    if (!expertBtn) return;
    if (howUnlocked()) {
      expertBtn.classList.remove('hidden');
      expertBtn.classList.remove('locked');
      expertBtn.disabled = false;
      expertBtn.setAttribute('title', '');
    } else {
      expertBtn.classList.add('hidden');
      expertBtn.classList.add('locked');
      expertBtn.disabled = true;
      expertBtn.setAttribute('title', '困难难度连续答对5次后解锁');
    }
  }

  /* {1}{1.1} 先测量、后设字号：让洛克文单词能“一行完整显示”，不超容器，且不大于默认字号 */
  function computeGlyphFontSize(text) {
    var base = 74;   // 桌面端 .word-glyph 的 clamp 上限
    var stage = wordGlyph.parentNode;
    var avail = (stage && stage.clientWidth) ? (stage.clientWidth - 44) : 560;
    if (avail <= 0) avail = 560;
    var cv = document.createElement('canvas');
    var ctx = cv.getContext ? cv.getContext('2d') : null;
    if (!ctx) return base;
    var px = base;
    var family = '"Rune",sans-serif';
    while (px > 22) {
      ctx.font = px + 'px ' + family;
      if (ctx.measureText(text).width <= avail) break;
      px -= 1;
    }
    return px;
  }

  function renderWord() {
    if (!wordGlyph) return;
    wordReset();
    if (!WKB || !WKB[wordState.diff] || !WKB[wordState.diff].length) {
      wordGlyph.textContent = '';
      if (wordMeta) wordMeta.textContent = '该难度暂无单词或词库缺失';
      return;
    }
    var arr = WKB[wordState.diff];
    var prevIdx = (wordState.current && typeof wordState.current.arrIdx === 'number') ? wordState.current.arrIdx : -1;
    var arrIdx = randExcluding(arr.length, prevIdx);
    var entry = arr[arrIdx];
    wordState.current = { entry: entry, word: entry.w, arrIdx: arrIdx };
    // 先按“一行显示”算出字号，再渲染（避免先渲染再调整）
    wordGlyph.style.fontSize = computeGlyphFontSize(entry.w) + 'px';
    wordGlyph.textContent = entry.w;
    wordGlyph.style.color = GLYPH_COLOR;
    wordGlyph.style.textShadow = 'none';
    if (wordMeta) wordMeta.textContent = '难度：' + diffLabel(wordState.diff);
    if (wordVerdict) wordVerdict.innerHTML = '';
    if (wordInput) { wordInput.value = ''; wordInput.focus(); }
  }

  function setDiff(key) {
    if (!WKB || !WKB[key]) return;
    wordState.diff = key;
    $$('.difficulty').forEach(function (b) {
      b.classList.toggle('active', (b.getAttribute('data-diff') === key));
    });
    renderWord();
  }

  $$('.difficulty').forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.getAttribute('data-diff');
      if (key === 'expert' && !howUnlocked()) return;
      setDiff(key);
    });
  });

  function buildSenses(entry) {
    if (!entry || !entry.senses || !entry.senses.length) return '';
    return entry.senses.map(function (s) {
      var p = (s.pos ? escapeHtml(s.pos) + '.' : '');
      return '<span class="sense"><span class="pos">' + p + '</span>' + escapeHtml(s.def || '') + '</span>';
    }).join('');
  }

  /* 把释义格式化为一行文本，用于历史记录悬停提示（title） */
  function formatSensesForTip(entry) {
    if (!entry || !entry.senses || !entry.senses.length) return '';
    return entry.senses.map(function (s) {
      var p = (s.pos ? s.pos + '.' : '');
      return p + ' ' + (s.def || '');
    }).join('\n');
  }

  function submitWord() {
    if (!wordInput || !wordVerdict) return;
    // 若已被判定，则按钮/回车充当“继续”：切到下一题
    if (wordState.done) { renderWord(); return; }
    if (!wordState.current) { renderWord(); return; }

    var raw = wordInput.value;
    var inp = normalizeInput(raw);
    if (!inp) {
      wordVerdict.innerHTML = '<span class="detail">请输入一个单词</span>';
      return;
    }
    if (!onlyAtoZ(inp)) {
      wordVerdict.innerHTML = '<span class="detail">请输入纯英文字母构成的单词</span>';
      return;
    }
    if (inp.length > 40) {
      wordVerdict.innerHTML = '<span class="detail">输入过长，请核对单词</span>';
      return;
    }

    var cur = wordState.current;
    var answer = cur.word;
    var ok = (inp === answer.toLowerCase());

    // 连击与解锁：仅困难/专家计入
    if (wordState.diff === 'hard' || wordState.diff === 'expert') {
      var streak = storeGet(LS_STREAK, 0);
      if (typeof streak !== 'number') streak = 0;
      streak = ok ? streak + 1 : 0;
      storeSet(LS_STREAK, streak);
      if (streak >= 5) storeSet(LS_EXPERT, true);
      refreshExpertVisibility();
      updateStreakHint(streak);
    } else {
      storeSet(LS_STREAK, 0);
      updateStreakHint(0);
    }

    wordState.history.unshift({
      diff: diffLabel(wordState.diff),
      glyph: answer,          // rune 字形
      answer: answer,         // 正确单词
      ok: ok,
      time: nowTime(),
      senseText: formatSensesForTip(cur.entry)
    });
    if (wordState.history.length > 200) wordState.history.length = 200;
    storeSet(LS_WORD, wordState.history);
    renderWordHistory(true);

    var mark = ok ? '正确' : '错误';
    var cls = ok ? 'right' : 'wrong';
    var block =
      '<span class="word-answer-block">' +
      '<span class="word">' + escapeHtml(answer) + '</span>' +
      (cur.entry.ph ? ' <span class="ph">/' + escapeHtml(cur.entry.ph) + '/</span>' : '') +
      '</span>' +
      buildSenses(cur.entry);
    wordVerdict.innerHTML =
      '<span class="tag ' + cls + '">' + mark + '</span>' +
      '<span class="detail">正确答案：' + block + '</span>';

    // 提交后进入“已判定”态：按钮变“继续”，由用户手动切下一题（认单词不自动切题）
    wordState.done = true;
    if (wordBtn) wordBtn.textContent = '继续';
    if (wordTimer) window.clearTimeout(wordTimer);
  }

  function renderWordHistory(flashFirst) {
    var h = wordState.history;
    if (!wordHistoryBox) return;
    if (!h || !h.length) {
      wordHistoryBox.innerHTML = '<div class="history-empty">暂无记录</div>';
      return;
    }
    var html = '<div class="history-scroll"><table class="history-table"><thead><tr>' +
      '<th>序号</th><th>难度</th><th>洛克文字形</th><th>正确答案</th><th>正误</th><th>时间</th>' +
      '</tr></thead><tbody>';
    h.forEach(function (r, i) {
      var n = h.length - i;
      var flashCls = (flashFirst && i === 0) ? (r.ok ? ' flash-ok' : ' flash-no') : '';
      html += '<tr' + (flashCls ? ' class="' + flashCls.trim() + '"' : '') + '><td>' + n + '</td><td>' + escapeHtml(r.diff) + '</td>' +
        '<td><span class="rune">' + escapeHtml(r.glyph) + '</span></td>' +
        '<td class="wrap" title="' + escapeHtml(r.senseText || '') + '">' + escapeHtml(r.answer) + '</td>' +
        '<td class="' + (r.ok ? 'ok' : 'no') + '">' + (r.ok ? '正确' : '错误') + '</td>' +
        '<td class="time">' + escapeHtml(r.time) + '</td></tr>';
    });
    html += '</tbody></table></div>';
    wordHistoryBox.innerHTML = html;
  }

  var wordSubmitBtn = $('#word-submit');
  if (wordSubmitBtn) wordSubmitBtn.addEventListener('click', submitWord);
  if (wordInput) {
    var wordPh = wordInput.getAttribute('placeholder') || '';
    wordInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); submitWord(); }
    });
    // #6：聚焦时提示立即消失，失焦且为空时恢复
    wordInput.addEventListener('focus', function () { wordInput.setAttribute('placeholder', ''); });
    wordInput.addEventListener('blur', function () {
      if (!wordInput.value) wordInput.setAttribute('placeholder', wordPh);
    });
  }
  var wordNextBtn = $('#word-next');
  if (wordNextBtn) wordNextBtn.addEventListener('click', renderWord);
  var wordClearBtn = $('#word-history-clear');
  if (wordClearBtn) {
    wordClearBtn.addEventListener('click', function () {
      wordState.history = [];
      storeSet(LS_WORD, []);
      renderWordHistory();
    });
  }

  /* ==================================================================
   * 6. 启动
   * ================================================================== */
  var lsL = storeGet(LS_LETTER, []);
  var lsW = storeGet(LS_WORD, []);
  letterState.history = Array.isArray(lsL) ? lsL : [];
  wordState.history = Array.isArray(lsW) ? lsW : [];

  if (!WKB && wordMeta) {
    wordMeta.textContent = '词库加载失败，请检查 js/wordbank.js 是否存在';
  }

  refreshExpertVisibility();
  renderLetterHistory();
  renderWordHistory();
  renderLetter();
  renderWord();
  updateStreakHint(storeGet(LS_STREAK, 0));

  // {1.1} Rune 字体加载完成后，用真实字形宽度重渲染当前认单词题，得到精确的一行字号
  if (document.fonts && document.fonts.load) {
    document.fonts.load('70px "Rune"').then(function () {
      if (wordState.current && wordGlyph) renderWord();
    }).catch(function () { /* 忽略 */ });
  }

})();
