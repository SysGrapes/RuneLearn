# RuneLearn · Agent 交接与工程说明

> 用途：当你需要让**另一个 AI agent / 协作者**继续编辑或扩展这个项目时，直接把本文档（尤其是第 1 节的“交接 prompt”）复制给 ta，再附上本仓库路径即可。第 2 节以后是给接手者的工程背景，务必先读。

---

## 1. 交接 Prompt（可直接复制）

把下面整段复制给接手 agent：

```
你正在接手并继续维护一个纯前端、零依赖、可双击打开的静态网站项目「RuneLearn」，
位于目录 <替换为实际路径，例：C:\Users\Grape\Documents\DSH\runelearn>。请先阅读该目录下的
README.md 与 docs/ 下的 BUILD_GUIDE.md、AGENT_HANDOFF.md，再动手。

【项目一句话】用本地「Rune」字体（人造符文，V 与 W 显示一致）帮助用户识记英文字母与单词，
支持英文→符文转换、导出透明 PNG；界面提供 简体中文 / 繁體中文 / English / 日本語 四种语言（首次访问弹出自绘语言选择框，
页脚可随时切换，中文释义仅简体界面显示、其余三种语言隐藏；页脚另有“本网站与官方无关”说明与指向 GitHub 仓库的“查看源代码”链接）。

【架构（务必先读这三份再改）】
- index.html：两大板块（洛克文转换 / 洛克文识记 顶部切换）；识记内又有两个子板块（认字母 / 认单词）；静态文案用 `data-i18n` / `data-i18n-title` 标注（HTML 里的中文即默认值兼无脚本兜底），`<head>` 里有一段“首访语言门”引导脚本。
- css/style.css：样式与 @font-face（Rune-Regular.ttf 为符文英文；SSDunDun-CN.ttf 为中文/英文，风格同 roco）；语言字体栈 `--font-latin` / `--font-ja` 与 `html[data-lang]` 覆盖；首访模糊与自绘弹窗样式。
- js/i18n.js：**界面文案资源**（简体 / 繁體 / 英 / 日 四份 dict + 语言表 + 首访弹窗四语提示 + `readStoredLang()`）；挂在 `window.RUNE_I18N`，必须在 app.js 之前、也在 `<head>` 引导脚本之前加载。
- js/wordbank.js：单词库，硬编码为全局变量 window.RUNE_WORDBANK。
- js/app.js：全部交互逻辑；在 i18n.js / wordbank.js 之后加载。第 0 / 0.1 节是多语言与首访弹窗。
- build_wordbank.py + verify_wordbank.py：词库的生成与校验脚本（数据源 ECDICT 的 ecdict.csv）。
- tests/smoke_test.js + tests/ui_behavior_test.js + tests/i18n_test.js：离线 Node DOM 桩测试（零依赖，`node tests\smoke_test.js` 等，三个都要跑），覆盖核心逻辑/对抗场景、机型 placeholder、切题滚动、多语言与首访弹窗；说明见 tests/README.md。
- favicon.png：网站图标（rune 字形 R，色 #2e2a26），由 index.html `<head>` 引用。

【关键规则（不可打破）】
1. 主语言用中文；不使用 emoji；避免花哨渐变；面向用户文案中“Rune 字体/字形”一律称“洛克文”（品牌名 RuneLearn 除外）；**英文界面统一称「Roco Script」**（正式场合用全称 Roco Script，复合词/短标签用简称 Roco，如 Roco Converter / Roco Practice / Roco glyph），英文里 Rune 一词只允许出现在品牌名 RuneLearn 中。
2. V/W 在 Rune 字体中字形相同：<认字母> 出现 V/W 时同时接受二者为正确、答案显示“V 或 W”；<认单词> 不特殊处理。
3. 认字母历史字段：序号、洛克文字形、正确答案（一般字形）、正误、时间（无“难度”）；认单词历史多一个“难度”，且“正确答案”悬停(title)显示该词释义。
4. 难度规则：简单≤4且不含v/w；中等5–8；困难≥9；专家≥12且尽可能含v/w。每难度词库≥300。
5. 困难难度连续答对5次解锁“专家”（解锁前隐藏）；连击进度**只内部计数不显示**，解锁才提示“已解锁专家难度”。解锁与历史都存 localStorage。
6. 作答交互：点“确定”或回车提交并判定；提交后按钮文本变“继续”、回车也=切下一题；**认字母在 2.5 秒后自动进入下一题，认单词不自动切题（须手动点“继续”）**；已判定后再点/回车只切题，绝不重复判定同一题；进入下一题后复原“确定”+回车判定。输入框提示(placeholder)在聚焦(出现光标)时立即消失，失焦且为空时恢复。
7. 展示洛克文字形的题目区域（.quiz-glyph、.stage-canvas）必须 `user-select: none`（不可复制），防作弊。
8. 词库必须用 <script> 引入的 JS 全局变量（不能用 fetch 本地 JSON，否则 file:// 下跨域）。
9. 板块/子板块切换要有简洁动画。
10. 转换板块控件顺序固定为：字形颜色 → 描边颜色 → 描边粗细 → 字号大小 → 字形(正常/洛克文) → 导出；描边采用 8 方向的“向外描边”（DOM 与导出一致）；判定处音标用通用无衬线字体（不用 CJK 美术字包 IPA 符号）并以双斜杠括起（`/kæt/`）。转换输入框为 textarea 支持换行（渲染 `pre-wrap`、导出按 `\n` 分行），其文字与 placeholder 用敦敦体（`--font-cn`）且随行数自动增高（`autoGrowTextarea`，手机端无需内部滚动），默认单行高且**与右侧「清空」按钮等高**（`rows="1"`、`padding:5px 15px`、`min-height:39px`；按钮实测约 39px，由 `syncConvertRowHeight()` 运行时测量 `#convert-clear` 的 `offsetHeight` 后写入 `min-height`，字体/机型变化时在 `resize` 与 `document.fonts.ready` 重新对齐）；洛克文模式采用字符级字体（英文 `rune-ch`、数字/汉字 `cn-ch`）。
11. 细节交互：历史记录表格的表头与所有值（含洛克文字形）统一 15.5px；每次提交后最新历史行加 `flash-ok`/`flash-no` 类做 1.5s 指示灯动画；认单词题目用 `computeGlyphFontSize` 先测后渲染（单行完整、≤默认字号）；标题“RuneLearn”点击可在 rune/原文字形间切换（**两种字形颜色统一为敦敦体 `#2e2a26`**，切换只改字形不改色，不可选中复制）；认字母/认单词输入框高度一致（52px）、**字号统一为 22px**（两框的正文与 placeholder 同字号，与认字母一致）且 placeholder 字距一致（正文对齐差异保留）；placeholder 字号与输入框一致（不再缩小），仅保留防溢出截断；placeholder 文案按机型切换（`isMobileOrTablet`：手机/平板“输入字母”“输入单词”，电脑“输入字母，回车或点确定”“输入单词，回车或点确定”）；提交后点「继续」或「换一个」推进时，除锁定输入框外还把题目展示框滚到屏幕顶端（`scrollStageToTop`，初始化不滚动、提交判定本身不滚动）；**该自动滚动只在手机/平板上启用，电脑端完全禁用**（`autoScrollEnabled()` = `isMobileOrTablet()`：电脑屏幕足够大且不弹输入法，滚动只会打断用户浏览位置）；**用户直接点击/聚焦识记输入框时同样把题目框滚到顶端**（`bindStageScrollOnInput`：`click` 与 `focus` 都触发——识记板块初始是隐藏的（`.panel{display:none}`），初始化时的 `focus()` 对隐藏元素无效，所以输入框通常并未持有焦点，首次点击会 `focus`→`click` 各触发一次，用 `nowMs()` 时间戳在 400ms 内去重、只滚一次；而用户已聚焦后再次点击（例如重新定位光标）不会再派发 `focus`，此时只有 `click` 能触发滚动。初始化与切题的程序化聚焦用 `letterFocusLock`/`wordFocusLock` 排除，确保初始化与提交判定仍不滚动）；**手机/平板在输入法弹出后会按 `MOBILE_RESCROLL_DELAYS`=[400,700,1000]ms 平滑补滚**（输入法弹出是异步的，系统会按“保持输入框可见”改写滚动位置，覆盖首次滚动，表现为点「继续」不滚或点输入框滚不到顶端；补滚仅在未到位时执行，并在 `visualViewport` resize 时再校正一次，用户滚轮/拖动则 `cancelStageScroll()` 放弃补滚）；页脚文案固定为“卡洛西亚的凌晨四点”。根目录有 `favicon.png`（rune 字形 R，色 `#2e2a26`），`index.html` `<head>` 已引用。
12. 全站敦敦体 font-weight 已由 700/600 砍半至 400/300（含标题），不要改回加粗。
13. **多语言（简体中文 / 繁體中文 / English / 日本語，顺序即此）**：
    - 所有界面文案集中在 `js/i18n.js`，app.js 里**不允许再出现文案字面量**；新增/改文案必须四份语言一起加（缺 key 会回退简体，但那是兜底不是常态）。
    - **簡繁是两套文案，不是字符替换**：繁体按台湾用词习惯单独写（單字/匯出/字型/自訂/歷史紀錄/介面/產生/換一題/點確定…）；测试里有“简体专用字黑名单”把关，不要把简体丢给繁体。
    - 简体与英文界面用敦敦体；**繁體中文用系统繁体黑体 `--font-hant`**（Noto Sans TC 优先，回退到微軟正黑體 / 黑體-繁 / 蘋方-繁）；**日文用 `--font-ja`**（Noto Sans JP 优先）。都通过 `html[data-lang="…"]{--font-cn:var(--font-…) }` 一刀切换。敦敦体只覆盖 GB2312（实测繁体文案 38% 的字它没有），**只能放栈尾兜底**；也不要为任何语言引入外部 CDN 字体（Google Fonts 等），必须保持离线可用。
    - 语言切换入口在**页脚最下方**（`#lang-switch`，按钮由语言表生成、语言自称不翻译、顺序同 langs），切换即时生效并写入 `localStorage`（`runelearn.lang`）；输入框 placeholder、判定标签、历史表头、难度、按钮“确定/继续”等动态文案都要跟着换（统一走 `refreshDynamicCopy()`）。
    - **首访语言弹窗**：无语言记忆时，`<head>` 引导脚本先挂 `data-lang-gate="pending"` 让内容模糊并锁滚动，再由 app.js 构建**自绘**对话框（禁用原生 select/alert）；选定后关闭弹窗、解除模糊、记住语言，后续访问不再出现。入场动效用“同步重排 + 加 `.open` 类”触发，**不要改成 requestAnimationFrame**，否则后台标签页会卡在透明态。弹窗要同屏展示四种语言：标题四行、提示**分四段**（`<span class="lang-gate-seg">` 各自带 `data-lang`）、四个自称按钮——这些元素都由 CSS 按 `data-lang` 选字体，**不要**把提示拼成一整段文本（会逐字回退、混排）。
    - **中文释义只在简体界面显示**：`showsWordSenses()`（`currentLang === 'zh'`）为真时 `renderWordVerdict()` 才拼 `.word-senses`、历史才写 `title`；繁體中文 / English / 日本語 一律隐藏（词库只有简体释义文本，繁体界面要保持全繁体观感）；CSS 兜底为 `html:not([data-lang="zh"]) .word-senses{display:none}`（**不要**再引入 `data-lang-zh` 之类的中间标记）。词库与历史数据（含 `senseText`）都不改写，只在渲染时判断。历史里的难度存简体标签 + `diffKey`，V/W 的“V 或 W”按 `isVW(r.glyph)` 本地化。
    - **日语的「洛克文」=「ロコ文」**：Roco 的日文名为 ロコ，日语资源里不要出现 ロック文字/ロック文；`tests/i18n_test.js` 的 [1.2] 段会把关（日语值中不得含「ロック」）。
    - **英文的「洛克文」=「Roco Script」**：英文资源与 README.en.md 里不要出现 Rune Script / Rune Converter / Rune glyph 等表述，统一写 Roco Script（复合词与短标签用简称 Roco）；Rune 一词只允许出现在品牌名 RuneLearn 中；`tests/i18n_test.js` 的 [1.3] 段会把关（除掉 RuneLearn 后不得含 Rune）。
