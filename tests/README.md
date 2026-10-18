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
| `ui_behavior_test.js` | 机型相关与滚动行为：**[2]** 电脑显示长 placeholder（“输入字母，回车或点确定”）、手机/平板显示短 placeholder（“输入字母”），认字母/认单词各自正确；**[3]** 自动滚动**按机型启用**——电脑端全程（初始化、提交、继续、换一个、点击/聚焦输入框、认单词全流程）完全不滚动；手机/平板端初始化与提交本身不滚动（保留判定可见），点“继续”或“换一个”推进时把题目展示框滚动到屏幕顶端（`smooth` + `start`）；**[4]** 手机/平板直接点击 / 用户聚焦识记输入框时同样把题目框滚到顶端（`smooth` + `start`），而初始化等**程序化聚焦**被排除、仍不滚动（以 `dispatchFocus` 让 `focus()` 真实派发事件，并用 `prepare` 在 `app.js` 执行前挂滚动探针，断言才有效力）；**[5]** 转换 textarea 在**不可见**（`offsetParent===null`，模拟已切到识记板块）时不得改写已增高的高度，可见时按内容增高并补上上下边框；**[6]** 同一次手势的 `focus`→`click` 只滚一次，无前置 `focus` 的独立点击仍会滚动。 |
| `i18n_test.js` | 多语言、首访弹窗、释义显隐与静态样式：**[1]** 四份语言资源 key 完全对齐、语言顺序与自称（简体中文/繁體中文/English/日本語）、`index.html` 里 `data-i18n` / `data-i18n-title` 标注的 key 四语齐全、HTML 静态默认文案与输入框 placeholder 默认值与 `dict.zh` 逐条一致、页脚免责声明（`footer.disclaimer`）四语齐全且 HTML 有对应节点、页脚源代码入口（`footer.source`）四语齐全且 HTML 有对应节点（指向 GitHub 仓库、新窗口打开）；**[1.1]** 繁体不是简体的字符替换——关键文案必须与简体不同（單字/匯出/字型紀錄/產生/換一題）、简体专用字黑名单（单词汇录历题难专语选择体记识学习确认导显转换时间门问个们页电…）不得出现在繁体文案里、繁体用「介面」而非「界面」；**[1.2]** 日语术语——「洛克文」写作「ロコ文」（doc.title / brand.sub / convert.title / history.col.glyph 等逐一核对）且日语资源中不得出现「ロック」、expert=エキスパート、解锁文案用「解禁」、`word.err.invalid` 用「のみ」；**[1.3]** 英文术语——「洛克文」写作「Roco Script」（doc.title / brand.sub / tab.convert / convert.scriptRune / history.col.glyph 等逐一核对，复合词与短标签用简称 Roco）且英文资源中除掉品牌名 RuneLearn 后不得出现 Rune；**[2]** 页脚四枚语言按钮（顺序 简/繁/英/日）、切换后 `<html data-lang/lang>` 即时更新（`data-lang-zh` 旧标记确已废弃、不再挂载）、全部静态文案、输入框提示、按钮“确定/继续”、难度文案、历史空态文案即时更新并写入 `localStorage`，高亮随切换移动；**[3]** 首访（`localStorage` 无语言）时页面进入 `data-lang-gate="pending"` 门禁态并构建自绘对话框（四行四语标题、四枚语言按钮、提示行**分四段**且每段带 `data-lang`、段间以「 · 」文本节点连接、带入场类），选定语言（含繁体）后关闭、解除模糊、记忆语言，二次访问不再弹窗且不残留模糊；**[4]** 认单词中文释义**仅简体界面显示**（判定区 `.word-senses` 与历史 `title`），切繁体/英文/日文一律隐藏、判定与正确答案仍在、切回简体恢复，且词库数据不改写；**[5]** 旧历史数据（难度存简体标签、V/W 记录）在简/繁/英/日界面分别本地化显示；**[6]** 非法语言值、`localStorage` 读写抛错、语言资源缺失，以及 CSS 静态检查：繁体/日文字体栈、`data-lang` 字体切换、同屏多语言元素（`.lang-gate-seg` / `.lang-gate-line` / `.lang-btn`）按 `data-lang` 选字体、弹窗字号已放大（标题 20px / 按钮 17px / 提示 14px）、首访模糊规则、释义兜底（`html:not([data-lang="zh"])`）、英/日 placeholder 18px、识记按钮 52px 等高、页脚免责声明样式、源代码链接与免责说明同字号同色且默认无下划线、源代码下划线动效关键帧（12s：前 10s 可见、后 2s 淡出）、三个板块描述文字 16px、`data-lang-zh` 已彻底移除。 |

## 说明

- 桩为了让 `app.js` 能加载，会按 `index.html` 的选择器按需构造元素；
  无法覆盖真实浏览器的排版/字体渲染，那部分需打开 `index.html` 目测。
- 若新增了 DOM id，请同步在桩的 `querySelector` 映射中补齐，否则相关分支会走到兜底值。
  （多语言轮新增的 `#lang-switch`、`#lang-gate` 与 `document.documentElement` 已补进三个脚本的桩。）
- 桩里 `document.createElement` / `document.createTextNode` 与「`textContent` 聚合子节点」的行为按真实 DOM 模拟——
  首访弹窗的提示分段（span + 文本节点交替）依赖它；改动弹窗结构时记得同步桩行为。
- `i18n_test.js` 里 `build({ seededLang: 'xx' })` 这类用例是刻意构造的异常输入，用来验证降级路径。
