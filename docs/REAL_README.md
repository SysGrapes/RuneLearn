# RuneLearn · 洛克文识记与转换

一个纯前端、零依赖的静态网页，用于学习「Rune」字体（人造字母，形如古代符文，其中 V 与 W 字形相同）对应的英文字母与英文单词。

## 快速使用

- **直接使用**：双击 `index.html` 即可在浏览器中打开，无需服务器，无跨域问题。
- **托管到 GitHub Pages**：把整个 `runelearn` 文件夹（或其中的 `index.html` + `css/` + `js/` + `fonts/`）推送到仓库的 `gh-pages` 分支或 GitHub Pages 目录即可。
- **分享**：将 `runelearn` 文件夹整体压缩打包即可完整分享，所有资源（样式、脚本、字体、词库）均内置于文件夹内。

## 功能

### 两个大板块（顶部切换）
1. **洛克文转换** — 输入英文，下方以所选字形实时显示；可设置字形颜色、描边颜色、描边粗细，并可在「正常」（中文/衬线身形）与「洛克文」（Rune 字形）之间切换；一键导出**透明背景 PNG** 图片。
2. **洛克文识记** — 内含两个子板块：
   - **认字母**：随机展示一个洛克文字母，输入对应的英文字母判断正误。
   - **认单词**：选择难度后随机展示一个洛克文单词，输入单词判断正误，并展示单词读音、词性与中文释义（**中文释义仅简体界面显示**，见下）。

页脚常驻语言切换（四枚按钮）与「本网站与官方无关」的免责说明（文案随语言切换，键 `footer.disclaimer`）。

### 界面语言（简体中文 / 繁體中文 / English / 日本語）
- 顺序固定为 简体中文 → 繁體中文 → English → 日本語（页脚按钮与首访弹窗都按 `i18n.langs` 数组顺序生成）。
- 首次进入（localStorage 无语言记录）时，页面内容先模糊并弹出**自绘**语言选择对话框（蒙层 + 对话框 + 按钮 + 过渡动效，不用原生 `select`/`alert`），选定后立即生效、解除模糊并记住语言，之后不再出现。
- 页脚最下方常驻四枚互斥语言按钮（语言自称，不翻译），切换**即时生效、无需刷新**，选择写入 `localStorage`（键 `runelearn.lang`）。
- 界面文案全部取自 `js/i18n.js` 的四份资源，不硬编码；简体与英文用敦敦体，繁體中文用繁體黑体，日文用日本常用黑体（各按系统字体逐级回退，不引入在线字体）。
- **簡繁不是字形替换**：繁体按台湾用词习惯单独撰写（單字 / 匯出 / 字型 / 歷史紀錄 / 介面 / 產生 / 換一題 / 解鎖…），并配繁体字体，避免“简体字抱繁体壳”。
- **中文释义只在简体界面显示**：词库只有简体释义文本，故繁體中文 / English / 日本語 一律隐藏（`app.js` 的 `showsWordSenses()`，判据就是 `data-lang === 'zh'`；CSS 兜底 `html:not([data-lang="zh"]) .word-senses{display:none}`）。繁体界面因此保持全繁体观感，不再混入简体释义。
- **每种语言用自己的字体，同屏也如此**：首访弹窗要同屏展示四种语言（标题四行、提示分四段、四个按钮），这些元素各自带 `data-lang`，CSS 按元素选字体（`.lang-gate-line/.lang-gate-seg/.lang-gate-btn[data-lang="…"]`），不会出现“一段文字四种语言逐字回退”的混排观感。

### 特色与规则
- **V / W 字形一致**：Rune 字体中 V 与 W（不区分大小写）显示相同，因此在「认字母」中展示 V 或 W 时，**V 和 W 都被视为正确**，正确答案显示为“V 或 W”。
- **难度分级**（认单词）：
  - 简单：≤4 个字母，不含 V/W
  - 中等：5–8 个字母，可出现 V/W
  - 困难：9 个及以上字母，可出现 V/W
  - 专家：12 个及以上字母，尽可能同时含 V/W
  - **困难难度连续答对 5 次后解锁“专家”难度**（解锁前隐藏，连击进度只内部计数、不显示）。
- **作答交互**：点击「确定」或按回车提交并判定；提交后按钮变「继续」、回车也切换下一题，**2.5 秒后自动进入下一题**（防止快速连按导致同一题重复判定）。每答一题，历史记录最新一行会以淡绿（答对）/淡粉（答错）作 1.5 秒指示灯动画。
- **答题区域不可复制**：展示洛克文字形的题目区域设置了 `user-select: none`，避免直接复制字形作弊。
- **切换动画**：大板块与小板块之间均有简洁的淡入切换动画。
- **历史记录**：自动保存在浏览器本地（localStorage），关闭网页后仍可保留。
  - 认字母历史字段：序号、洛克文字形、正确答案（一般字形）、正误、时间。
  - 认单词历史字段：序号、难度、洛克文字形、正确答案（一般字形）、正误、时间；**鼠标悬停正确答案可查看该词释义**。
  - 各有「清空」按钮。

## 词库说明