14. **双文档并行维护 + README 四语言版本**：根目录 `README.md` 面向用户/产品经理，用平实语言介绍功能，**不**涉及技术实现、架构、数据、迭代记录；`docs/REAL_README.md` 是技术向总览，可事无巨细地写实现细节、数据说明、迭代记录等。**任何改动 README 的场景必须两篇一并更新**，保持二者风格鲜明区别——README 说“是什么/怎么用”，REAL_README 说“怎么做到的/改过什么”。另外根目录 README 有**四份语言版本**：`README.md`（简体）/ `README.zh-Hant.md`（繁體，按台湾用词）/ `README.en.md`（English，用「Roco Script」）/ `README.ja.md`（日本語，用「ロコ文」），四份顶部互相链接；**改任意一份都必须四份同步更新**（功能、口径、免责说明等以简体版为准翻译，繁体注意用词习惯、日语注意术语、英文注意 Roco Script）。

【强约束】
- 任何改动都要保证面对非法输入不崩溃：空输入、非字母、超长、emoji 注入、localStorage 损坏/满、
  词库脚本缺失或某难度缺失、语言资源缺失、非法语言值。所有用户输入经转义，防 XSS。
- 改 js/app.js 或 js/i18n.js 后用 `node --check js/app.js`（i18n.js 同理）校验语法；改词库后运行
  `python verify_wordbank.py` 复核；再跑三个离线测试：`node tests\smoke_test.js`、
  `node tests\ui_behavior_test.js`、`node tests\i18n_test.js`，全绿才算过（新增 DOM id 要同步补测试桩）。
