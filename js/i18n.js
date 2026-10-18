/* RuneLearn — 界面文案资源（简体中文 / 繁體中文 / English / 日本語）
 * 纯前端、无依赖；与 js/wordbank.js 一样以 <script> 引入并挂在 window.RUNE_I18N，
 * 因此双击 index.html（file://）也能读取，不需要 fetch（本地 JSON 在 file:// 下会跨域）。
 *
 * 约定：
 * - 文案以「点号分层」的扁平 key 存放，四种语言的 key 完全一致；某语言缺某条时回退简体中文。
 * - 带参数的文案用 {name} 占位，由 js/app.js 的 t(key, vars) 替换，例如 word.meta = '难度：{diff}'。
 * - 品牌名 RuneLearn、署名 "Co-created with ..." 与语言自称（简体中文 / 繁體中文 / English / 日本語）不做翻译。
 * - 繁体中文不是「简体转字形」：按台湾用词习惯重写（單字/匯出/字型/自訂/紀錄/介面/產生…），
 *   与简体文案刻意区分，不要直接拿简体做字符替换。
 * - 日文的「洛克文」=「ロコ文」（Roco 的日文名为 ロコ），不要写成 ロック文字/ロック文。
 * - gate.* 是「首访语言弹窗」的提示——此时用户尚未选定语言，故四种语言各一行并列展示；
 *   数组顺序必须与 langs 一致（zh → zh-Hant → en → ja）。
 */
