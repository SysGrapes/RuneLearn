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

页脚常驻语言切换（四枚按钮）与「本网站与官方无关」的免责说明（文案随语言切换，键 `footer.disclaimer`），免责说明右侧同一行还有指向 GitHub 仓库的「查看源代码」链接（键 `footer.source`，带一次性下划线动效，见第七轮）。

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

- 简体中文界面使用 `fonts/SSDunDun-CN.ttf`（“244-SSDunDunTi”，与 Roco 官网一致的中文美术字体）在本地渲染，离线可用；未命中时回退到系统字体。
- **英文界面**使用 `fonts/en2.ttf`（字体内部名 HYYouYuan）：它同时覆盖基本拉丁与常用汉字，所以英文界面里出现的中文（页脚 slogan、语言按钮的中文自称…）也不用另找字体；缺字时逐级回退到系统黑体，敦敦体仍在栈尾兜底（`--font-en`）。
- **洛克文字形有两套**，可全局切换：默认 `fonts/Rune-Regular.ttf`（符文风格），另一套 `fonts/Rocofontblack-Regular.ttf`（游戏内黑体风格，内部名 Roco font-black Regular）。两者都只覆盖 A–Z/a–z（分别 58 / 239 个码位），**没有中文字形**，所以页面上凡是要显示洛克文的地方都走“字形优先 + 界面字体兜底”的混合栈（`--font-rune-mix`），非拉丁字符自动落回当前语言的界面字体。
- **繁體中文**用系统自带的繁体黑体（不额外打包字体）：`css/style.css` 的 `--font-hant` 依次为 Noto Sans TC → Noto Sans CJK TC → 蘋方-繁（PingFang TC）→ 微軟正黑體（Microsoft JhengHei UI / JhengHei）→ 黑體-繁（Heiti TC）→ 儷黑 Pro → system-ui → 微软雅黑 / 苹方 → 敦敦体 → `sans-serif`。**为什么敦敦体不能放前面**：实测简体资源 145 个汉字 100% 命中敦敦体，而繁体资源 181 个汉字里 68 个（约 38%，學/習/識/轉/換/單/難/專/匯/歷/紀…）它没有——若放最前面会一字两形，故只作栈尾兜底（同时兜住拉丁字母与数字）。
- **日文**用系统自带的日本常用黑体：`--font-ja` 依次为 Noto Sans JP → Noto Sans CJK JP → ヒラギノ角ゴ（Hiragino Kaku Gothic ProN / Hiragino Sans）→ Yu Gothic (UI) → Meiryo → MS PGothic → system-ui → 微软雅黑 / 苹方 → 敦敦体 → `sans-serif`。日语 kanji 与繁体汉字的重叠部分同样不在敦敦体覆盖内，理由同上。
- `html[data-lang]` 把全站唯一字体入口 `--font-cn` 换成对应语言的栈（`zh` → `--font-latin`、`en` → `--font-en`、`zh-Hant` → `--font-hant`、`ja` → `--font-ja`），因此一个属性就能让整个界面换字体；**同屏多语言的元素**（语言自称按钮、首访弹窗的标题行与提示分段）各自带 `data-lang` 并按元素选栈（`.lang-btn` / `.lang-gate-btn` / `.lang-gate-line` / `.lang-gate-seg`），中文界面下也能用正确字体渲染“繁體中文 / English / 日本語”。首访弹窗的提示行由 app.js 渲染成四个带 `data-lang` 的 `<span class="lang-gate-seg">`（段间是「 · 」文本节点），避免整段文字逐字回退造成混排。
- **洛克文字形靠 `html[data-glyph-font]` 整体切换**（`rune` / `roco-black`）：CSS 只定义两个变量 `--font-rune`（纯字形栈，字符级 `.rune-ch` 用）与 `--font-rune-mix`（字形优先 + 界面字体兜底，品牌图标/转换舞台/题目/历史表用），`html[data-glyph-font="roco-black"]` 把这两个变量换成 RocoBlack——**一处属性、全站字形一起变**，不需要逐个改类名。首访字形弹窗里的两枚按钮是唯一例外：它们要“同时展示两款字形”，故 CSS 里写死 `"Rune"` / `"RocoBlack"`，不跟随当前选择。
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