- 单词库存放于 `js/wordbank.js`（`window.RUNE_WORDBANK`），按 `easy / med / hard / expert` 四个难度分组，每组 340 个真实常用英文单词。
- 每个单词包含：**原文、音标、多组（词性 + 中文释义）**，数据结构可扩展：

  ```js
  {
    "w": "graduate",
    "ph": "'grædʒueit",
    "senses": [
      { "pos": "n", "def": "毕业生" },
      { "pos": "v", "def": "毕业" }
    ]
  }
  ```

- 数据来源：基于开源免费英汉词典数据库 [ECDICT](https://github.com/skywind3000/ECDICT)（已按其许可使用）筛选、过滤派生词、仅保留常用词（Collins 星级 ≥3 或主流考试大纲词），并**逐条校验**长度与 V/W 规则、剔除跨难度重复。
- 生成与校验脚本：`build_wordbank.py`（生成）、`verify_wordbank.py`（复验规则，运行 `python verify_wordbank.py` 可再查一遍）。

## 字体与语言

- 简体中文与英文界面使用 `fonts/SSDunDun-CN.ttf`（“244-SSDunDunTi”，与 Roco 官网一致的中文美术字体）在本地渲染，离线可用；未命中时回退到系统字体。
- 英文/符文使用 `fonts/Rune-Regular.ttf`。
- **繁體中文**用系统自带的繁体黑体（不额外打包字体）：`css/style.css` 的 `--font-hant` 依次为 Noto Sans TC → Noto Sans CJK TC → 蘋方-繁（PingFang TC）→ 微軟正黑體（Microsoft JhengHei UI / JhengHei）→ 黑體-繁（Heiti TC）→ 儷黑 Pro → system-ui → 微软雅黑 / 苹方 → 敦敦体 → `sans-serif`。**为什么敦敦体不能放前面**：实测简体资源 145 个汉字 100% 命中敦敦体，而繁体资源 181 个汉字里 68 个（约 38%，學/習/識/轉/換/單/難/專/匯/歷/紀…）它没有——若放最前面会一字两形，故只作栈尾兜底（同时兜住拉丁字母与数字）。
- **日文**用系统自带的日本常用黑体：`--font-ja` 依次为 Noto Sans JP → Noto Sans CJK JP → ヒラギノ角ゴ（Hiragino Kaku Gothic ProN / Hiragino Sans）→ Yu Gothic (UI) → Meiryo → MS PGothic → system-ui → 微软雅黑 / 苹方 → 敦敦体 → `sans-serif`。日语 kanji 与繁体汉字的重叠部分同样不在敦敦体覆盖内，理由同上。
- `html[data-lang]` 把全站唯一字体入口 `--font-cn` 换成对应语言的栈（`zh`/`en` → `--font-latin`、`zh-Hant` → `--font-hant`、`ja` → `--font-ja`），因此一个属性就能让整个界面换字体；**同屏多语言的元素**（语言自称按钮、首访弹窗的标题行与提示分段）各自带 `data-lang` 并按元素选栈（`.lang-btn` / `.lang-gate-btn` / `.lang-gate-line` / `.lang-gate-seg`），中文界面下也能用正确字体渲染“繁體中文 / English / 日本語”。首访弹窗的提示行由 app.js 渲染成四个带 `data-lang` 的 `<span class="lang-gate-seg">`（段间是「 · 」文本节点），避免整段文字逐字回退造成混排。
- 判定处的**音标**使用通用无衬线字体（SSDunDun 不覆盖 IPA 特殊符号，如 ʃ θ æ ŋ），并以双斜杠括起（如 `/kæt/`）。

## 技术要点

- 不使用任何外部 CDN 或网络请求，完全离线（**包括字体**：日文走系统字体栈，不引入 Google Fonts 之类的远程字体）。
- 词库与文案资源都通过 `<script>` 标签以网页全局变量引入（`window.RUNE_WORDBANK` / `window.RUNE_I18N`，而非 `fetch` 本地文件），因此双击打开（`file://`）也无跨域问题。
- 所有用户输入均经过 HTML 转义（`textContent` / `escapeHtml`），并在各种非法输入（空输入、非字母、超长、损坏的 localStorage 等）下做了防御，不会崩溃。
- 导出 PNG 使用 Canvas 结合本地字体加载，背景保持透明；描边采取 8 方向偏移的**向外描边**效果。
- 多语言相关降级：语言资源缺失时静态文案保留 HTML 里的中文默认值、动态文案退化为空串（不崩溃）；`localStorage` 不可用（隐私模式等）时首访弹窗每次都会出现且选择不会被记忆；`<head>` 引导脚本另有 3 秒兜底，保证页面不会卡在模糊态。

## 迭代记录

本工程在初版基础上经历了一轮较大的用户体验与视觉迭代，主要如下：

- **文案统一**：面向用户的“Rune 字体/字形”统一改称“洛克文”，历史表头改为“洛克文字形”；认字母历史的「正确答案」改用一般字形显示。
- **作答体验**：提交后按统一 2.5 秒自动切下一题；按钮在判定后变为「继续」、回车同步切换，杜绝同一题被重复判定；输入框提示在聚焦时立即消失。
- **题目防作弊**：展示洛克文字形的区域不允许复制（`user-select: none`）。
- **识别清晰度**：整体字号加大；修复个别字形（如字母 d）上下被裁切的问题（line-height/padding）；音标改用可读的无衬线字体；每个词性单独的释义换行展示。
- **转换增强**：描边改为向外描边（DOM 与导出一致）；新增“正常 / 洛克文”字形切换；控件顺序调整为 字形颜色 → 描边颜色 → 描边粗细 → 字形；颜色选择框填满圆角。
- **历史增强**：认单词历史悬停正确答案可查看释义。
- **视觉/布局**：去掉页面的装饰性渐变底色（更简洁）；容器加宽并支持宽屏下“题目区 + 历史区”两列布局，减少两侧空白。

### 第二轮（体验与细节）

- **字号统一**：历史记录表格所有字符（含洛克文字形）统一字号（第三轮进一步统一为 15.5px）。
- **指示灯动画**：每答一题，历史最新一行以淡绿/淡粉在 1.5s 内渐变回原色。
- **字形加粗**：全站敦敦体 font-weight 由 700/600 砍半至 400/300（含标题），减轻过粗观感。
- **音标格式**：判定处音标以双斜杠括起，如 `/kæt/`。
- **页眉细节**：标题与副标题行距收紧更美观；“R” 图标与品牌标题均不可选中复制；点击“RuneLearn”品牌可在 rune / 原文字形之间切换。
- **页脚文案**：改为“卡洛西亚的凌晨四点”。
- **顶部对齐**：宽屏两列下题目区与历史区顶部对齐。
- **超宽屏扩展**：页面随屏宽继续扩宽，但左右各至少留白 150px（封顶 1500px）。
- **题目字号自适应**：认单词题目若在默认字号下一行放不下，会先计算合适字号再渲染（不大于默认字号），保证单行完整显示。

### 第三轮（健壮性、判定观感、转换扩展）

- **判定标签观感**：修复“正确/错误”标签被多行正确答案拉高的问题（`align-self:flex-start`，标签顶部对齐不被拉伸）。
- **认单词不再自动切题**：认单词提交后停在当前题，需手动点「继续」；认字母仍保留 2.5s 自动切题。
- **转换扩展**：新增「字号大小」拉杆；输入框改为 textarea 支持换行（渲染 `pre-wrap`、导出按 `\n` 分行）；译文模式下默认**字符级字体**（英文用 Rune、数字/汉字用敦敦体）。
- **placeholder 尺寸与文案**：placeholder 字号与输入框一致（不再缩小）；只保留“不溢出”的优雅截断；字母/单词输入框聚焦时 placeholder 隐藏。按机型切换文案：手机/平板显示“输入字母”“输入单词”，电脑显示“输入字母，回车或点确定”“输入单词，回车或点确定”。
- **历史首行动画**：颜色指示灯仅在提交答案后播放一次，切换板块/加载历史时不触发。
- **健壮性加固**：为转换控件取值增加 `inputVal` 空值守卫，控件缺失也不崩溃。
- **转换输入框为敦敦体**：转换输入框内文字与 placeholder 统一使用敦敦体（不再回退到默认无衬线字体）。
- **转换输入框随行数自动增高**：textarea 高度随输入行数动态变化（手机端无需内部滚动）；默认**单行高**且**与右侧「清空」按钮等高**（`rows="1"`、`padding:5px 15px`、`min-height:39px`；早期默认为两行、后为 52px）。按钮高度取决于字体行高（`SSDunDun-CN` 的 `normal` 行高 ≈1.0em，15px 字号 → 约 39px），故不写死像素，而是由 `syncConvertRowHeight()` 在运行时测量 `#convert-clear` 的 `offsetHeight` 写入 `min-height`，并在 `resize` 与 `document.fonts.ready` 时重算。
- **字母/单词输入框样式统一**：认字母与认单词输入框高度一致、placeholder 字距一致（正文对齐差异保留）；**字号统一为 22px**（`.quiz-answer .text-input`，两框的正文与 placeholder 同字号，与认字母板块一致，早期认单词为 17px）。
- **品牌颜色统一**：RuneLearn 标题的两种字形（rune / 原文）颜色统一为敦敦体 `#2e2a26`。
- **网站图标 favicon**：新增基于 rune 字形「R」的透明图标（`favicon.png`，色 `#2e2a26`），浏览器标签页显示。
- **历史字号 15.5px**：历史记录表格的表头与所有值统一为 15.5px（含洛克文字形）。
- **机型识别提示语**：手机/平板用短 placeholder，电脑用长 placeholder，避免输入框内文字溢出（无需改字号）。
- **推进时滚动到题目框**：提交后点「继续」或「换一个」切题时，在锁定输入框光标的同时，把题目展示框平滑滚动到屏幕顶端，短屏设备也能看到题目。
- **滚动时机修正**：锁定光标用 `input.focus({preventScroll:true})`，先锁定光标且不让聚焦触发浏览器自动滚动，再 `scrollIntoView({behavior:'smooth',block:'start'})` 滚到 `.quiz-stage` 顶端；若先滚动后聚焦，聚焦的自动滚动会覆盖平滑滚动导致滚不到位。初始化/提交判定不滚动，仅「继续」「换一个」、认字母自动切题滚动。
- **点击输入框也滚到题目框顶端**：此前只有「继续」「换一个」会自动切题才滚动，用户面对第一道题时习惯直接点输入框，浏览器因聚焦产生的自动滚动不会把题目框带到顶端，`.quiz-stage` 在短屏上常显示不全。新增 `bindStageScrollOnInput(input, glyph, isProgrammatic)`，为认字母/认单词输入框同时监听 `click` 与 `focus`，触发 `scrollStageToTop`。`click` 必须单独监听，但**原因不是**“初始化已把输入框聚焦”：识记板块初始是隐藏的（`.panel{display:none}`，只有 `#panel-convert` 带 `active`），初始化时对隐藏元素调用的 `focus()` 无效，输入框通常并未持有焦点——首次点击会 `focus`→`click` 各触发一次，故用 `nowMs()` 时间戳在 400ms 内去重、只滚一次；而用户已聚焦后再次点击（例如重新定位光标）不再派发 `focus`，此时只有 `click` 能触发滚动。为不破坏“初始化不滚动、提交判定不滚动”，程序化聚焦期间置 `letterFocusLock`/`wordFocusLock` 标志，`focus` 监听据此跳过（`focus()` 的 `focus` 事件是同步派发的，故标志可靠）。
- **自动滚动改为按机型启用 + 移动端补滚**：
  - **电脑端禁用**：新增 `autoScrollEnabled()`（= `isMobileOrTablet()`），`scrollStageToTop` 在电脑上直接 return。电脑屏幕足够大、也不会弹输入法，自动滚动只会打断用户的浏览位置；手机/平板屏幕小且聚焦会弹输入法，才需要把题目框带到顶端。
  - **移动端补滚**：iPhone/iPad 上聚焦输入框后，输入法弹出是异步的（约 250–300ms），系统会按“保持输入框可见”再改写一次滚动位置，把页面首次发起的滚动覆盖掉——表现为点「继续」不滚动、或点输入框后 `.quiz-stage` 仍没到顶端。为此在 `MOBILE_RESCROLL_DELAYS`=[400,700,1000]ms 补滚，并监听 `window.visualViewport` 的 `resize`（输入法弹出/收起会改变 visual viewport）再校正一次。补滚一律用 `behavior:'smooth'`，避免“动画播到一半被瞬移”的跳变；`stageReachedTop()` 判断题目框已在视口顶端（误差 12px）则跳过；每次新请求 `stageScrollSeq` 自增作废旧补滚，用户滚轮/手指拖动时 `cancelStageScroll()` 放弃补滚，不与用户抢滚动位置。
  - `tests/ui_behavior_test.js` 相应改写为 **[3] 电脑端全流程不滚动 / 移动端推进滚动**、**[4] 移动端点击与聚焦输入框滚动、程序化聚焦不滚动**。
- **审计修正（同轮）**：对上述滚动改动做了一轮只读审计，据此修掉三处问题——(1) `autoGrowTextarea()` 在元素不可见（`display:none`，已切到识记板块）时 `scrollHeight===0`，会被 `resize`/`document.fonts.ready` 触发并把用户输入的多行高度压回单行，现在不可见即直接 return；(2) 高度计算按 `box-sizing:border-box` 补上 `offsetHeight-clientHeight` 的上下边框，否则末行被裁约 2px；(3) 同一次点击的 `focus`→`click` 会连续触发两次滚动，用时间戳去重。另修正了一处**错误注释**：曾以为“初始化已程序化聚焦输入框”，实际识记板块初始 `display:none`，`focus()` 无效。
- **测试收归目录**：Node 测试脚本移入 `tests/`（含 `README.md` 说明），保持根目录简洁。

### 第四轮（多语言：最初为中文 / English / 日本語，随后追加繁體中文）

本轮把单语（中文）站点改造成三语站点，新增“首访语言弹窗”与“中文释义按语言显隐”。原则：**界面文案零硬编码**，全部集中在语言资源里；不破坏既有路由、功能与样式体系。

- **文案资源 `js/i18n.js`（新文件）**：以 `<script>` 引入并挂在 `window.RUNE_I18N`（与 `wordbank.js` 同一套路，`file://` 下无跨域问题，**不引入任何 CDN**）。结构：
  - `langs`: `[{key:'zh',native:'中文',locale:'zh-CN'},{key:'en',native:'English',locale:'en'},{key:'ja',native:'日本語',locale:'ja'}]`——`native` 是语言自称，不翻译；
  - `dict`: `zh/en/ja` 三份扁平 key 文案（点号分层，如 `letter.placeholder.long`、`history.col.diff`），带参数的用 `{name}` 占位（如 `word.meta = '难度：{diff}'`）；某语言缺 key 时回退中文；
  - `gate`: 首访弹窗的三语提示（标题三行、提示一行），此时用户尚未选语言，故三种语言并列展示；
  - `readStoredLang()`: 读 `localStorage` 并校验（JSON 与明文都兼容），**`<head>` 引导脚本与 app.js 共用**，避免两处判定走偏。
- **app.js 新增第 0 / 0.1 节**：`t(key, vars)`/`tIn(lang,key)`/`isZh()`/`applyLanguage()`/`setLang()`/`refreshDynamicCopy()`；`applyLanguage` 负责 `<html data-lang/lang>`、`document.title`、静态文案、页脚按钮高亮与动态内容重排，`setLang` = `applyLanguage` + 写 `localStorage`（键 `runelearn.lang`）。原先行内的中文文案（判定、历史表头、难度、占位、导出提示、错误提示、按钮“确定/继续”…）全部改走 `t()`，**app.js 中已无中文文案字面量**（可用脚本扫描复核）。
- **静态文案标注**：`index.html` 用 `data-i18n="key"`（文本）与 `data-i18n-title="key"`（title 属性）标注；HTML 里保留的中文即“默认值兼无脚本兜底”，且与 `dict.zh` 逐条一致（`tests/i18n_test.js` 会校验）。输入框 placeholder 不进 `data-i18n`：它要按机型（长短版）与聚焦状态决定，统一由 `refreshPlaceholders()` 接管（`convInputFocused`/`letterInputFocused`/`wordInputFocused` 三个标志保证“聚焦时仍保持隐藏”，不破坏约定 #6）。
- **语言切换入口**：页脚最下方三枚互斥胶囊按钮（`#lang-switch`，按钮由语言表生成、语言自称不翻译），点击即 `setLang()`——**立即生效、无需刷新**，并写入 `localStorage` 持久化。
- **首访语言弹窗（自绘，不用原生 `select`/`alert`）**：
  - 判定与模糊前置：`<head>` 内联引导脚本在首次绘制前跑（`js/i18n.js` 先于它加载，故复用 `readStoredLang()`）。有记忆语言 → 写 `data-lang` 让字体与文案一步到位；无记忆 → 挂 `data-lang-gate="pending"`，CSS 立即 `filter:blur(9px) saturate(.92)` + `pointer-events:none` + `body{overflow:hidden}`，并给 `.page` 加 `transition:filter .34s` 让解除时平滑恢复。另挂一个 3s 兜底：若 `.lang-gate` 未出现（脚本缺失/报错）就自动解除门禁，绝不让页面卡在模糊态。
  - 弹窗由 `buildLangGate()` 用 `createElement` 构建：`.lang-gate`（固定蒙层，`rgba(46,42,38,.34)`）→ `.lang-gate-card`（`role="dialog"`、`aria-modal`，纸色卡片 + 圆角 + 阴影，与站点 `.card` 语汇一致）→ 三行标题（每行按自身语言选字体）/ 三个自绘按钮 / 一行三语提示。
  - 入场动效用 CSS 过渡（`.lang-gate{opacity:0}` → `.open`；卡片 `translateY(14px) scale(.97)` → `none`）。触发方式为**同步重排 + 加类**（`gate.offsetWidth` 读一次再 `classList.add('open')`），刻意不用 `requestAnimationFrame`：后台标签页里 rAF 可能长时间不触发，弹窗会卡在透明态。构建后对首个按钮 `focus({preventScroll:true})`（键盘可达，且不会把背后页面滚走）。
  - 选择语言 → `setLang()` 立即生效并记忆 → `closeLangGate()` 移除 `data-lang-gate`（模糊解除与淡出同时进行）、去掉 `.open`、320ms 后从 DOM 摘掉节点；已记忆语言的场景走 `openLangGateIfNeeded()` 的兜底分支，顺手清理可能残留的门禁标记。
- **字体与回退**：`css/style.css` 新增 `--font-latin`（敦敦体优先，中文与英文共用）与 `--font-ja`（`"Noto Sans JP","Noto Sans CJK JP","Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic UI","Yu Gothic","Meiryo","MS PGothic",system-ui,"Microsoft YaHei","PingFang SC","SSDunDun-CN",sans-serif`）；`html[data-lang="ja"]{--font-cn:var(--font-ja)}` 一刀切换全站字体（`--font-cn` 是全站唯一字体入口，`.stage-canvas .cn-ch`、`.brand-rune` 等都走它）。日文栈刻意不把敦敦体放前面（敦敦体覆盖假名与 GB2312 汉字，但缺“語/選/設/読/単”等日文常用字），只在**最后兜底**，避免日文界面混用两种字形。JS 侧 `uiFontStack()` 与 CSS 两份栈保持一致，供 canvas 导出与内联样式使用。语言自称按钮/弹窗各行再按 `data-lang` 各自选栈，中文界面下也能用日文字体渲染“日本語”。
- **条件展示：非中文隐藏中文释义**：词库只有中文释义，故非中文界面下——
  - 判定区：`renderWordVerdict()` 仅在 `isZh()` 时拼 `<span class="word-senses">…</span>`（词性 + 中文释义），音标与正确答案保留；
  - 历史记录：`renderWordHistory()` 仅在 `isZh()` 时写 `title="…"` 悬停释义；
  - 切回中文即恢复：判定结果与历史都由“状态 + 渲染函数”负责（`wordState.verdict` + `renderWordVerdict()`；语言切换时 `refreshDynamicCopy()` 整块重排），因此不需要保存/还原 DOM；
  - CSS 兜底：`html:not([data-lang="zh"]) .word-senses{display:none}`，即使时序上有瞬间残留也不会闪出中文；
  - **词库与历史数据不改写**：释义照旧存进历史（`senseText`），只是不渲染。
- **历史数据的语言兼容**：难度列旧记录存的是当时语言的标签、新记录另存 `diffKey`，展示时 `localizeDiffValue()` 反查回 key 再按当前语言渲染（中/英/日三种旧标签都能识别）；认字母历史里 V/W 的“正确答案”规范值固定存中文“V 或 W”，展示时按 `isVW(r.glyph)` 本地化为 “V or W” / “V または W”。**历史数据本身一律不改写**，切语言只影响渲染。
- **启动顺序**：第 0 节按 `localStorage` 装载 `currentLang`（早于各板块绑定，故占位提示/难度/按钮一开始就是对的语言）→ 各板块初始化 → 第 6 节 `buildLangSwitcher()`、`applyLanguage(currentLang)`、`openLangGateIfNeeded()`。
- **测试**：新增 `tests/i18n_test.js`（离线 DOM 桩）覆盖资源完整性、页脚切换与持久化、首访弹窗开合与二次访问、释义显隐、旧历史数据本地化、以及非法语言值 / localStorage 抛错 / 资源缺失 / CSS 字体栈与模糊规则的静态检查；`tests/smoke_test.js` 与 `tests/ui_behavior_test.js` 的桩补载 `js/i18n.js`、`documentElement`、`#lang-switch` 与 `#lang-gate`（新增 DOM id 需同步补桩）。三个脚本全部通过。
- **冒烟观感**：用 Edge headless 截图核对——首访为“内容模糊 + 自绘对话框（三语标题 + 三枚语言按钮 + 三语提示）”；英文界面下判定区只剩 `Correct / Answer: fact /fækt/`（无中文释义），历史表头为 `No. / Level / Rune glyph / Answer / Result`，页脚为 `4 a.m. in Calosia`；中文界面同一题则完整显示 `n. / v.` 等多条中文释义；页脚三枚语言按钮高亮正确。

#### 第四轮补记（追加繁體中文）

应追加要求把语言扩到四种，顺序为 **简体中文 → 繁體中文 → English → 日本語**：

- **资源**：`js/i18n.js` 的 `langs` 增加 `{key:'zh-Hant', native:'繁體中文', locale:'zh-Hant'}`（插在 `zh` 之后），`dict` 增加 `'zh-Hant'` 一份；`gate.title/tip` 扩为 4 项（数组顺序必须与 `langs` 一致，弹窗每行按 `LANG_KEYS[i]` 取 `data-lang`）。
- **簡繁不是换字形**：繁体文案按台湾用词习惯逐条重写——單字（≠单词）、匯出（≠导出）、字型大小（≠字号大小）、自訂（≠自定义）、歷史紀錄（≠历史记录）、尚無紀錄、介面（≠界面）、產生（≠生成）、換一題（≠换一个）、點確定、瀏覽器、解鎖…；测试里用“关键文案必须与简体不同”＋“简体专用字黑名单（单词汇录历题难专语选择体记识学习确认导显转换时间门问个们页电…）不得出现”双重把关，防止直接拿简体做字符替换。
- **字体**：新增 `--font-hant`（Noto Sans TC → Noto Sans CJK TC → PingFang TC → 微軟正黑體 → 黑體-繁 → 儷黑 Pro → … → 敦敦体兜底）与 `html[data-lang="zh-Hant"]{--font-cn:var(--font-hant)}`；`app.js` 的 `uiFontStack()` 同步加一份。**实测**：简体资源 145 个汉字在敦敦体 100% 命中，繁体资源 181 个汉字缺 68 个（38%）——所以繁体必须走系统繁体黑体，敦敦体只兜底。
- **释义显隐的口径改为“是否中文”**：`isZh()` 重命名为 `isChineseLang()`（`zh` 或 `zh-` 前缀），简体与繁体都显示词库的中文释义；`applyLanguage` 额外挂 `<html data-lang-zh="1">` 标记，CSS 兜底规则改为 `html:not([data-lang-zh]) .word-senses{display:none}`（比逐个枚举 `data-lang` 更耐扩展，将来加 `zh-HK` 也不用改）。
- **测试**：`tests/i18n_test.js` 相应扩写（84 条断言）——四份资源 key 对齐、语言顺序与自称、繁体用词与简体专用字检查、页脚四按钮切换与持久化、首访弹窗四行标题/四按钮、繁体界面释义照常显示、旧历史记录在繁体下的本地化、CSS 繁体栈与 `data-lang-zh` 规则；`smoke_test.js`（40 条）与 `ui_behavior_test.js`（34 条）无回归。

### 第五轮（八项修正：混排/字号/高度/占位/释义口径/免责/日语术语/文档多语言）

应一批问题清单修正（清单截图为繁体、日文界面下的混排问题）：

- **首访弹窗同屏多语言不再混排**：提示行由“一整段拼接”改为**按语言分四段**渲染（每段一个带 `data-lang` 的 `<span class="lang-gate-seg">`，段间用「 · 」文本节点连接），CSS 字体规则扩到 `.lang-gate-seg[data-lang=…]`。此前整段文字用敦敦体渲染，繁体/日文部分会逐字回退到系统字体，观感混排。
- **首访弹窗整体放大**：卡片 360→400px、标题四行统一 20px（原来第二行起被压到 14.5px）、按钮 17px、提示 14px、内边距同步放大（移动端媒体查询另有一档 18/16/13px）。
- **繁体界面改为不显示中文释义**：口径从“是否中文”收紧为“是否简体”（`isChineseLang()` → `showsWordSenses()`，`currentLang === 'zh'`），不再挂 `<html data-lang-zh>` 标记，CSS 兜底改为 `html:not([data-lang="zh"]) .word-senses{display:none}`。词库与历史数据（`senseText`）仍不改写；繁体界面不再混入简体释义，保持全繁体观感。
- **转换行高差的根因修复**：输入框 `min-height` 来自“测量 `#convert-clear` 按钮高度”，而按钮 `line-height:normal` 随字体栈变化——切到繁体按钮实测变 43px、日文变 45px，输入框却停在 39px，出现 4–6px 高低差（实测 zh 39/39、zh-Hant 39/43、ja 39/45）。修法：`refreshDynamicCopy()` 里补调 `syncConvertRowHeight()`（语言切换后重新对齐），并在 `switchMain('convert')` 时补一次（在其它板块切语言时转换面板 `display:none`，按钮测不到高度，回到转换板块才测得到）。
- **识记输入框与提交按钮统一 52px**：`.quiz-answer .btn` 原来只有普通按钮高度（约 41px），与 52px 的输入框并排有明显高低差；现设 `height:52px` + `inline-flex` 居中，两者严格等高。
- **英/日 placeholder 溢出修复**：实测输入框可用内宽 308px（340px 减内边距与边框），22px 下英文长版 432.6px、日文长版 345.9px 均溢出（截图可见裁切）。处理：英文长版文案收短为 “Type the letter, then press Enter” / “Type the word, then press Enter”（去掉 “ or Submit”，按钮就在旁边语义仍完整），并给 \`html[data-lang="en"]\` / \`html[data-lang="ja"]\` 的 `.quiz-answer .text-input::placeholder` 设 `font-size:18px`；改后实测 en 272px、ja 283px、繁体 284.7px、简体 236.3px 均 ≤ 308px（简体与繁体维持 22px）。
- **页脚免责声明**：新增文案键 `footer.disclaimer`（本网站与官方无关 / 本網站與官方無關 / This site is not affiliated with the official site. / 本サイトは公式サイトとは関係ありません。），`index.html` 页脚新增 `.footer-disclaimer` 节点，随语言切换。
- **日语术语修正**：Roco 的日文名为 ロコ，故「洛克文」在日语中统一写作**ロコ文**（不再用 ロック文字）——`doc.title` / `brand.sub` / `tab.convert` / `tab.recognize` / `convert.title` / `convert.desc` / `convert.scriptRune` / `letter.desc` / `word.desc` / `history.col.glyph` 全部替换；顺带修正 `diff.expert` 上級→エキスパート、解锁提示改用「解禁」、`word.err.invalid` 改「英字のみで入力してください」、弹窗提示第 4 条改「選択後はページ下部でいつでも変更できます」。测试新增 [1.2] 段把关（含“日语资源中不得出现「ロック」”）。
- **文档多语言**：根目录 README 扩为**四份语言版本**（`README.md` 简体 / `README.zh-Hant.md` / `README.en.md` / `README.ja.md`，各文件顶部互链），并把“改动 README 必须四份同步（连同 REAL_README）”的规则写进 `AGENT_HANDOFF.md`；BUILD_GUIDE / tests/README 同步更新。
- **测试与验证**：`tests/i18n_test.js` 由 84 条扩到 95 条断言（新增弹窗提示分段结构、繁体隐藏释义、日语术语、CSS 字号/分段字体/placeholder 字号/52px 按钮/免责声明样式/`data-lang-zh` 移除等检查）；三套测试共 169 条全绿。本轮改用 **puppeteer（node workspace 已装）+ 缓存 Chrome** 做真实浏览器测量与截图（headless Edge 在本机已失效）：逐语言测转换行/识记行高度、placeholder 文本实测宽度 vs 输入框可用宽度、弹窗字号与分段字体、四语言释义显隐、页脚免责声明，并截取弹窗/转换行/识记行/整页核验观感。

### 第六轮（英文术语统一：Rune Script → Roco Script）

面向用户的英文表述停用「Rune」——开发语境里仍可叫 rune 字形（字体文件、CSS 类名等**内部标识一律不动**），但英文界面与 `README.en.md` 统一改称 **Roco Script**（品牌名 RuneLearn 不变）：

- **命名规则**：全称「Roco Script」用于正式场合（`doc.title` = RuneLearn · Learn the Roco Script、`brand.sub` = Roco Script · Learn & Convert、`convert.desc` 里的 the Roco Script）；简称「Roco」用于复合词与短标签（`tab.convert` / `convert.title` = Roco Converter、`tab.recognize` = Roco Practice、`letter.desc` / `word.desc` / `history.col.glyph` = Roco glyph、字形切换按钮 `convert.scriptRune` = Roco）——与中文「洛克文」、日文「ロコ文」是同级的短称。
- **改动范围**：`js/i18n.js` 英文词典 10 处 + `README.en.md` 8 处；简体/繁体/日文三份资源与 README 本来就不用 Rune，未动。
- **内部标识不动**：`@font-face` 的 `"Rune"` 字体名、`fonts/Rune-Regular.ttf`、CSS 类 `rune-ch` / `.rune`、`data-script="rune"`、`RuneCanvas`、localStorage 键 `runelearn.*`、导出文件名等均非用户可见，保持原样（改字体名会牵连 CSS/JS/canvas 导出，纯属自找风险）。
- **防回归**：`tests/i18n_test.js` 新增 [1.3] 段——除掉品牌名 RuneLearn 后英文资源不得再出现 Rune，并逐一核对 10 处新文案；三套测试全绿。
- **文档同步**：AGENT_HANDOFF 关键规则 1 / 约定 13 / 约定 14 / 2.6 回退项、BUILD_GUIDE 文案约定、tests/README 覆盖范围、本文件同步更新。

### 第七轮（页脚“查看源代码”链接 + 三处板块描述字号）

- **页脚新增源代码入口**：免责说明（`footer.disclaimer`）右侧同一行新增链接“查看源代码”（文案键 `footer.source`，四语：查看源代码 / 查看原始碼 / View source / ソースコードを見る），`target="_blank" rel="noopener noreferrer"` 指向 <https://github.com/SysGrapes/RuneLearn>。样式与免责说明完全一致（`.footer-disclaimer-row` flex 居中、12.5px、`#b0a688`），链接默认 `text-decoration:none`。
- **下划线一次性动效**：`::after` 伪元素画 1px 下划线（`background:currentColor`），配 `@keyframes footer-source-underline` 12s linear `forwards`——0%–83.333%（前 10 秒）不透明、100%（第 12 秒）透明，即“每次打开页面先渲染下划线、留存 10 秒、再 2 秒内缓慢消失”。选 opacity 而非 `text-decoration-color` 是为兼容性；动画挂在元素上，**每次打开页面自然播放一次**，切语言只改 `textContent`、不重建元素，故不会重播。
- **三处板块描述调大一个字号**：`.panel-desc`（`convert.desc` / `letter.desc` / `word.desc`，即“输入文本，实时以洛克文字型显示…”“看洛克文字形，写出对应的英文字母…”“看洛克文字形，拼出对应的英文单词…”三句）15px → 16px；中文与英文界面此前都偏小，一个字号到位。
- **测试**：`tests/i18n_test.js` [1] 段补“源代码入口四语齐全 + index.html 节点/指向/新窗口”断言，[6] 段补“链接同字号同色且无下划线 / 12s 关键帧 / panel-desc 16px”静态断言；三套测试全绿。
- **浏览器实测**（puppeteer）：链接位于免责说明右侧同一行、计算样式与免责说明逐项相同（12.5px / rgb(176,166,136) / text-decoration:none）、href 与 target 正确；下划线 opacity 在打开后 0.6s 为 1、12.6s 为 0（截图核对可见→消失）；页脚按钮切到四种语言时链接文案分别为 查看源代码 / 查看原始碼 / View source / ソースコードを見る。


## 文档

- [构建指南（从零复现，含数据如何生成）](docs/BUILD_GUIDE.md) — 面向初学者的逐步说明：用什么字体、什么数据、数据如何用脚本创建与校验。
- [Agent 交接与工程说明](docs/AGENT_HANDOFF.md) — 让其他 agent/协作者接手继续编辑本工程的交接 prompt 与架构说明。
- [对抗测试报告](docs/ADVERSARIAL_TEST_REPORT.md) — 本轮对抗性测试（安全/健壮性/逻辑/观感）的范围、方法、发现的问题与修复。

## 文件结构

```
runelearn/
├── index.html              # 主页面
├── favicon.png             # 网站图标（rune 字形 R）
├── README.md               # 用户向总览（简体中文，四份语言版本之一）
├── README.zh-Hant.md       # 用户向总览（繁體中文）
├── README.en.md            # 用户向总览（English）
├── README.ja.md            # 用户向总览（日本語；「洛克文」= ロコ文）
├── docs/
│   ├── BUILD_GUIDE.md      # 构建/数据生成指南（从零复现）
│   ├── AGENT_HANDOFF.md    # Agent 交接与工程说明
│   └── ADVERSARIAL_TEST_REPORT.md  # 对抗测试报告
├── css/style.css           # 样式（含 @font-face、四种语言的字体栈、首访弹窗与蒙层样式）
├── js/
│   ├── i18n.js             # 界面文案资源（简体 / 繁體 / English / 日本語）+ 语言表 + 首访弹窗四语提示
│   ├── app.js              # 应用逻辑（含多语言落地、首访语言弹窗、释义按语言显隐）
│   └── wordbank.js         # 单词库数据
├── fonts/
│   ├── Rune-Regular.ttf    # Rune 字体
│   └── SSDunDun-CN.ttf     # 中文/英文字体（日文用系统中日文黑体，见 --font-ja）
├── tests/                  # 离线 Node 测试脚本（见 tests/README.md）
│   ├── smoke_test.js       # 核心逻辑冒烟 / 对抗测试
│   ├── ui_behavior_test.js # 机型 placeholder 与滚动行为
│   └── i18n_test.js        # 多语言、首访弹窗、释义显隐
├── build_wordbank.py       # （可选）词库生成脚本
└── verify_wordbank.py      # （可选）词库规则复验脚本
```

> 根目录 README 是**四份语言版本**（简体/繁體/English/日本語），任何一处改动都要四份同步更新（细则见 AGENT_HANDOFF 约定 14）。