- 最后双击 index.html 在浏览器里回归一遍：两大板块、认字母(含V/W)、认单词各难度、困难连对5次解锁专家、
  转换+导出透明PNG、历史持久化/清空；多语言再加：首访弹窗（清掉 localStorage 的 runelearn.lang 后刷新，
  检查四段提示各用对应字体、整体字号）、页脚切换四种语言即时生效、**中文释义仅简体显示**（繁/英/日都隐藏，
  切回简体恢复）、页脚免责声明随语言切换、**“查看源代码”链接四语切换且下划线动效每打开页面只播一次**、**切换语言后转换行输入框与「清空」按钮仍等高**（繁体/日文下最容易看出）。
- 交付 = 打包整个 runelearn 文件夹；也可托管 GitHub Pages。不要引入外部 CDN（含在线字体）。

请先简要复述你的理解与将要改动的点，再实施。改动尽量小、可回退。
```

---

## 2. 工程背景（接手者必读）

### 2.1 这是什么
一个完全离线的单页网站，帮助用户把 Rune 字体的“符文”（人造字母）与英文字母/单词对应起来。含：
- 转换（英文 → 符文，可调颜色/描边，导出透明 PNG）
- 识记（认字母、认单词两子板块，带难度与历史）
- 四语界面（简体中文 / 繁體中文 / English / 日本語，顺序即此）：首访语言弹窗、页脚随时切换、**中文释义仅简体显示**；页脚另有“本网站与官方无关”说明与“查看源代码”链接（下划线每次打开页面停留 10 秒后 2 秒内淡出）

### 2.2 目录结构
```
runelearn/
├── index.html            # 页面骨架（两大板块 + 两子板块 + 专家解锁按钮 + 页脚语言切换/免责说明/源代码链接 + <head> 首访语言门引导脚本）
├── README.md             # 面向用户/客户的产品介绍（简体；四份语言版本之一）
├── README.zh-Hant.md     # 同上（繁體中文）
├── README.en.md          # 同上（English；「洛克文」= Roco Script）
├── README.ja.md          # 同上（日本語；「洛克文」= ロコ文）
├── docs/
│   ├── REAL_README.md    # 技术向总览与原迭代记录（事无巨细，随代码同步更新）
│   ├── BUILD_GUIDE.md    # 面向零基础的逐步构建/数据生成文档
│   ├── AGENT_HANDOFF.md  # 本文件
│   └── ADVERSARIAL_TEST_REPORT.md  # 对抗测试报告（安全/健壮性/逻辑/观感）
├── css/style.css         # 样式与 @font-face、语言字体栈、首访弹窗/蒙层
├── js/
│   ├── i18n.js           # 界面文案资源（简体 / 繁體 / English / 日本語）+ 语言表 + readStoredLang()
│   ├── app.js            # 全部逻辑（含第 0 / 0.1 节：多语言与首访弹窗）
│   └── wordbank.js       # 词库（window.RUNE_WORDBANK）
├── fonts/
│   ├── Rune-Regular.ttf  # 符文英文
│   └── SSDunDun-CN.ttf   # 中文/英文（SSDunDun，风格同 roco）
├── favicon.png           # 网站图标（rune 字形 R）
├── tests/                # 离线 Node 测试（见 tests/README.md）
│   ├── smoke_test.js     # 核心逻辑冒烟/对抗测试
│   ├── ui_behavior_test.js  # 机型 placeholder 与切题滚动
│   └── i18n_test.js      # 多语言 / 首访弹窗 / 释义显隐
├── build_wordbank.py     # 从 ECDICT CSV 生成词库
└── verify_wordbank.py    # 词库规则复验
```

### 2.3 数据说明
- **来源**：开源英汉词典 `ECDICT`（<https://github.com/skywind3000/ECDICT>）的 `ecdict.csv`。
- **生成**：`build_wordbank.py` 读取 CSV → 按难度/常用度筛选 → 解析多词性中文释义 → 去重 → 输出 `window.RUNE_WORDBANK = {...}` 的 `wordbank.js`。
- **生成参数**：easy/med/hard/expert 各 340 词；`random.seed(20240924)`。
- **常用度门槛**：Collins 星级≥3 或出现在主流考试大纲（zk/gk/cet4/cet6/ky/ielts/toefl/gre）。
- **校验**：`python verify_wordbank.py` 会复核数量、字母数/含v-w规则、跨难度重复、字段完整。
- 交付包内**不含** `ecdict.csv`（约 66MB，仅生成时用），但保留生成与校验脚本以说明出处、可再生成。

### 2.4 关键技术约定
| 主题 | 约定 |
| --- | --- |
| 语言/文案 | 四语（`zh` / `zh-Hant` / `en` / `ja`，顺序即此）；文案全在 `js/i18n.js`（`window.RUNE_I18N.dict`），键为点号分层扁平结构，缺失回退简体；带参数文案用 `{name}` 占位；**簡繁两套独立撰写，不做字符替换** |
| 风格 | 简洁、暖纸色、无 emoji、避免过度渐变、罗可风格 |
| 字体 | 简体/英文 `SSDunDun-CN`，符文 `Rune`；繁體 `--font-hant`（Noto Sans TC → 微軟正黑體 → 黑體-繁…）；日文 `--font-ja`（Noto Sans JP → ヒラギノ → Yu Gothic → Meiryo…）；后两者用系统字体、不打包文件，敦敦体只在各栈尾兜底（只覆盖 GB2312），用 `@font-face` 相对引用 `../fonts/` |
| 语言字体切换 | `html[data-lang]` 覆盖 `--font-cn`（`zh`/`en`→latin、`zh-Hant`→hant、`ja`→ja）；JS 侧等价的 `uiFontStack()` 用于 canvas 导出与内联样式（两处要保持一致）；语言自称按钮/弹窗行再按各自 `data-lang` 选栈 |
| 文案加载 | `<script src="js/i18n.js">` → 全局 `window.RUNE_I18N`；在 app.js 之前，且 `<head>` 引导脚本也依赖它 |
| 词库加载 | `<script src="js/wordbank.js">` → 全局 `window.RUNE_WORDBANK`；app.js 后加载 |
| 无跨域 | 不 fetch 本地文件；不引入外部 CDN / 在线字体 |
| localStorage 键 | `runelearn.letter.history`、`runelearn.word.history`、`runelearn.expertUnlocked`、`runelearn.hardStreak`、`runelearn.lang` |
| 首访语言门 | `<head>` 引导脚本在首绘前判定：有语言→写 `data-lang`；无→挂 `data-lang-gate="pending"`（CSS 模糊+锁滚动），弹窗由 app.js 的 `buildLangGate()` 自绘（四行标题 + 四个自称按钮 + 四语提示**分四段**）；标题行/提示段/按钮都带 `data-lang` 由 CSS 选字体；入场用同步重排+`.open` 类；选择后 `closeLangGate()` 解除并 320ms 后移除节点；另设 3s 兜底解除 |
| 弹窗字号 | 卡片 ≤400px；`.lang-gate-line` 四行统一 20px；`.lang-gate-btn` 17px；`.lang-gate-tip` 14px（移动端媒体查询另有 18/16/13px 一档）；整体偏大是刻意的（首访弹窗要醒目），改小前先想想 |
| 板块描述字号 | `.panel-desc`（转换/认字母/认单词三处板块描述）16px（原 15px，第六轮后调大；中文/英文都曾偏小） |
| 语言切换 | 页脚 `#lang-switch`（按钮由语言表生成、顺序同 langs）→ `setLang()` = `applyLanguage()` + 写 `localStorage`；`applyLanguage` 负责 `<html data-lang/lang>`、`document.title`、`data-i18n` 静态文案、按钮高亮与 `refreshDynamicCopy()`（转换占位、**转换行高重对齐**、placeholder、难度、判定、历史） |
| 释义显隐 | `showsWordSenses()`（`currentLang === 'zh'`，**仅简体**）为真时 `renderWordVerdict()` 才拼 `.word-senses`、历史才写 `title`；CSS 兜底 `html:not([data-lang="zh"]) .word-senses{display:none}`；词库与历史数据不改写 |
| 页脚免责声明 | 文案键 `footer.disclaimer`（四语齐备），节点 `.footer-disclaimer`（`.footer-line` 下方，12.5px 弱化色），随 `data-i18n` 静态文案机制切换 |
| 页脚源代码入口 | 文案键 `footer.source`（四语：查看源代码/查看原始碼/View source/ソースコードを見る），节点 `<a class="footer-source">`（与免责说明同在 `.footer-disclaimer-row` 一行、居右、12.5px 同色 `#b0a688`、`text-decoration:none`），`target="_blank" rel="noopener noreferrer"` 指向 <https://github.com/SysGrapes/RuneLearn>；**下划线动效**：`::after` 伪元素 + `@keyframes footer-source-underline` 12s linear（0–10s 可见、10–12s 淡出，`forwards` 定格透明），每次打开页面播放一次（切语言不重播，元素不重建） |
| 历史数据规范 | 难度 = 简体中文标签（兼容旧数据）+ `diffKey`；V/W 的“正确答案”固定存简体“V 或 W”，展示时按 `isVW(r.glyph)` 本地化 |
| 防 XSS | 用户输入一律 `normalizeInput` + `escapeHtml`，渲染用 `textContent`/转义 |
| 动画 | 切换类 `.active`，动画放 CSS（`.panelIn` keyframes）；弹窗用 `.lang-gate.open` + 卡片 opacity/transform 过渡 |
| 答题防复制 | `.quiz-glyph`、`.stage-canvas` 设 `user-select: none` |
| 作答状态机 | `letterState/wordState.done` + `letterReset/wordReset`（同时清 `verdict`）；提交后按钮变“继续”，认字母 2.5s 自动切题、认单词手动；切题时复原 |
| 判定结果 | `*.verdict = {ok}` + `renderLetterVerdict()/renderWordVerdict()`：文案在渲染时取，故切语言可整块重排 |
| 描边(向外) | DOM 用 `buildOutline()` 生成 8 方向 `text-shadow`；canvas 用 8 方向偏移 `fillText` 再中心盖回 |
| 转换字形切换 | `convertScript`（'rune'/'normal'）+ `.script-btn[data-script]`；`updateConvert` 依此设 `.stage-canvas` 的 font-family（normal 模式用 `uiFontStack()`） |
| 音标字体 | `.ph` 用 `--font-read`（PingFang/雅黑 等无衬线），不覆盖 IPA 特殊符号，并以双斜杠渲染 `/.../` |
| 历史闪烁 | `renderLetterHistory/renderWordHistory(flashFirst)`：最新行加 `flash-ok`/`flash-no`（CSS keyframes 1.5s） |
| 题目字号自适应 | `computeGlyphFontSize(text)` 用 canvas measureText，先算能一行显示的字号（≤74px），再 `wordGlyph.style.fontSize` 后设 textContent；字体加载完后 `renderWord()` 重渲染一次以精确测量 |
| 历史字号 | `.history-table`、`.history-table th,td` 与 `.history-table .rune` 统一 `font-size:15.5px`（表头与值一致） |
| 输入框 | `.text-input` 17px；`.letter-input` 居中/字距 2px；`.quiz-answer .text-input` 高度统一 52px、**字号统一 22px**（认字母与认单词一致）、placeholder 字距 0；placeholder 仅 `nowrap+ellipsis+overflow:hidden` 防溢出；**英/日 placeholder 额外收小到 18px**（`html[data-lang="en"|"ja"] .quiz-answer .text-input::placeholder`，长文案 22px 会超输入框 308px 可用宽） |
| 识记按钮 | `.quiz-answer .btn` 与输入框**严格等高 52px**（`height:52px` + `inline-flex` 居中）——此前按钮仅 ~41px，并排有明显高低差 |
| placeholder 机型 | `isMobileOrTablet()`（`matchMedia('(pointer: coarse)')`/`(hover: none)` 或 UA）→ `placeholderFor('letter'｜'word')`：手机/平板短版，电脑长版；文案取自语言资源，聚焦状态由 `convInputFocused/letterInputFocused/wordInputFocused` 记录，切语言只更新未聚焦的输入框（保住约定 #6） |
| 推进滚动 | `scrollStageToTop(glyphEl)`：取 `closest('.quiz-stage')` 后 `scrollIntoView({behavior:'smooth',block:'start'})`。**仅手机/平板启用**（`autoScrollEnabled()`=`isMobileOrTablet()`，电脑直接 return，完全禁用自动滚动）。触发点：「继续」/「换一个」/认字母自动切题（`renderLetter(true)`/`renderWord(true)`），以及用户直接点击/聚焦识记输入框（`bindStageScrollOnInput(input, glyph, isProgrammatic)`，同时监听 `click` 与 `focus`）。初始化与提交判定不触发。**关键顺序**：先 `input.focus({preventScroll:true})` 锁定光标（`preventScroll:true` 使聚焦不触发浏览器自动滚动），再平滑滚到 `.quiz-stage` 顶端——若先滚动、后聚焦，聚焦的自动滚动会覆盖平滑滚动。程序化聚焦期间置 `letterFocusLock`/`wordFocusLock`，`focus` 监听据此跳过。**`click` 为何必须单独监听**：识记板块初始 `display:none`，初始化时的 `focus()` 对隐藏元素无效（输入框并未持有焦点），首次点击是 `focus`→`click` 各一次（用 `nowMs()` 400ms 去重只滚一次）；用户已聚焦后再次点击不会再派发 `focus`，只能靠 `click`。**移动端补滚**：聚焦后输入法弹出是异步的，系统会按“保持输入框可见”再改写滚动位置并覆盖首次滚动，故在 `MOBILE_RESCROLL_DELAYS`=[400,700,1000]ms 于 `visualViewport` resize 时补滚（`stageReachedTop()` 误差 12px 内视为到位则跳过；一律用平滑滚动避免跳变；`cancelStageScroll()` 在新请求或用户滚轮/拖动时放弃补滚） |
| 转换 textarea | `.convert-textarea`：`--font-cn`、`resize:none`、`overflow:hidden`、`padding:5px 15px`（纵向收到 5px，使单行 17px×1.5≈25.5px 能装进按钮高度）、`min-height:39px`（兜底）、`rows="1"`；`autoGrowTextarea()` 按 `scrollHeight` 自动增高（单行下限取元素当前 `min-height`，`elMinHeight()`：内联 → 计算样式 → 39 兜底），并按 `box-sizing:border-box` 补上 `offsetHeight-clientHeight` 的上下边框，否则末行被裁约 2px；**元素不可见时（`offsetParent===null` 或 `scrollHeight===0`）直接 return，绝不改写高度**——否则会把手输多行后的高度压回单行，切回转换板块时后几行被 `overflow:hidden` 裁掉（`resize` 与 `document.fonts.ready` 都会触发本函数，务必保留这个守卫）；`syncConvertRowHeight()` 运行时测量 `#convert-clear` 的 `offsetHeight` 作为默认高度，保证输入框与右侧按钮等高。**按钮高度随语言字体栈变化**（`line-height:normal`：简体/英文 39px、繁体 43px、日文 45px），故 `refreshDynamicCopy()`（语言切换后）与 `switchMain('convert')`（从其它板块切回来）都要补调 `syncConvertRowHeight()`，否则会出现 4–6px 高低差 |
| 字形加粗 | 全站 `font-weight` 已砍半（700→400、600→300） |
| 页面宽度 | `.page` 默认 1040px；`@media(min-width:1360px)` 用 `min(calc(100vw - 300px), 1500px)`（左右各留≥150px） |
| 导出 PNG | Canvas + `new FontFace(按字形加载 RuneCanvas 或 SSDunDunCanvas)` 保证字体一致 → `toBlob` |