### 第八轮（GitHub Pages SEO：只加元数据与抓取配置，不改可见内容）

站点托管在 GitHub Pages（<https://sysgrapes.github.io/RuneLearn/>）后做一轮**简单 SEO**：让各语言搜索引擎更容易收录，**不改变网站本身的任何可见内容**（文案、布局、交互一律未动；四语共用同一个 URL、语言在浏览器端切换这一架构也未动）。

- **`<head>` 元数据块**（`index.html`，`<title>` 之后、favicon 之前，附中文注释声明只加在 head、不影响可见内容）：
  - `meta name="description"`：以中文为主、含中英日关键词的站点描述（洛克文/Rune 字体/英文字母/英文单词/识记/转换/透明 PNG/RuneLearn 等）；
  - `meta name="keywords"`：面向百度等仍看 keywords 的引擎；
  - `link rel="canonical"` + `og:url`：规范 URL 固定为 <https://sysgrapes.github.io/RuneLearn/>；
  - **Open Graph** 五件套（type/url/title/description/image 不放——favicon 仅 64×64，低于各平台 og:image 最低要求，本轮刻意不放）+ `og:locale`（zh_CN）与三个 `og:locale:alternate`（zh_TW / en_US / ja_JP），让分享到社交平台时按语言展示；
  - **Twitter Card**（`summary`，无图形态）+ title/description；
  - **JSON-LD 结构化数据**：`@type: WebApplication`（name / alternateName=RuneLearn·洛克文学习 / url / description / applicationCategory=EducationalApplication / operatingSystem=Any / `inLanguage` = zh-CN、zh-TW、en、ja 四语 / isAccessibleForFree=true / offers price 0 USD），帮助搜索引擎理解“这是个免费教育类网页应用、支持四种语言”。
- **根目录新增 `robots.txt`**：`User-agent: *` + `Allow: /` + `Sitemap: https://sysgrapes.github.io/RuneLearn/sitemap.xml`（GitHub Pages 会原样伺服根目录文件，无需额外配置）。
- **根目录新增 `sitemap.xml`**：标准 urlset（单条 `<loc>` = 站点根 URL，附 `lastmod` / `changefreq` / `priority`），文件内注释说明“四语共用同一 URL、语言在浏览器端切换，故只有一条”。
- **已知局限（有意保留）**：分语言收录（hreflang）需要**分语言 URL**（如 `?lang=ja` 或静态 `/en/`、`/ja/` 页），会触及 `app.js` 的语言引导逻辑——与用户“不要改变网站本身的内容”的要求冲突，故本轮不做，列为后续可选项（见 AGENT_HANDOFF 2.8）。
- **测试**：`tests/i18n_test.js` 新增 **[7] SEO 段**（5 条断言：description/keywords/canonical；OG 含四语 locale alternates 与 Twitter Card；JSON-LD WebApplication + inLanguage 四语；robots.txt Allow + Sitemap 指向；sitemap.xml urlset + loc），三套测试全绿。
- **浏览器实测**（puppeteer）：`<title>`、description、canonical、og:locale 全部就位；JSON-LD 可解析且类型为 WebApplication；品牌标题、页脚、三处板块描述等**可见内容与改动前逐字一致**——确认零可见变化。
- **文档同步**：本文件、AGENT_HANDOFF（2.1/2.2/2.4/交付段/2.8）、BUILD_GUIDE（新增第 10 节）、tests/README（[7] 覆盖范围）同步更新。

### 第九轮（分语言 URL：/zh/ /zh-hant/ /en/ /ja/ + hreflang）

第八轮留下一个局限：四语共用一个 URL，搜索引擎只按一种语言收录。本轮落实**分语言 URL**（用户确认要“原 URL 下追加 /zh、/en 等”的形式），核心思路是“**构建产物**”：一个脚本从 index.html 生成五个页面，页面源文件仍只有一份。