(function (root) {
  'use strict';

  var STORE_KEY = 'runelearn.lang';   // 与 app.js 的 localStorage 键保持一致（JSON 字符串）
  var FALLBACK = 'zh';

  /* 可选语言（顺序即页脚与首访弹窗的展示顺序）：key 用于 <html data-lang>、localStorage 与资源索引；
   * native 是语言自称，不翻译。 */
  var LANGS = [
    { key: 'zh', native: '简体中文', locale: 'zh-CN' },
    { key: 'zh-Hant', native: '繁體中文', locale: 'zh-Hant' },
    { key: 'en', native: 'English', locale: 'en' },
    { key: 'ja', native: '日本語', locale: 'ja' }
  ];

  var DICT = {
    zh: {
      'doc.title': 'RuneLearn · 洛克文学习',
      'brand.sub': '洛克文 · 识记与转换',
      'brand.toggle': '点击切换字形',

      'tab.convert': '洛克文转换',
      'tab.recognize': '洛克文识记',

      'convert.title': '洛克文转换',
      'convert.desc': '输入文本，实时以洛克文字型显示，可自定义样式并导出透明 PNG。',
      'convert.placeholder': '输入文字',
      'convert.clear': '清空',
      'convert.stagePlaceholder': '输入文字后此处显示',
      'convert.color': '字形颜色',
      'convert.strokeColor': '描边颜色',
      'convert.strokeWidth': '描边粗细',
      'convert.size': '字号大小',
      'convert.script': '字形',
      'convert.scriptNormal': '正常',
      'convert.scriptRune': '洛克文',
      'convert.export': '导出透明 PNG',
      'convert.err.empty': '请先输入要转换的内容（空白无法导出）',
      'convert.err.blob': '浏览器未能生成图片',
      'convert.err.prefix': '导出失败：{msg}',
      'convert.err.unknown': '未知错误',
      'convert.done': '已导出透明 PNG 图片',

      'sub.letter': '认字母',
      'sub.word': '认单词',

      'letter.title': '认字母',
      'letter.desc': '看洛克文字形，写出对应的英文字母，不区分大小写。',
      'letter.placeholder.long': '输入字母，回车或点确定',
      'letter.placeholder.short': '输入字母',
      'letter.err.empty': '请输入一个字母',
      'letter.err.invalid': '请输入单个英文字母（a–z）',
      'letter.answerVW': 'V 或 W',

      'word.title': '认单词',
      'word.desc': '看洛克文字形，拼出对应的英文单词。',
      'word.placeholder.long': '输入单词，回车或点确定',
      'word.placeholder.short': '输入单词',
      'word.err.empty': '请输入一个单词',
      'word.err.invalid': '请输入纯英文字母构成的单词',
      'word.err.tooLong': '输入过长，请核对单词',
      'word.meta': '难度：{diff}',
      'word.noData': '该难度暂无单词或词库缺失',
      'word.bankMissing': '词库加载失败，请检查 js/wordbank.js 是否存在',

      'diff.label': '难度',
      'diff.easy': '简单',
      'diff.med': '中等',
      'diff.hard': '困难',
      'diff.expert': '专家',
      'diff.expertLocked': '困难难度连续答对5次后解锁',
      'diff.expertUnlocked': '已解锁专家难度',

      'verdict.right': '正确',
      'verdict.wrong': '错误',
      'verdict.answerLabel': '正确答案：',

      'action.submit': '确定',
      'action.continue': '继续',
      'action.another': '换一个',

      'history.title': '历史记录',
      'history.clear': '清空',
      'history.empty': '暂无记录',
      'history.col.index': '序号',
      'history.col.diff': '难度',
      'history.col.glyph': '洛克文字形',
      'history.col.answer': '正确答案',
      'history.col.result': '正误',
      'history.col.time': '时间',

      'lang.label': '语言',
      'footer.slogan': '卡洛西亚的凌晨四点',
      'footer.disclaimer': '本网站与官方无关',
      'footer.source': '查看源代码'
    },

    /* 繁體中文（台湾用词习惯；不是简体做字符替换：單字/匯出/字型/自訂/紀錄/介面/產生/解鎖/換一題…） */
    'zh-Hant': {
      'doc.title': 'RuneLearn · 洛克文學習',
      'brand.sub': '洛克文 · 識記與轉換',
      'brand.toggle': '點擊切換字形',

      'tab.convert': '洛克文轉換',
      'tab.recognize': '洛克文識記',

      'convert.title': '洛克文轉換',
      'convert.desc': '輸入文字，即時以洛克文字型顯示，可自訂樣式並匯出透明 PNG。',
      'convert.placeholder': '輸入文字',
      'convert.clear': '清除',
      'convert.stagePlaceholder': '輸入文字後此處顯示',
      'convert.color': '字形顏色',
      'convert.strokeColor': '描邊顏色',
      'convert.strokeWidth': '描邊粗細',
      'convert.size': '字型大小',
      'convert.script': '字形',
      'convert.scriptNormal': '正常',
      'convert.scriptRune': '洛克文',
      'convert.export': '匯出透明 PNG',
      'convert.err.empty': '請先輸入要轉換的內容（空白無法匯出）',
      'convert.err.blob': '瀏覽器未能產生圖片',
      'convert.err.prefix': '匯出失敗：{msg}',
      'convert.err.unknown': '未知錯誤',
      'convert.done': '已匯出透明 PNG 圖片',

      'sub.letter': '認字母',
      'sub.word': '認單字',

      'letter.title': '認字母',
      'letter.desc': '看洛克文字形，寫出對應的英文字母，不分大小寫。',
      'letter.placeholder.long': '輸入字母，按 Enter 或點確定',
      'letter.placeholder.short': '輸入字母',
      'letter.err.empty': '請輸入一個字母',
      'letter.err.invalid': '請輸入單一英文字母（a–z）',
      'letter.answerVW': 'V 或 W',

      'word.title': '認單字',
      'word.desc': '看洛克文字形，拼出對應的英文單字。',
      'word.placeholder.long': '輸入單字，按 Enter 或點確定',
      'word.placeholder.short': '輸入單字',
      'word.err.empty': '請輸入一個單字',
      'word.err.invalid': '請輸入純英文字母組成的單字',
      'word.err.tooLong': '輸入過長，請確認單字',
      'word.meta': '難度：{diff}',
      'word.noData': '該難度暫無單字或單字庫缺失',
      'word.bankMissing': '單字庫載入失敗，請確認 js/wordbank.js 是否存在。',

      'diff.label': '難度',
      'diff.easy': '簡單',
      'diff.med': '中等',
      'diff.hard': '困難',
      'diff.expert': '專家',
      'diff.expertLocked': '困難難度連續答對 5 次後解鎖',
      'diff.expertUnlocked': '已解鎖專家難度',

      'verdict.right': '正確',
      'verdict.wrong': '錯誤',
      'verdict.answerLabel': '正確答案：',

      'action.submit': '確定',
      'action.continue': '繼續',
      'action.another': '換一題',

      'history.title': '歷史紀錄',
      'history.clear': '清除',
      'history.empty': '尚無紀錄',
      'history.col.index': '序號',
      'history.col.diff': '難度',
      'history.col.glyph': '洛克文字形',
      'history.col.answer': '正確答案',
      'history.col.result': '正誤',
      'history.col.time': '時間',

      'lang.label': '語言',
      'footer.slogan': '卡洛西亞的凌晨四點',
      'footer.disclaimer': '本網站與官方無關',
      'footer.source': '查看原始碼'
    },

    /* English（「洛克文」= Roco Script；Rune 一词只允许出现在品牌名 RuneLearn 里） */
    en: {
      'doc.title': 'RuneLearn · Learn the Roco Script',
      'brand.sub': 'Roco Script · Learn & Convert',
      'brand.toggle': 'Click to switch the glyph',

      'tab.convert': 'Roco Converter',
      'tab.recognize': 'Roco Practice',

      'convert.title': 'Roco Converter',
      'convert.desc': 'Type some text and see it in the Roco Script in real time. Customize the style, then export a transparent PNG.',
      'convert.placeholder': 'Type text',
      'convert.clear': 'Clear',
      'convert.stagePlaceholder': 'Your text shows up here',
      'convert.color': 'Glyph color',
      'convert.strokeColor': 'Outline color',
      'convert.strokeWidth': 'Outline width',
      'convert.size': 'Font size',
      'convert.script': 'Glyph',
      'convert.scriptNormal': 'Normal',
      'convert.scriptRune': 'Roco',
      'convert.export': 'Export transparent PNG',
      'convert.err.empty': 'Please type something first (blank text cannot be exported)',
      'convert.err.blob': 'the browser could not generate the image',
      'convert.err.prefix': 'Export failed: {msg}',
      'convert.err.unknown': 'unknown error',
      'convert.done': 'Transparent PNG exported',

      'sub.letter': 'Letters',
      'sub.word': 'Words',

      'letter.title': 'Letter Recognition',
      'letter.desc': 'Look at the Roco glyph and type the English letter it stands for. Case does not matter.',
      'letter.placeholder.long': 'Type the letter, then press Enter',
      'letter.placeholder.short': 'Type the letter',
      'letter.err.empty': 'Please type one letter',
      'letter.err.invalid': 'Please type a single English letter (a–z)',
      'letter.answerVW': 'V or W',

      'word.title': 'Word Recognition',
      'word.desc': 'Look at the Roco script and spell out the English word.',
      'word.placeholder.long': 'Type the word, then press Enter',
      'word.placeholder.short': 'Type the word',
      'word.err.empty': 'Please type a word',
      'word.err.invalid': 'Please use English letters only',
      'word.err.tooLong': 'Input is too long, please check the word',
      'word.meta': 'Level: {diff}',
      'word.noData': 'No words for this level (word bank missing)',
      'word.bankMissing': 'Failed to load the word bank. Please check that js/wordbank.js exists.',

      'diff.label': 'Level',
      'diff.easy': 'Easy',
      'diff.med': 'Medium',
      'diff.hard': 'Hard',
      'diff.expert': 'Expert',
      'diff.expertLocked': 'Answer 5 hard questions in a row to unlock',
      'diff.expertUnlocked': 'Expert level unlocked',

      'verdict.right': 'Correct',
      'verdict.wrong': 'Wrong',
      'verdict.answerLabel': 'Answer: ',

      'action.submit': 'Submit',
      'action.continue': 'Continue',
      'action.another': 'Another',

      'history.title': 'History',
      'history.clear': 'Clear',
      'history.empty': 'No records yet',
      'history.col.index': 'No.',
      'history.col.diff': 'Level',
      'history.col.glyph': 'Roco glyph',
      'history.col.answer': 'Answer',
      'history.col.result': 'Result',
      'history.col.time': 'Time',

      'lang.label': 'Language',
      'footer.slogan': '4 a.m. in Calosia',
      'footer.disclaimer': 'This site is not affiliated with the official site.',
      'footer.source': 'View source'
    },

    /* 日本語（「洛克文」= ロコ文；Roco 的日文名为 ロコ） */
    ja: {
      'doc.title': 'RuneLearn · ロコ文の学習',
      'brand.sub': 'ロコ文 · 学習と変換',
      'brand.toggle': 'クリックで字形を切り替え',

      'tab.convert': 'ロコ文変換',
      'tab.recognize': 'ロコ文の学習',

      'convert.title': 'ロコ文変換',
      'convert.desc': 'テキストを入力すると、ロコ文でリアルタイムに表示されます。スタイルを整えて透過 PNG を書き出せます。',
      'convert.placeholder': 'テキストを入力',
      'convert.clear': 'クリア',
      'convert.stagePlaceholder': '入力するとここに表示されます',
      'convert.color': '字形の色',
      'convert.strokeColor': '縁取りの色',
      'convert.strokeWidth': '縁取りの太さ',
      'convert.size': '文字サイズ',
      'convert.script': '字形',
      'convert.scriptNormal': '通常',
      'convert.scriptRune': 'ロコ文',
      'convert.export': '透過 PNG を書き出し',
      'convert.err.empty': '先にテキストを入力してください（空白は書き出せません）',
      'convert.err.blob': 'ブラウザが画像を生成できませんでした',
      'convert.err.prefix': '書き出しに失敗しました：{msg}',
      'convert.err.unknown': '不明なエラー',
      'convert.done': '透過 PNG を書き出しました',

      'sub.letter': '文字当て',
      'sub.word': '単語当て',

      'letter.title': '文字当て',
      'letter.desc': 'ロコ文の字形を見て、対応する英字を入力してください。大文字と小文字は区別しません。',
      'letter.placeholder.long': '英字を入力（Enter または回答）',
      'letter.placeholder.short': '英字を入力',
      'letter.err.empty': '英字を1文字入力してください',
      'letter.err.invalid': '英字（a–z）を1文字だけ入力してください',
      'letter.answerVW': 'V または W',

      'word.title': '単語当て',
      'word.desc': 'ロコ文の字形を見て、対応する英単語を入力してください。',
      'word.placeholder.long': '英単語を入力（Enter または回答）',
      'word.placeholder.short': '英単語を入力',
      'word.err.empty': '英単語を入力してください',
      'word.err.invalid': '英字のみで入力してください',
      'word.err.tooLong': '入力が長すぎます。単語を確認してください',
      'word.meta': '難易度：{diff}',
      'word.noData': 'この難易度の単語がありません（単語データなし）',
      'word.bankMissing': '単語データの読み込みに失敗しました。js/wordbank.js があるか確認してください。',

      'diff.label': '難易度',
      'diff.easy': '簡単',
      'diff.med': '中級',
      'diff.hard': '難しい',
      'diff.expert': 'エキスパート',
      'diff.expertLocked': '「難しい」で5問連続正解すると解禁されます',
      'diff.expertUnlocked': 'エキスパートを解禁しました',

      'verdict.right': '正解',
      'verdict.wrong': '不正解',
      'verdict.answerLabel': '正解：',

      'action.submit': '回答',
      'action.continue': '次へ',
      'action.another': '別の問題',

      'history.title': '履歴',
      'history.clear': 'クリア',
      'history.empty': '記録はまだありません',
      'history.col.index': '番号',
      'history.col.diff': '難易度',
      'history.col.glyph': 'ロコ文',
      'history.col.answer': '正解',
      'history.col.result': '正誤',
      'history.col.time': '時刻',

      'lang.label': '言語',
      'footer.slogan': 'カロシアの午前四時',
      'footer.disclaimer': '本サイトは公式サイトとは関係ありません。',
      'footer.source': 'ソースコードを見る'
    }
  };

  /* 首访语言弹窗：用户尚未选定语言，故四种语言并列展示（顺序与 langs 一致）。
   * tip 会被 app.js 渲染成四段（每段一个带 data-lang 的 span），CSS 按段给对应语言字体。 */
  var GATE = {
    title: ['选择界面语言', '選擇介面語言', 'Select your language', '言語を選択'],
    tip: [
      '选择后可随时在页面底部切换',
      '選擇後可隨時在頁面底部切換',
      'You can switch anytime at the bottom of the page',
      '選択後はページ下部でいつでも変更できます'
    ]
  };

  function langKeys() {
    var out = [];
    for (var i = 0; i < LANGS.length; i++) out.push(LANGS[i].key);
    return out;
  }
  function isValidLang(key) {
    return langKeys().indexOf(key) >= 0;
  }
  function dictOf(lang) {
    return (DICT[lang] || DICT[FALLBACK]);
  }

  /* 读取已记忆的界面语言；未设置/损坏/不可用（如隐私模式）一律返回 null。
   * index.html 的 <head> 引导脚本与 app.js 共用本函数，避免两处判定走偏。
   * 写入端用 JSON.stringify（见 app.js），这里对 JSON 与明文两种形态都兼容。 */
  function readStoredLang() {
    var raw = null;
    try {
      raw = root.localStorage ? root.localStorage.getItem(STORE_KEY) : null;
    } catch (e) { return null; }
    if (!raw) return null;
    var value = raw;
    try {
      var parsed = JSON.parse(raw);
      if (typeof parsed === 'string') value = parsed;
    } catch (e2) { /* 非 JSON（早期/手写值）：按明文处理 */ }
    return isValidLang(value) ? value : null;
  }

  root.RUNE_I18N = {
    fallback: FALLBACK,
    storeKey: STORE_KEY,
    langs: LANGS,
    dict: DICT,
    gate: GATE,
    langKeys: langKeys,
    isValidLang: isValidLang,
    dictOf: dictOf,
    readStoredLang: readStoredLang
  };
})(typeof window !== 'undefined' ? window : this);