### 2.5 词条 JSON 结构（`wordbank.js` 内）
```js
window.RUNE_WORDBANK = {
  easy:  [ { "w":"cat", "ph":"kæt", "senses":[ {"pos":"n","def":"猫"}, ...] }, ... ],
  med:   [...],
  hard:  [...],
  expert:[...]
};
```

### 2.6 已知/曾修复的问题（避免回退）
- `js/wordbank.js` 曾一度被“未过滤的生僻词”污染（专家难度混入 abdominoplasty、accouchement 等），已用干净版本覆盖并加入 `is_common` 门槛与 `verify_wordbank.py`。**不要再把根目录或旧版本的 wordbank 覆盖回去。**
- 大板块是**两**个（不是三个）；识记内部是两个子板块。不要加第三个顶层板块。
- 认字母历史**不允许**出现“难度”列。
- **自动滚动只在手机/平板启用，不要在电脑端打开**：电脑屏幕大、不弹输入法，滚动只会打断用户浏览位置；`autoScrollEnabled()` 就是这条规则的唯一开关。
- **不要删掉移动端的补滚逻辑**（`MOBILE_RESCROLL_DELAYS` / `visualViewport` resize 校正）：iOS 聚焦输入框后输入法异步弹出，系统会按“保持输入框可见”改写滚动位置并覆盖页面自己的滚动。删掉后 iPhone/iPad 上会复现“点「继续」不滚”“点输入框题目框不到顶端”。
- **不要把 `input.focus()` 的 `preventScroll` 去掉、也不要调换成“先滚动后聚焦”**：聚焦引起的自动滚动会覆盖平滑滚动。
- **切换板块/子板块后旧滚动目标可能已隐藏**：`stageReachedTop()` 通过 `getBoundingClientRect()` 尺寸为 0 判定“不可用”并跳过补滚，改动时不要把这个守卫去掉（否则 `visualViewport` 变化会把隐藏板块的旧目标拉出来滚动）。
- **不要把 `autoGrowTextarea()` 里“元素不可见就不改写高度”的守卫去掉**：`resize` 与 `document.fonts.ready` 都会调用它，若在 `display:none`（已切到识记板块）时按 `scrollHeight===0` 重算，会把用户输入的多行高度压回单行，切回转换板块后后几行被 `overflow:hidden` 裁掉。
- **识记板块初始是隐藏的**（`#panel-convert` 才有 `active`）：初始化时对 `#letter-input`/`#word-input` 调用的 `focus()` 对隐藏元素无效，`renderWord()` 里按 `stage.clientWidth` 计算的一行字号也会因 `clientWidth===0` 而退化到兜底值。涉及“初始化是否已聚焦 / 已排版”的判断时不要想当然。
- **不要删掉 `html:not([data-lang="zh"]) .word-senses{display:none}`**：它是“仅简体显示中文释义”的样式兜底，防止语言切换瞬间闪出简体释义；同时 `renderWordVerdict()` 里的 `showsWordSenses()` 判断也不能省（那是主路径）。**繁体界面同样不显示释义**（词库只有简体释义文字），别再改回“繁体也显示”。
- **不要把首访弹窗的入场动效改成 `requestAnimationFrame`**：后台标签页 rAF 可能长时间不触发，弹窗会停在 `opacity:0` 的透明态（页面模糊却看不到对话框）。现在用“读一次 `offsetWidth` 触发同步重排 + 加 `.open` 类”。
- **不要去掉 `<head>` 里那段 3 秒兜底**：万一 app.js 加载失败，它会解除 `data-lang-gate`，避免页面永远糊着且无对话框。
- **不要在 `html[data-lang-gate]` 之外的地方再加模糊**：模糊、禁交互、锁滚动都由该属性驱动，清理时统一走 `releaseLangGateAttr()`。
- **不要把 `t()` 换成新写的文案字面量**：新增文案必须四份语言一起补；改完可用脚本扫一遍 `js/app.js` 是否还有中文串（应只剩注释）。
- **不要改写历史数据里的语言相关内容**：`diff`（简体标签）与“V 或 W”是规范值，展示时才本地化；`senseText` 照常保存，非简体语言只是不渲染。
- **不要把繁体文案当成“简体换字”**：新增文案要四份齐全，繁体要按台湾用词习惯写；`tests/i18n_test.js` 有简体专用字黑名单把关。
- **不要把敦敦体提到 `--font-hant` / `--font-ja` 前面**：它只覆盖 GB2312，繁体文案约 38% 的字没有，会一字两形。
- **不要把首访弹窗的提示行拼成一整段文本**：必须渲染成四个带 `data-lang` 的 `.lang-gate-seg`（段间「 · 」），否则四种语言在同一段里逐字回退，观感混排。
- **语言切换后要重新对齐转换行高度**：`refreshDynamicCopy()` 里的 `syncConvertRowHeight()` 不能删（`#convert-clear` 按钮高度随语言字体变化：繁体 +4px、日文 +6px），`switchMain('convert')` 的补对齐也别删（在其它板块切语言时转换面板不可见、测不到按钮高度）。
- **不要用「ロック文字」指代洛克文**：日语统一写「ロコ文」（Roco = ロコ），`tests/i18n_test.js` [1.2] 段会把关。
- **不要在英文里用「Rune / Rune Script」指代洛克文**：英文界面与 README.en.md 统一写「Roco Script」（复合词/短标签用简称 Roco，如 Roco Converter / Roco Practice / Roco glyph），Rune 一词只允许出现在品牌名 RuneLearn 中；`tests/i18n_test.js` [1.3] 段会把关。注意内部标识（`@font-face` 的 `"Rune"` 字体名、`fonts/Rune-Regular.ttf`、CSS 类 `rune-ch`/`.rune`、`data-script="rune"`、`RuneCanvas`）不是用户可见文案，**不要**跟着改。
- **改 README 必须四份语言版本一起改**（`README.md` / `README.zh-Hant.md` / `README.en.md` / `README.ja.md`）：繁体按台湾用词、日语用「ロコ文」、英文用「Roco Script」；REAL_README / BUILD_GUIDE / 本文件 / tests/README 中受影响的部分也要同步。