- **新增 `build_lang_pages.js`（根目录，Node 零依赖）**：读取 `index.html` 与 `js/i18n.js`（vm 加载取各语言 `doc.title`），生成五个页面并写回磁盘——`index.html`（根目录，x-default，静态文案仍为简体中文）与 `zh/index.html`、`zh-hant/index.html`、`en/index.html`、`ja/index.html`：
  - **只改 `<head>` 与资源相对路径，`<body>` 从 index.html 逐字复制**（data-i18n 标注数量五页一致，测试把关）；子页里 `js/wordbank.js`、`js/app.js` 与 head 里 `css/style.css`、`favicon.png`、`js/i18n.js` 统一加 `../` 前缀（线上 `/RuneLearn/en/` 与本地 `file://` 双击都能打开）。
  - **head 按语言本地化**：`<title>` 取 `dict.*.doc.title`（英文 = RuneLearn · Learn the Roco Script、日文 = RuneLearn · ロコ文の学習、繁体 = 洛克文學習）；description / keywords / OG / Twitter / JSON-LD 按语言撰写（英文用「Roco Script」、日文用「ロコ文」、繁体按台湾用词，与界面口径一致）；`canonical` / `og:url` / JSON-LD `url` 指向**自身**；`og:locale` 取该页语言、alternates 为其余三种（去重）；子页 JSON-LD `inLanguage` 为单语言，根页保持四语。
  - **hreflang 互指组**：五页都带同一组五个 `<link rel="alternate" hreflang="…">`（zh / zh-Hant / en / ja / x-default→根目录），值与脚本顶部 `SITE` 常量同源（换域名只改这一处再重跑）。
  - **引导脚本升级（五页共用同一份）**：`<head>` 引导脚本先做**路径检测**——`location.pathname` 以 `/zh/` `/zh-hant/` `/en/` `/ja/` 结尾时，预置对应语言（`zh-hant` 映射到语言键 `zh-Hant`）并**写入 localStorage**，因此分语言页**不弹首访弹窗**；未命中走原逻辑（有记忆→直接用；无记忆→挂 gate 弹窗）。**app.js 一行未改**——`langGateNeeded()` 的判据就是“有无语言记忆”，引导脚本写库后自然不弹窗。
  - **行为口径**：URL 只是**入口预置**。访问 `/en/` 后又在页脚切到中文，以用户选择为准（已写库）；再次访问 `/en/` 会再次预置英文（URL 是明确入口）。localStorage 按源共享，`/en/` 记住的语言在根目录也生效。
- **`sitemap.xml`**：扩为 5 条 URL（根 + 四语言，根 priority 1.0、语言页 0.9），每条带 5 个 `xhtml:link` 交替注解（共 25 个），补 `xmlns:xhtml` 命名空间。
- **robots.txt**：不变（Allow all + Sitemap 指向，Sitemap 行指向 sitemap.xml 本身，已覆盖新 URL）。
- **测试**：`tests/i18n_test.js` 新增 **[8] 段**（12 条断言）：五页合法性与 `<html lang/data-lang>` 预置、每页 canonical/og:url/JSON-LD url 指向自身、五页 hreflang 组完全一致、子页资源引用全部 `../` 且无裸引用、body 与根页一致（data-i18n 计数 + 关键 id）、title 本地化（en/ja/zh-Hant）、inLanguage 子页单语言 vs 根页四语、og:locale 去重、引导脚本路径检测五页一致、sitemap 5 条 loc + 25 个 xhtml:link、**磁盘文件与 `build_lang_pages.js` 输出逐一比对（漂移检测：改 index.html 忘记重跑会直接 fail）**。汇总行改 `[1]~[8]`；实测往 en 页手动加一行注释即被抓住，重跑构建后恢复全绿。
- **浏览器实测**（puppeteer + 本地 http 服务器，模拟 GitHub Pages 目录 URL）：`/en/`、`/ja/`、`/zh-hant/`、`/zh/` 均**不弹首访弹窗**、`data-lang` 与 title/界面文案/页脚全部为对应语言、CSS 生效且资源零 404、hreflang 五链接就位；`/en/` 之后访问根目录保持英文且不弹窗（记忆跨 URL 生效）；清空记忆后访问根目录**首访弹窗行为与改动前完全一致**（四行标题/四段提示/四按钮）。
- **文档同步**：本文件；AGENT_HANDOFF（规则 15 改写、架构清单、2.2 目录树、2.4 SEO 行、2.7 增加“改 index.html 必须重跑构建”、交付段改为无需站长平台、2.8 移除“分语言收录未实施”条）；BUILD_GUIDE 第 10 节改写（10.4 手工收尾按用户要求去掉站长平台步骤，10.5 改为“已实施”并说明机制与口径）；tests/README 补 [8]；四份 README 各加一句语言专属链接说明。

