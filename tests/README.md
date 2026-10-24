# 测试（tests/）

本目录存放 RuneLearn 的**离线 Node 测试脚本**（零依赖，不需要浏览器）。

## 运行

在项目根目录（`runelearn/`）执行：

```bat
node tests\smoke_test.js
node tests\ui_behavior_test.js
node tests\i18n_test.js
```

三个脚本都用**最小的 DOM 桩**（`document/window/localStorage/FontFace/setTimeout/URL` 等）在 Node 中加载
`../js/i18n.js`、`../js/wordbank.js` 与 `../js/app.js`，然后通过派发事件、改写输入值、读取 `textContent/innerHTML/style`
来断言行为；以退出码 0 表示全部通过，非 0 表示有失败。

> 脚本用 `__dirname` 定位 `../js/...`，因此无论从哪里调用都能正确解析资源；
> 但建议在项目根目录运行，便于阅读输出。

## 覆盖范围

| 脚本 | 覆盖内容 |
| --- | --- |
| `smoke_test.js` | 核心逻辑冒烟与对抗：转换舞台 XSS（注入串以**文本**插入、`innerHTML` 从不被设置、字符按序精确还原）、认字母 V/W 判定、认单词难度/解锁、历史记录（含难度列、释义、清空）、非法输入不崩溃（空/符号/emoji/超长/`<script>`）、done 态狂点不重复写历史、localStorage 抛错与损坏值的容错、专家难度连对 5 次解锁。 |
| `ui_behavior_test.js` | 机型相关与滚动行为：**[2]** 电脑显示长 placeholder（“还可通过Enter提交”）、手机/平板显示短 placeholder（“输入字母”），认字母/认单词各自正确；**[3]** 自动滚动**按机型启用**——电脑端全程（初始化、提交、继续、换一个、点击/聚焦输入框、认单词全流程）完全不滚动；手机/平板端初始化与提交本身不滚动（保留判定可见），点“继续”或“换一个”推进时把题目展示框滚动到屏幕顶端（`smooth` + `start`）；**[4]** 手机/平板直接点击 / 用户聚焦识记输入框时同样把题目框滚到顶端（`smooth` + `start`），而初始化等**程序化聚焦**被排除、仍不滚动（以 `dispatchFocus` 让 `focus()` 真实派发事件，并用 `prepare` 在 `app.js` 执行前挂滚动探针，断言才有效力）；**[5]** 转换 textarea 在**不可见**（`offsetParent===null`，模拟已切到识记板块）时不得改写已增高的高度，可见时按内容增高并补上上下边框；**[6]** 同一次手势的 `focus`→`click` 只滚一次，无前置 `focus` 的独立点击仍会滚动；**[7]** 转换输入框与「清空」按钮**等高**（用 `prepare` 钩子在 app.js 执行前造出 `offsetHeight` / `clientHeight` 等真实浏览器的测量值）且**上下 padding 对称**（文字垂直对齐，不再偏上），点顶部「切换字形」**不重新抽题**（题目文字不变）并写入 `html[data-glyph-font]`；转换舞台**空态挂 `.stage-empty`**（占位垂直居中、不随字形基线移动），有输入时移除、清空后重新挂上。 |
| `i18n_test.js` | 多语言、首访弹窗、释义显隐与静态样式：**[1]** 四份语言资源 key 完全对齐、语言顺序与自称（简体中文/繁體中文/English/日本語）、`index.html` 里 `data-i18n` / `data-i18n-title` 标注的 key 四语齐全、HTML 静态默认文案与输入框 placeholder 默认值与 `dict.zh` 逐条一致、页脚免责声明（`footer.disclaimer`）四语齐全且 HTML 有对应节点、页脚源代码入口（`footer.source`）四语齐全且 HTML 有对应节点（指向 GitHub 仓库、新窗口打开）；**[1.1]** 繁体不是简体的字符替换——关键文案必须与简体不同（單字/匯出/字型紀錄/產生/換一題）、简体专用字黑名单（单词汇录历题难专语选择体记识学习确认导显转换时间门问个们页电…）不得出现在繁体文案里、繁体用「介面」而非「界面」；**[1.2]** 日语术语——「洛克文」写作「ロコ文」（doc.title / brand.sub / convert.title / history.col.glyph 等逐一核对）且日语资源中不得出现「ロック」、expert=エキスパート、解锁文案用「解禁」、`word.err.invalid` 用「のみ」；**[1.3]** 英文术语——「洛克文」写作「Roco Script」（doc.title / brand.sub / tab.convert / convert.scriptRune / history.col.glyph 等逐一核对，复合词与短标签用简称 Roco）且英文资源中除掉品牌名 RuneLearn 后不得出现 Rune；**[2]** 页脚四枚语言按钮（顺序 简/繁/英/日）、切换后 `<html data-lang/lang>` 即时更新（`data-lang-zh` 旧标记确已废弃、不再挂载）、全部静态文案、输入框提示、按钮“确定/继续”、难度文案、历史空态文案即时更新并写入 `localStorage`，高亮随切换移动；**[3]** 首访（`localStorage` 无语言）时页面进入 `data-lang-gate="pending"` 门禁态并构建自绘对话框（四行四语标题、四枚语言按钮、提示行**分四段**且每段带 `data-lang`、段间以「 · 」文本节点连接、带入场类），选定语言（含繁体）后关闭、解除模糊、记忆语言，二次访问不再弹窗且不残留模糊；**[4]** 认单词中文释义**仅简体界面显示**（判定区 `.word-senses` 与历史 `title`），切繁体/英文/日文一律隐藏、判定与正确答案仍在、切回简体恢复，且词库数据不改写；**[5]** 旧历史数据（难度存简体标签、V/W 记录）在简/繁/英/日界面分别本地化显示；**[6]** 非法语言值、`localStorage` 读写抛错、语言资源缺失，以及 CSS 静态检查：繁体/日文字体栈、`data-lang` 字体切换、同屏多语言元素（`.lang-gate-seg` / `.lang-gate-line` / `.lang-btn`）按 `data-lang` 选字体、弹窗字号已放大（标题 20px / 按钮 17px / 提示 14px）、首访模糊规则、释义兜底（`html:not([data-lang="zh"])`）、英/日 placeholder 18px、识记按钮 52px 等高、页脚免责声明样式、源代码链接与免责说明同字号同色且默认无下划线、源代码下划线动效关键帧（12s：前 10s 可见、后 2s 淡出）、三个板块描述文字 16px、`data-lang-zh` 已彻底移除、洛克文字形全部走 CSS 变量（5 处都不再硬编码 `"Rune"`）与 `data-glyph-font="roco-black"` 的切换规则、En2/RocoBlack 两款新字体的 `@font-face` 声明、英文界面字体栈指向 `--font-en`、首访模糊规则同时挂在 `data-lang-gate` 与 `data-font-gate`、字形弹窗两枚按钮各用一款字形（写死 `"Rune"` / `"RocoBlack"`）、页脚「侵权联系」与免责说明同字号同色且该行可换行、顶部「切换字形」按钮与页脚三段节点齐全；**[7]** SEO——`index.html` 的 `description` / `keywords` / `canonical`（指向规范 URL）、Open Graph（含 `og:locale` 与 zh_TW/en_US/ja_JP 三个 alternates）与 Twitter Card、JSON-LD 结构化数据（`WebApplication`、`inLanguage` 含四语），以及根目录 `robots.txt`（允许全站抓取 + Sitemap 指向）与 `sitemap.xml`（合法 urlset + 站点 URL）齐全且域名一致；**[8]** 分语言 URL——根目录 + `zh/`、`zh-hant/`、`en/`、`ja/` 五个静态页（`build_lang_pages.js` 生成）：每页 `<html lang/data-lang>` 按语言预置、`canonical` / `og:url` / JSON-LD `url` 指向自身、五页共享同一组 hreflang 互指（含 x-default 指根目录）、子页资源引用全部加 `../` 且无裸引用、body 与根页一致（`data-i18n` 计数 + 关键 id）、`<title>` 本地化（英文 Roco Script / 日文 ロコ文 / 繁体 洛克文學習）、JSON-LD `inLanguage` 子页单语言而根页四语、`og:locale` 每页自身且 alternates 去重、`<head>` 引导脚本含分语言路径检测（命中即预置并写入记忆、不弹首访弹窗）、sitemap 含 5 条 URL 与 25 个 `xhtml:link` 注解，且**磁盘上的五个页面与 `build_lang_pages.js` 的输出逐一比对一致**（改了 index.html 忘记重跑构建会被抓出）；**[9]** 洛克文字形两套字体——默认 Rune 且不替用户写记忆、点顶部「切换字形」按钮在 Rune/ROCO Black 之间往返并记忆、首访选完语言后接力弹出字形偏好窗（结构为“单标题 + 两枚按钮 + 一提示”，两枚按钮文本都是 `ROCO` 且 `data-glyph-font` 分别为 rune/roco-black，文案用刚选的语言），选择后切换 + 记忆 + 解除模糊，老用户（有语言记忆、无字形记忆）只补弹字形窗，都已记忆时两个窗都不弹，非法字形记忆值回退默认 rune；**[1.4]** 本轮文案修正——英文底部 slogan 为 Carosia、日文底部两句（「ソースコードはこちら」与逗号版侵权联系）、四语电脑端 placeholder 文案、以及 `index.html` 两处默认 placeholder 与简体资源一致；另在 [6] 段检查字形弹窗卡片 `max-content` + 标题/提示 `nowrap`、空态舞台 `.stage-empty` 的 flex 居中（占位不随字形基线移动）、窄屏页脚五行与弹窗降级。 |

## 说明

- 桩为了让 `app.js` 能加载，会按 `index.html` 的选择器按需构造元素；
  无法覆盖真实浏览器的排版/字体渲染，那部分需打开 `index.html` 目测。
- 若新增了 DOM id，请同步在桩的 `querySelector` 映射中补齐，否则相关分支会走到兜底值。
  （多语言轮新增的 `#lang-switch`、`#lang-gate` 与 `document.documentElement` 已补进三个脚本的桩。）
- **改了 `index.html` 之后要跑 `node build_lang_pages.js`**：根目录页与 `zh/`、`zh-hant/`、`en/`、`ja/` 四个分语言页的 `<head>` 都是它的生成产物（`<body>` 从 index.html 逐字复制）。不重跑的话 `i18n_test.js` 的 [8] 段会失败（它会把磁盘文件与脚本输出逐一比对）。
- 桩里 `document.createElement` / `document.createTextNode` 与「`textContent` 聚合子节点」的行为按真实 DOM 模拟——
  首访弹窗的提示分段（span + 文本节点交替）依赖它；改动弹窗结构时记得同步桩行为。
- `i18n_test.js` 里 `build({ seededLang: 'xx' })` 这类用例是刻意构造的异常输入，用来验证降级路径。