### 2.7 推荐的改动流程（最小可回退）
1. 读 README + docs + 相关源码。
2. 小步修改，一次只改一件事。
3. 校验：`node --check js/app.js`（含 `js/i18n.js`）；改词库跑 `python verify_wordbank.py`；
   跑全部离线测试：`node tests\smoke_test.js`、`node tests\ui_behavior_test.js`、`node tests\i18n_test.js`。
4. 浏览器双击 `index.html` 回归主流程（多语言部分：清掉 `runelearn.lang` 看首访弹窗、页脚切语言、非中文隐藏释义）。
5. 同步更新受影响文档：根目录 README **四份语言版本**（`README.md` / `README.zh-Hant.md` / `README.en.md` / `README.ja.md`）与 `docs/REAL_README.md`（技术向）**必须一并更新**，保持前者“是什么/怎么用”、后者“怎么做到的”的风格区别；BUILD_GUIDE / AGENT_HANDOFF / tests/README 中受影响部分也要同步。

### 2.8 常见扩展方向（仅供接手者参考，未实施）
- 认单词增加“读音播放”（需引入音频数据或 TTS，注意离线约束）。
- 历史记录支持导出/统计（正确率、难度曲线）。
- 认字母增加大小写对照或首字母猜词。
- 为词库增加更多难度档或自定义难度。
- 多语言后续：给 `wordbank.js` 增加英英/日文释义（现在非简体界面直接隐藏中文释义）；或增加第 5 种语言（在 `js/i18n.js` 的 `langs` 与 `dict` 各加一份、`gate.title/tip` 各加一项，再补 README 的对应语言版本，其余自动生效）。