### 第十轮（两款新字体：英文界面 en2、洛克文双字形切换 + 首访字形弹窗 + 页脚侵权联系）

`fonts/` 加入 `en2.ttf`（内部名 HYYouYuan）与 `Rocofontblack-Regular.ttf`（内部名 Roco font-black Regular）后，做了四件事：

- **英文界面改用 en2**：`html[data-lang="en"]{--font-cn:var(--font-en)}`，栈为 `"En2" → PingFang SC / 微软雅黑… → 敦敦体`；en2 同时覆盖基本拉丁与常用汉字（实测 7684 个码位），所以英文界面里出现的中文（页脚 slogan、语言按钮的中文自称）也照常显示。同屏多语言元素里 `[data-lang="en"]` 的那一段同步改用 `--font-en`；JS 侧 `uiFontStack()` 加 `FONT_EN` 分支，与 CSS 保持一致（canvas 导出与内联样式都靠它）。
- **洛克文字形两套、可全局切换**：CSS 只暴露两个变量 `--font-rune`（纯字形栈，字符级 `.rune-ch` 用）与 `--font-rune-mix`（字形优先 + 界面字体兜底；品牌图标、转换舞台、题目、历史表用），`html[data-glyph-font="roco-black"]` 把两个变量一起换成 RocoBlack。原先 5 处硬编码 `"Rune"` 全部改为引用变量，**改一个属性，全站字形一起变**。顶部新增「切换字形」按钮（`.masthead-tools` 内、板块切换左侧，沿用页脚语言按钮的胶囊语汇），点击即在两套字形间往返并写入 `localStorage`（键 `runelearn.glyphFont`）；按钮 `title` 带当前字形名（`glyphFont.toggleTitle`，含 `{name}` 参数，由 JS 拼、不走静态文案机制）。品牌标题点击切字形也改用 `var(--font-rune)`，跟随全局选择。
- **首访字形弹窗（第二个弹窗）**：选定语言之后立刻出现，**只显示刚选的那一种语言**（一个标题 + 两枚按钮 + 一行提示）。两枚按钮文本都是 `ROCO`，各用一款字形渲染——CSS 里刻意写死 `"Rune"` / `"RocoBlack"` 而不是引用变量，否则它们会跟着当前选择一起变，就失去了“对比两款字形”的意义。选完即切换字形并写入记忆，此后不再弹出，之后可用顶部按钮随时改。实现上两个弹窗共用一套模糊门禁（`html[data-lang-gate]` / `html[data-font-gate]`，CSS 合并成一个选择器组），`chooseLangAtGate()` 在同一个任务内先关语言窗再挂字形窗的门禁属性，**中间不会闪出清晰的一帧**；首访弹窗的判据（有没有语言记忆）一行未改，只在末尾补 `if (!langGateEl) openFontGateIfNeeded();`，让“已有语言记忆但没选过字形”的老用户在启动时补弹字形窗。
- **页脚追加「如有侵犯权利，敬请联系删除」**：位于免责说明与「查看源代码」之间（`.footer-contact`，键 `footer.contact`，四语：如有侵犯权利，敬请联系删除 / 如有侵犯權利，敬請聯繫刪除 / "If any rights are infringed, please contact us for removal" / 「権利を侵害している場合はご連絡ください。削除いたします」），与左右同字号同色（12.5px `#b0a688`），该行补 `flex-wrap:wrap` 便于窄屏换行。
- **导出 PNG 跟随当前字形**：`loadExportFace()` 按 `currentGlyphFont` 选字体文件（Rune-Regular.ttf / Rocofontblack-Regular.ttf），注册的 FontFace 名按字形区分（`RuneCanvas` / `RocoBlackCanvas`，避免同名覆盖导致导出用错字体）；`exportPNG` 的兜底栈改用 `glyphFontMix()`。
- **测试**：`tests/i18n_test.js` 由 8 段扩到 9 段、断言 118 → 135 条。新增 **[9] 洛克文字形切换**（12 条：默认 Rune 且不替用户写记忆、顶部按钮往返切换并记忆、首访选完语言后接力弹字形窗、弹窗结构为“单标题 + 两按钮 + 一提示”、两枚按钮文本都是 ROCO 且 `data-glyph-font` 分别为 rune/roco-black、弹窗文案用刚选的语言（英文/日文）、选择后切换 + 记忆 + 解除模糊、老用户只补弹字形窗、都已记忆时都不弹、非法记忆值回退 rune）；[6] 段补 6 条（两款新字体声明、字形变量与切换规则、弹窗按钮字体、页脚侵权联系样式、顶部按钮与页脚节点）。另修订 3 条既有断言以匹配新实现：英文 `Rune` 残留检查放行 `glyphFont.name.rune`（它是**字体名**，不是“洛克文”的英文表述）、`html[data-lang="en"]` 改指向 `--font-en`、模糊规则改为双选择器组。三套测试全绿。
- **浏览器实测**（puppeteer + 本地 http 服务器，26 条全过）：三款本地字体均能加载，且同一串 "ROCO" 在两款字形下实测宽度不同（228.74 vs 156.25 px，证明确实不是同一款字体）；首访选 English 后字形弹窗立即出现、标题与提示为英文、两枚按钮的 `ROCO` 渲染宽度不同（118.7 vs 83.54）；选 ROCO Black 后 `data-glyph-font` 切换、记忆写入、模糊解除，品牌图标 / 题目 / 转换舞台 / 历史表四处字形一起变；顶部按钮往返切换且 title 同步；英文界面字体栈以 En2 开头；页脚三段顺序、字号、颜色正确；两种字形下导出 PNG 均成功；`/ja/` 沿用已记忆字形且不再弹任何首访窗；全程无 404 与脚本报错。
- **踩坑**：`document.fonts.check()` 只反映“是否已加载”，RocoBlack 在首访弹窗出现前从未被使用，直接 check 会得到 false——验证脚本要先 `document.fonts.load()`；弹窗两枚按钮是 flex item、宽度被拉平，比较按钮宽度看不出字体差异，要量**文本本身**的渲染宽度（`Range.getBoundingClientRect`）。
- **文档同步**：本文件（字体与语言段 + 第十轮）；AGENT_HANDOFF（架构清单、新增规则 16、2.1、2.2 目录树 fonts、2.4 新增两行、2.6 三条回退项、回归清单）；BUILD_GUIDE（1.2 字体清单扩到 5 个、第 3/4 步、第 8 步清单）；tests/README（[6]/[9] 覆盖范围）；四份 README（字体说明与“切换字形”功能）。

### 第十一轮（审阅意见：弹窗动态尺寸、文案修正、输入框对齐、切换字形不换题、手机端页脚）

- **① 字形弹窗尺寸改为随内容变化**：原先 `.font-gate-card` 写死 `max-width:400px`，英文标题/提示会被压成两行。改为 `width:max-content` + `max-width:min(92vw,560px)`，并给标题与提示加 `white-space:nowrap`——卡片自己按需变宽，四种语言的文本都是单行（实测卡片宽度 379 / 379 / 416 / 379 px，随语言不同）。窄屏（≤560px）才降级：标题缩到 17px、提示允许换行。
- **② 文案修正（7 处，四语同步）**：
  - 英文历史表头 `history.col.glyph`：`Roco glyph` → **`Roco Script`**（表头是整列标题，用完整说法；`letter.desc` 里的 Roco glyph 不变）；
  - 英文页脚 slogan：`Calosia` → **`Carosia`**；
  - 四个语言的**电脑端** placeholder 统一改为“还可通过 Enter 提交”的同义文案（`还可通过Enter提交` / `還可透過 Enter 提交` / `Can also submit by Enter` / `Enterも使えますよ`；手机端短版不变），HTML 里的默认 placeholder 同步（它兼作无脚本兜底，测试 [1.4] 会把关）；
  - 英文顶部两个板块按钮改用简称：**`Converter` / `Practice`**（板块标题 `convert.title` 仍是完整的 Roco Converter）；
  - 日文页脚「查看源代码」：`ソースコードを見る` → **`ソースコードはこちら`**；
  - 日文页脚侵权联系：句点改逗号（**`ご連絡ください、削除いたします`**）；
  - 英文首访字形弹窗标题：`Choose your preferred glyph style` → **`Choose your preferred style`**。
- **③ 转换输入框的文字上下对齐**：按钮的文字本来就垂直居中（上下 padding 相等），而输入框的 padding 固定 5px，单行时文字明显偏上、与按钮文字错开约 2px。现在 `syncConvertRowHeight()` 除设 `min-height` 外，还按 `(按钮高 − 行高 − 上下边框)/2` 算出**对称的上下 padding** 写入（中文界面 5.75px / 39px 高，日文界面 8.75px / 45px 高）。padding 只依赖按钮高度、不随内容变化，不会与 `autoGrowTextarea()` 互相放大。实测两种界面下文字中心差都是 **0px**。
- **④ 切换字形不再重新抽题（修 bug）**：两个原因叠加——`computeGlyphFontSize()` 里测量用的字体**写死着 `"Rune"`**（切到 RocoBlack 后字号算错），且切换后调用的是 `renderWord()`，而它会**重新抽题**。改为：测量字体用 `glyphFontFamily()`；新增 `refitWordGlyph()`（只按当前字形重算字号、绝不换题），`setGlyphFont()` 与启动时的字体加载回调都改用它。实测认单词与认字母的题目在切换字形前后都不变。
- **⑤ 手机端页脚五行排版**：窄屏（≤560px，按视口宽度判定、**不依赖 UA**）下 `.footer-line` 与 `.footer-disclaimer-row` 都改成纵向排列，slogan / Co-created / 免责说明 / 侵权联系 / 源代码 五个字段各自一行居中（实测 375px 宽下纵坐标 1126 < 1150 < 1177 < 1203 < 1249）。
- **⑥ 转换板块占位文字在切换字形后垂直移位（修 bug）**：占位「输入文字后此处显示」是 inline 元素，会跟着**舞台字体**的基线走，而舞台字体随「切换字形」变化（Rune 与 RocoBlack 的字体度量不同）——实测一切字形基线差 5px，占位就上下跳 5px。修复：空态时给舞台挂 `.stage-empty`，CSS 用 `display:flex;align-items:center;justify-content:center` 让占位**垂直居中**（位置只由容器决定，与当前字形无关）。实测三种语言下切换字形的前后位移都是 **0px**，且占位现在正好落在展示框正中（此前因基线对齐偏下约 15px）。**顺带修掉一处连带问题**：输入文字时写入舞台的内联 `fontSize/lineHeight` 在清空后没清除，导致「输入过再清空」的舞台比初次打开时更高、占位位置也不一致——现在空态会清掉这两个内联值，外展示框始终 120px，输入/清空/多行的表现都与初次打开一致。
- **顺带加固**：分语言 URL 的路径检测改为**先转小写再匹配**，手输 `/zh-Hant/`（大写）也能落到繁體中文（目录名本身仍是小写 `zh-hant`）。
- **测试**：`i18n_test.js` 新增 **[1.4]** 段（英文 slogan 为 Carosia、日文底部两句、四语电脑端 placeholder 文案、HTML 默认 placeholder 与简体资源一致）与 [6] 段 3 条 CSS 断言（弹窗卡片 max-content + 标题/提示 nowrap、窄屏页脚纵向、窄屏弹窗降级）；修订 [1.3]（英文 tab 简称 / 历史表头 Roco Script）、[8]（路径检测改为小写匹配）、[9]（弹窗标题新文案）。`ui_behavior_test.js` 新增 **[7]** 段（输入框与按钮等高、上下 padding 对称、**点切换字形不重新抽题**、写入 `data-glyph-font`；用 `prepare` 钩子在 app.js 执行前造出 `offsetHeight/clientHeight` 等真实浏览器的测量值）。三套测试全绿。
- **浏览器实测**（puppeteer，22 条全过；⑥ 修复后另跑 11 条）：四语言字形弹窗标题与提示都是单行；英文 tab 为 Converter/Practice、板块标题仍为 Roco Converter、底部 Carosia、历史表头 `Roco Script`；四语电脑端 placeholder 文案与宽度（181 / 197 / 247 / 153 px，均 ≤ 可用宽 308px）；中文与日文界面下输入框文字与按钮文字中心差均为 0px 且等高（39/39、45/45）；切换字形后认单词与认字母题目均不变；375px 视口页脚五行；日文底部两句。全程无 404 与脚本报错。
- **踩坑**：验证输入框对齐时，文字中心要算上**上边框**（漏掉会得出 1px 的假偏差）；语言专属页的目录名是小写 `zh-hant`，验证脚本直接拿语言键拼 URL 会拼成 `/zh-Hant/` 而落到记忆语言上——产品侧已顺便做了小写容错；首轮测量弹窗宽度时字体还没加载完（333px），加载后是 379px，测量前要等 `document.fonts.ready`；**inline 元素会跟随父元素字体的基线**，父字体一换（这里是切换字形）它就上下移——让提示文字与字体解耦要靠 flex 居中；用内联样式设过 `font-size/line-height` 后，回到空态要清掉，否则「用过再清空」与初次打开不一致。
- **文档同步**：本文件（第十一轮）；AGENT_HANDOFF（交接 Prompt 文案口径、2.4 表、2.6 回退项、回归清单）；tests/README（[1.4]/[7] 覆盖范围）。四份 README 本轮无需改动（未涉及面向用户的功能描述变化）。


## 文档

- [构建指南（从零复现，含数据如何生成）](docs/BUILD_GUIDE.md) — 面向初学者的逐步说明：用什么字体、什么数据、数据如何用脚本创建与校验。
- [Agent 交接与工程说明](docs/AGENT_HANDOFF.md) — 让其他 agent/协作者接手继续编辑本工程的交接 prompt 与架构说明。
- [对抗测试报告](docs/ADVERSARIAL_TEST_REPORT.md) — 本轮对抗性测试（安全/健壮性/逻辑/观感）的范围、方法、发现的问题与修复。

## 文件结构

```
runelearn/
├── index.html              # 主页面（根目录 / x-default；<head> SEO 块由 build_lang_pages.js 生成，勿手改）
├── favicon.png             # 网站图标（rune 字形 R）
├── robots.txt              # 搜索引擎抓取配置（Allow all + Sitemap 指向，GitHub Pages 原样伺服）
├── sitemap.xml             # 站点地图（根 + 四语言共 5 条 URL，各带 xhtml:link 交替注解）
├── zh/index.html           # 简体中文专属页（build_lang_pages.js 生成；打开即简体、不弹首访弹窗）
├── zh-hant/index.html      # 繁體中文专属页（同上）
├── en/index.html           # English 专属页（同上）
├── ja/index.html           # 日本語专属页（同上）
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
│   ├── Rune-Regular.ttf    # 洛克文字形一（默认；符文风格）
│   ├── Rocofontblack-Regular.ttf  # 洛克文字形二（游戏内黑体风格，顶部「切换字形」可切换）
│   ├── SSDunDun-CN.ttf     # 简体中文界面字体（日文用系统中日文黑体，见 --font-ja）
│   └── en2.ttf             # 英文界面字体（内部名 HYYouYuan，同时覆盖拉丁与常用汉字）
├── tests/                  # 离线 Node 测试脚本（见 tests/README.md）
│   ├── smoke_test.js       # 核心逻辑冒烟 / 对抗测试
│   ├── ui_behavior_test.js # 机型 placeholder 与滚动行为
│   └── i18n_test.js        # 多语言、首访弹窗、释义显隐
├── build_wordbank.py       # （可选）词库生成脚本
├── build_lang_pages.js     # 分语言静态页生成脚本（改 index.html 或 SEO 文案后必须重跑）
└── verify_wordbank.py      # （可选）词库规则复验脚本
```

> 根目录 README 是**四份语言版本**（简体/繁體/English/日本語），任何一处改动都要四份同步更新（细则见 AGENT_HANDOFF 约定 14）。
