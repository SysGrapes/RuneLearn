# RuneLearn 构建指南（面向零基础，可逐步复现）

这份文档用**最具体的步骤**说明「RuneLearn」这个纯前端网站是如何一步步建出来的：用到了哪些字体、哪些数据、这些数据是怎么创建/精制出来的、脚本参数是什么。即使你从未写过代码，按顺序照做也能在本地复现出一个功能一致的网站。

> 本指南面向「从零复现」。若你只想**使用**现成的网站，直接双击 `index.html` 即可，与本文档无关。

---

## 0. 一句话概述

本项目 = 一个 HTML 页面 + 一份 CSS + **三份 JS**（界面文案资源 + 应用逻辑 + 单词库）+ 两个字体文件。
其中**单词库**不是手写的，而是从开源英汉词典 `ECDICT` 的 CSV 数据里，用 Python 脚本按难度规则筛选、精制、校验后自动生成的；
**界面文案**（简体中文 / 繁體中文 / English / 日本語）单独放在 `js/i18n.js` 里，页面上的文字都从那里取，不写死在 HTML/JS 里。

---

## 1. 准备工具与原料

### 1.1 需要安装的软件
- **Python 3.10+**（用于生成词库；本机验证时用 3.10.11 通过）
- **现代浏览器**（Chrome / Edge / Firefox 任一即可，用于运行页面）
- （可选）**Node.js** 用于校验 JS 语法（不装也不影响生成；本机用 v24.9.0 验证）

### 1.2 需要准备的字体（共 2 个）
1. **Rune 字体**（英文字母的“符文”字形）——你在工作区里提供的 `RUNEREGULAR.ttf`。
2. **中文美术字体**（页面中文/英文显示，风格与 Roco 官网一致）——你提供的 `MIANFEIZITI (1).ttf`，其字体族名为 `244-SSDunDunTi`。

> 日文界面**不需要额外准备字体文件**：它用系统自带的日本常用黑体（Noto Sans JP / ヒラギノ角ゴ / Yu Gothic / Meiryo 等，按 `--font-ja` 逐级回退），这样交付包保持轻量、也仍然完全离线。

### 1.3 需要准备的数据源
- **ECDICT**：一个开源、免费的英汉词典数据库，GitHub 仓库：<https://github.com/skywind3000/ECDICT>。
- 本项目使用的输入文件是它导出的 `ecdict.csv`（约 66 MB），按该仓库许可（MIT 类）使用。

> 你无需联网下载它；如果你只想了解“数据是怎么来的”，下面会讲。若要完全复现词库生成，需要这份 CSV（后文第 4 步给出获取方式）。

---

## 2. 建立项目骨架（目录结构）

在工作区里建一个文件夹 `runelearn`，内部按下述结构规划（用文件管理器建文件夹即可）：

```
runelearn/
├── index.html          # 主页面（之后写；<head> 的 SEO 块由 build_lang_pages.js 生成）
├── favicon.png         # 网站图标（rune 字形 R）
├── robots.txt          # 搜索引擎抓取配置（Allow all + Sitemap 指向）
├── sitemap.xml         # 站点地图（根 + 四语言共 5 条 URL，各带 xhtml:link 交替注解）
├── zh/index.html       # 简体中文专属页（build_lang_pages.js 生成，之后跑脚本得到）
├── zh-hant/index.html  # 繁體中文专属页（同上）
├── en/index.html       # English 专属页（同上）
├── ja/index.html       # 日本語专属页（同上）
├── css/
│   └── style.css       # 样式（之后写）
├── js/
│   ├── i18n.js         # 界面文案资源（简体 / 繁體 / English / 日本語，之后写）
│   ├── app.js          # 应用逻辑（之后写）
│   └── wordbank.js     # 单词库（脚本自动生成）
├── fonts/
│   ├── Rune-Regular.ttf
│   └── SSDunDun-CN.ttf
├── tests/              # 离线 Node 测试（可选）
├── build_wordbank.py   # 词库生成脚本（之后写/直接使用）
├── build_lang_pages.js # 分语言静态页生成脚本（改 index.html 后必须重跑）
└── verify_wordbank.py  # 词库校验脚本
```

### 2.1 把字体放入 `fonts/`
把两个字体文件放进 `fonts/` 并改名（重命名是为了路径统一、无空格、易引用）：

| 原始文件名 | 放入后文件名 |
| --- | --- |
| `RUNEREGULAR.ttf` | `fonts/Rune-Regular.ttf` |
| `MIANFEIZITI (1).ttf` | `fonts/SSDunDun-CN.ttf` |

> 说明：`SSDunDun-CN.ttf` 这个名字是自定义的（取字体族名 SSDunDun）；你也可以用自己喜欢的名字，但要在 CSS 的 `@font-face src` 和 `font-family` 里保持一致。

---

## 3. 写页面：`index.html`（两大板块）

页面只负责“骨架”，交互交给 JS。要点：

- `lang="zh-CN"`、`charset="UTF-8"`、`viewport`；`<html>` 上再放 `data-lang="zh"`，语言切换时由 JS 改写它（字体栈靠它切换）。
- 顶部的**两个大板块按钮**，用 `data-main="convert"` / `data-main="recognize"` 区分；对应两个 `<section class="panel">`。
- 识记板块内部再放**两个子板块按钮**，用 `data-sub="letter"` / `data-sub="word"` 区分；对应两个 `<div class="subpanel">`。
- `<认单词>` 子板块里放 4 个难度按钮，用 `data-diff="easy|med|hard|expert"` 区分；“专家”按钮初始带 `class="locked hidden" disabled`（未解锁前隐藏）。
- 页面底部依次用 `<script src="js/wordbank.js">` 然后 `<script src="js/app.js">` 引入（**顺序不能反**：先有词库全局变量，app.js 才能读到）；`js/i18n.js` 要更早，放在 `<head>` 里（首访语言判定要用它）。
- 界面文字（标题、按钮、表头…）在元素上用 `data-i18n="键名"` 标注，`title` 属性用 `data-i18n-title="键名"` 标注；HTML 里写的中文就是“默认值兼无脚本兜底”，由 `js/i18n.js` 的 `dict.zh` 提供同一份文案（两者必须一致，测试会校验）。
- 页脚放一个空的 `<div id="lang-switch">` 作为语言切换入口，按钮由 JS 按语言表生成；页脚再放一行随语言切换的**免责说明 + 源代码入口**（`<div class="footer-disclaimer-row">` 里放 `<p class="footer-disclaimer" data-i18n="footer.disclaimer">本网站与官方无关</p>` 和 `<a class="footer-source" href="https://github.com/SysGrapes/RuneLearn" target="_blank" rel="noopener noreferrer" data-i18n="footer.source">查看源代码</a>`，两者同字号同色、链接不带下划线；链接的下划线用 `::after` + 12s 动画实现“打开页面先显示、停留 10 秒、再 2 秒淡出”）。
- `<head>` 里（`<title>` 之后）放一块 **SEO 元数据**：`description` / `keywords` / `canonical` / Open Graph（含 `og:locale` 与三种 `og:locale:alternate`）/ Twitter Card / JSON-LD 结构化数据（`WebApplication`，`inLanguage` 列四种语言）/ hreflang 互指组——**只加在 `<head>`，不碰任何可见内容**。注意：这块元数据与 `zh/`、`zh-hant/`、`en/`、`ja/` 四个分语言页都由 `build_lang_pages.js` 生成（见第 10 节），**不要手改**；改 SEO 文案或托管域名时改脚本顶部的 `SITE` / `SEO` 常量再重跑即可。

> 关键设计：词库作为 **JS 全局变量**（`window.RUNE_WORDBANK`）通过 `<script>` 引入，而**不是**用 `fetch` 去读一个 JSON。这样双击打开（`file://` 协议）时不会有跨域问题，也便于部署到 GitHub Pages。

### 3.1 字体在 HTML 中的使用
正文中文用 `fonts/SSDunDun-CN.ttf`，符文英文用 `fonts/Rune-Regular.ttf`（在 CSS 里以 `@font-face` 声明，见第 4 步），在 HTML 里只需给元素加上对应 class，由 CSS 控制 `font-family`。

---

## 4. 写样式：`css/style.css`

要点：
- 用 `@font-face` 声明两个本地字体：
  ```css
  @font-face{ font-family:"Rune"; src:url("../fonts/Rune-Regular.ttf") format("truetype"); }
  @font-face{ font-family:"SSDunDun-CN"; src:url("../fonts/SSDunDun-CN.ttf") format("truetype"); }
  ```
  > 注意路径：CSS 文件在 `css/` 里，字体在 `fonts/` 里，所以相对路径要写 `../fonts/...`。
- 设计基调：暖色纸张底、深墨色文字、暖棕强调色（罗克风格），**不使用 emoji、避免花哨渐变**。
- 为“板块/子板块切换”定义淡入动画（`.panel.active`、`.subpanel.active`、`@keyframes`）——切换类是 JS 负责加的，动画由 CSS 负责播放。
- 给历史表格、答案判定（对/错）、难度按钮、连击/解锁提示等定义样式。

---

## 5. 生成单词库：`build_wordbank.py` 与 `verify_wordbank.py`

这是“数据是怎么创建的”的核心。整个流程是**脚本化、可重复**的：输入 ECDICT 的 CSV，输出 `js/wordbank.js`。

### 5.1 数据源：ECDICT 的 `ecdict.csv` 长什么样

`ecdict.csv` 每行是一个英文词条，逗号分隔，第一行是列名。本项目用到这些列（下标从 0 计）：

| 列下标 | 列名 | 含义 | 本脚本用途 |
| --- | --- | --- | --- |
| 0 | `word` | 英文词 | 取词本身 |
| 1 | `phonetic` | 音标 | 保留为 `ph` |
| 2 | `definition` | 英文释义 | 未用 |
| 3 | `translation` | 中文翻译 | 解析出“词性+中文释义” |
| 4 | `pos` | 词性 | 未直接使用（中文翻译里已带词性） |
| 5 | `collins` | 柯林斯星级 1–5 | 判断常用度 |
| 6 | `oxford` | 牛津标记 | （备用） |
| 7 | `tag` | 考试标签（zk/gk/cet4/cet6/ky/ielts/toefl/gre） | 判断常用度 |
| 8 | `bnc` | 英频 | （备用） |
| 9 | `frq` | 词频排名（越小越常用） | 打分辅助 |
| 10+ | … | 其它 | 未用 |

`translation` 列的一个真实例子（注意分隔符是**字面的 `\n` 两个字符**，不是一个真换行）：
```
n. 毕业生, 量杯\na. 已得学位的, 研究生的, 毕业的\nvi. 毕业, 得学位, 逐渐变为\nvt. 准予...毕业
```

### 5.2 脚本做的事（逐步说明）

`build_wordbank.py` 主流程（`__main__` 部分）：

1. **读取 CSV**：用 Python 的 `csv.reader` 读出所有行列，按键（小写单词）存成字典 `D`，取需要的字段。
2. **定义“常用”门槛 `is_common()`**：一个词只有符合下面**任一条**才算“常用/适合学习”：
   - Collins 星级 ≥ 3；或
   - 出现在 `zk/gk/cet4/cet6/ky/ielts/toefl/gre` 任意一个考试大纲里。
   这一步把 `abdominoplasty`（腹壁整形术）、`accouchement` 这类生僻词直接排除。
3. **按难度过滤 `build(difficulty)`**：对每个候选词按字母数和是否含 v/w 过滤（规则见下表），再要求有音标、有可解析的中文翻译、通过常用门槛。
4. **解析中文翻译 `parse_translation()`**：把 `translation` 的每一行（用字面 `\n` 分开）拆成 `{pos, def}`；同时把 `翻译` 里的规范词性归一化（`vt/vi`→`v`，`a`→`adj` 等），并丢弃 `[计]`/`[医]` 这类领域标记行。
5. **清理派生形式 `clean_senses()`**：丢弃“××的过去式/复数形式/现在分词”这类不是词典词条头的释义。
6. **常用度打分 `common_score()`**：综合 Collins 星级、考试标签、词频排名打一个分，分数越高越“常用”。
7. **排序与选取 `pick()`**：按分数从高到低排；对 `expert` 额外给“同时含 V 和 W”的词加小分（`vw_bonus=6`），让真正常用且含 V+W 的词靠前，同时不把生僻的 `oversweeping` 之类拉进来。
8. **跨难度去重**：确保一个词不会同时出现在两个难度里。
9. **输出 `wordbank.js`**：把最终结果写成 `window.RUNE_WORDBANK = {...}` 的 JS 文件（用 `json.dump` 转成 JSON，`ensure_ascii=False` 保留中文）。

### 5.3 难度与生成参数

| 难度 | 生成词数 | 字母数要求 | 是否含 v/w | min_score | vw_bonus |
| --- | --- | --- | --- | --- | --- |
| easy | 340 | 2 ≤ len ≤ 4 | **不含** v 或 w | 16 | 0 |
| med | 340 | 5 ≤ len ≤ 8 | 可出现 | 30 | 0 |
| hard | 340 | len ≥ 9 | 可出现 | 30 | 0 |
| expert | 340 | len ≥ 12 | 尽可能同时含 v 和 w | 14 | 6 |

> 竞态随机种子 `random.seed(20240924)` 使得同一次脚本跑出来的结果可复现（但词库文件已随项目提交，一般无需重跑）。

### 5.4 每一行输出词条的 JSON 结构

```json
{
  "w": "graduate",
  "ph": "'grædʒueit",
  "senses": [
    { "pos": "n", "def": "毕业生, 量杯" },
    { "pos": "adj", "def": "已得学位的, 研究生的, 毕业的" },
    { "pos": "v", "def": "毕业, 得学位, 逐渐变为" }
  ]
}
```

- `w`：单词原文（小写 a–z）
- `ph`：音标
- `senses`：一组“词性 + 中文释义”，可任意扩展多条（一个单词多个词性就多条）

---

## 5.5 写多语言文案：`js/i18n.js`

页面上的每一句界面文字都放在这里，四种语言各一份，好处是**改文案只改一个文件**、加语言也只加一份。写法：

```js
window.RUNE_I18N = {
  fallback: 'zh',                                  // 某语言缺 key 时回退简体
  storeKey: 'runelearn.lang',                       // 记住用户选择的 localStorage 键
  langs: [                                          // 语言表：顺序即页面上的排列顺序
    { key: 'zh', native: '简体中文', locale: 'zh-CN' },
    { key: 'zh-Hant', native: '繁體中文', locale: 'zh-Hant' },
    { key: 'en', native: 'English', locale: 'en' },
    { key: 'ja', native: '日本語', locale: 'ja' }
  ],
  dict: {
    zh: { 'letter.title': '认字母', 'word.meta': '难度：{diff}', 'footer.disclaimer': '本网站与官方无关', 'footer.source': '查看源代码', /* … */ },
    'zh-Hant': { 'letter.title': '認字母', 'word.meta': '難度：{diff}', 'footer.disclaimer': '本網站與官方無關', 'footer.source': '查看原始碼', /* … */ },
    en: { 'letter.title': 'Letter Recognition', 'word.meta': 'Level: {diff}', 'footer.disclaimer': 'This site is not affiliated with the official site.', 'footer.source': 'View source', /* … */ },
    ja: { 'letter.title': '文字当て', 'word.meta': '難易度：{diff}', 'footer.disclaimer': '本サイトは公式サイトとは関係ありません。', 'footer.source': 'ソースコードを見る', /* … */ }
  },
  gate: {                                           // 首访语言弹窗：用户还没选语言，四种语言并列展示
    title: ['选择界面语言', '選擇介面語言', 'Select your language', '言語を選択'],
    // tip 每项对应一种语言；app.js 会把它渲染成四个带 data-lang 的分段（各用各的字体）
    tip:   ['选择后可随时在页面底部切换', '選擇後可隨時在頁面底部切換', 'You can switch anytime at the bottom of the page', '選択後はページ下部でいつでも変更できます']
  },
  /* readStoredLang(): 读并校验 localStorage 里的语言，<head> 引导脚本与 app.js 共用 */
};
```

约定：key 用点号分层、四份语言的 key 必须完全一致；带参数的用 `{名字}` 占位；品牌名 RuneLearn、署名与语言自称不做翻译。**日语里「洛克文」写作「ロコ文」**（Roco 的日文名为 ロコ），不要用 ロック文字。**英文里「洛克文」写作「Roco Script」**（正式场合用全称 Roco Script，复合词/短标签用简称 Roco，如 Roco Converter / Roco Practice / Roco glyph），英文中 Rune 一词只允许出现在品牌名 RuneLearn 里。

> **繁體中文不是“简体换字”**：要按台湾用词习惯单独写（單字 / 匯出 / 字型 / 自訂 / 歷史紀錄 / 介面 / 產生 / 換一題…），否则读起来会很别扭。字体上，简体/英文用敦敦体，繁體用系统繁体黑体，日文用系统日文黑体——因为敦敦体只覆盖 GB2312，繁体常用的“學/習/識/轉/換/單/難/專/匯”等字它都没有。它同样以 `<script>` 全局变量形式引入（不许 `fetch`，否则 `file://` 下跨域）。

---

## 6. 写应用逻辑：`js/app.js`

app.js 是一个自执行函数（IIFE），在页面加载完、`i18n.js` 与 `wordbank.js` 之后执行。它做的事情：

0. **多语言（第 0 / 0.1 节）**：`t(key, vars)` 取文案（缺失回退简体）；`applyLanguage(lang)` 负责改写 `<html data-lang/lang>`、`document.title`、所有 `data-i18n` 静态文案和随语言变化的动态内容（判定、历史、难度、placeholder、按钮、以及**转换行输入框与「清空」按钮的等高重对齐**），页脚语言按钮与首访弹窗都调用 `setLang()` → 写入 `localStorage`；语言切换**不需要刷新页面**。首次访问（没有语言记忆）时，`<head>` 的小脚本会先给 `<html>` 挂 `data-lang-gate` 让内容模糊、锁住滚动，app.js 再用 `createElement` 当场拼出蒙层 + 对话框（四语标题四行、四枚语言按钮、提示**分四段**渲染——每段一个带 `data-lang` 的 span，由 CSS 给对应语言字体，避免同屏混排），选完关掉并解除模糊。
1. **工具函数**：选择器、HTML 转义（防 XSS）、localStorage 安全读写、输入规范化（去空白、全角转半角、转小写）、随机“不重复”下标、时间格式化、判断 V/W。
2. **板块/子板块切换**：点击顶部按钮切换 `.panel.active`；点击子板块按钮切换 `.subpanel.active`；切换动画由 CSS 负责。
3. **【转换】实时显示**：监听输入框 `input`，把文本用 `textContent` 写入符文区（天然防注入）；颜色/描边控件变化时同步更新样式。
4. **【转换】导出透明 PNG**：用 `new FontFace("RuneCanvas", url("fonts/Rune-Regular.ttf"))` 确保 canvas 用同一个 Rune 字体 → 用 `canvas.getContext('2d')` 量字宽 → 分行以避免过宽 → 透明背景上画文字（需要描边再 `strokeText`）→ `canvas.toBlob` 得到 PNG → 生成 `<a download>` 触发下载。
5. **【认字母】**：随机取 26 个字母之一作为 `current`；若取到 V 或 W，`isVW=true`，判对错时 `V` 和 `W` 都算正确，正确答案显示为“V 或 W”（按当前语言本地化）；写入历史（无“难度”字段）并渲染。
6. **【认单词】**：按当前难度从词库随机取一个词显示符文；用户输入判对错；对时/错时展示正确答案、读音、词性+中文释义——**中文释义只在简体界面展示**（繁體/英/日隐藏，切回简体即恢复；历史悬停提示同理）。
7. **专家解锁**：仅当难度是 hard 或 expert 时累计连击；答对 `streak+1`、答错清零；`streak>=5` 时把 `localStorage` 的解锁标记置真并显示“专家”按钮。
8. **初始化**：按 `localStorage` 装载语言、生成页脚语言按钮、读回历史、按当前解锁状态刷新专家按钮、渲染初始字母与单词，最后统一落地语言与首访弹窗。

> 健壮性要点（这也是本项目刻意做的）：
> - 所有用户输入都经 `normalizeInput` 清理 + 转义，历史渲染用 `escapeHtml`，不会输入注入 HTML（XSS）。
> - `storeGet`/`storeSet` 全程 try/catch，localStorage 损坏或写满也不抛错。
> - 空输入、非字母、超长输入都有提示而不会崩溃。
> - `WKB` 可能为空或某难度缺失，渲染前都做了空值兜底。

---

## 7. 校验：`verify_wordbank.py`

独立脚本，重新读 `js/wordbank.js` 并逐条核验：
- 四难度是否存在、每个单词数 ≥ 300；
- easy 全部 ≤4 且不含 v/w；med 5–8；hard ≥ 9；expert ≥ 12；
- 无跨难度重复；
- 每条都有 `ph` 和非空 `senses`；
- 输出统计（专家含 V+W 数等）。

运行：
```
python verify_wordbank.py
```
看到“全部通过”即为合格。这个脚本就是“重复检查难度的规则是否符合要求”的自动化工具。

---

## 8. 端到端逐步操作清单（从零到可用）

1. 建立 `runelearn/` 及子文件夹（css/js/fonts/docs）。
2. 把两个字体放进 `fonts/` 并改名（见 2.1）。
3. 写 `index.html`（第 3 步）。
4. 写 `css/style.css`（第 4 步）。
5. 准备 `ecdict.csv`（见下），运行 `python build_wordbank.py` 生成 `wordbank.js`，把它复制/移动为 `js/wordbank.js`。
6. 写 `js/i18n.js` 文案资源（第 5.5 步）。
7. 写 `js/app.js`（第 6 步）。
7.5 运行 `node build_lang_pages.js` 生成分语言静态页（第 10 节）：会重写 `index.html` 的 `<head>` 并生成 `zh/`、`zh-hant/`、`en/`、`ja/` 四个子页；**之后每次改 `index.html` 都要重跑它**。
8. 运行 `python verify_wordbank.py` 校验词库。
9. （可选）`node --check js/i18n.js`、`node --check js/app.js` 校验 JS 语法。
10. 双击 `index.html`，在浏览器里逐项测试：
   - **语言**：首次打开（或先在浏览器里清掉 `localStorage` 的 `runelearn.lang`）应看到内容模糊 + 语言选择对话框（简体中文 / 繁體中文 / English / 日本語 四个选项，按此顺序；四行标题与提示各段用各自语言字体、整体字号偏大）；选一种后模糊解除、文案与字体立刻变过去；之后刷新不再弹窗；页脚四枚语言按钮可随时切换并记住；**「认单词」的中文释义只在简体界面显示**（繁/英/日都隐藏，切回简体恢复）；页脚有随语言切换的“本网站与官方无关”说明，其右侧的“查看源代码”链接同样随语言切换、样式与免责说明一致且默认无下划线——**每次打开页面链接下方先出现一条下划线，停留约 10 秒后在 2 秒内缓慢消失**（刷新页面会重新播放）；繁体界面文案应是台湾用词（單字/匯出/字型/歷史紀錄/介面）而不是简体的换字版；**切成繁体/日文后转换行的输入框与「清空」按钮仍等高**（两者由 JS 在语言切换后重新对齐）。
   - **分语言 URL**：起一个本地静态服务器（如 `python -m http.server`）后访问 `/zh/`、`/zh-hant/`、`/en/`、`/ja/`，应**直接进入对应语言且不弹首访弹窗**（标题、界面文案、页脚都是该语言，资源无 404）；随后访问根目录 `/` 应保持该语言（语言记忆跨 URL 生效）；清掉 `localStorage` 后访问 `/` 首访弹窗恢复如初。
   - 两大板块切换正常；识记内两个子板块切换正常。
   - **认字母**：作答后（无论对错）按钮变「继续」，2.5 秒后自动切下一题；已判定后再点或按回车只切题、不重复判定；V/W 均算对且答案显示“V 或 W”；输入框聚焦时提示立即消失；题目字形不可复制。
   - **认单词**：各难度含解锁；困难连对 5 次解锁“专家”（进度不显示，解锁才提示）；判定处音标为一般无衬线、每个词性单独一行；历史“正确答案”悬停可看释义（仅简体界面）。
   - **转换**：控件顺序为 字形颜色→描边颜色→描边粗细→字号大小→字形(正常/洛克文)→导出；可切换“正常/洛克文”字形；描边为向外描边；导出透明 PNG。
   - 关闭再打开历史仍在；可清空历史。
11. 交付：把整个 `runelearn/` 文件夹打包即可分享（含四个分语言页）；也可推到 GitHub Pages——`robots.txt`、`sitemap.xml` 与 `/zh/`、`/zh-hant/`、`/en/`、`/ja/` 都随仓库根目录生效，无需额外配置（细节见第 10 节）。

---

## 9. 关于 `ecdict.csv` 的获取与许可

- 数据来源：<https://github.com/skywind3000/ECDICT>（开源免费英汉词典库）。
- 在仓库里可找到 `ecdict.csv` 或从发布页/直链下载约 66MB 的 CSV 放到本项目根目录（`build_wordbank.py` 顶部 `ECDICT` 路径指向它）。
- 使用前请查看该仓库的许可证；本项目仅用了 `word/phonetic/translation/collins/tag/frq` 等字段，并做了常用度过滤与派生词清理。
- 由于 CSV 体积大且只用于生成，生成完 `wordbank.js` 后**不需要把它打进分享包**（本项目交付包里已删除 `ecdict.csv`，只保留生成脚本与校验脚本，说明数据出处）。

---

## 10. 搜索引擎优化（SEO：robots.txt / sitemap.xml / 分语言 URL / `<head>` 元数据）

站点托管到 GitHub Pages 后，让搜索引擎“找得到、读得懂”只需几个纯静态手段，**都不改变网站本身的可见内容**：根目录的抓取配置（robots.txt / sitemap.xml）、`<head>` 里的元数据，以及由 `build_lang_pages.js` 生成的四个分语言静态页（`/zh/`、`/zh-hant/`、`/en/`、`/ja/`，配 hreflang 互指）——四语界面本身仍共用同一套代码，语言在浏览器端切换。

### 10.1 根目录 `robots.txt`（告诉爬虫“全都可以抓”）

```
User-agent: *
Allow: /

Sitemap: https://sysgrapes.github.io/RuneLearn/sitemap.xml
```

- `User-agent: *` + `Allow: /`：对所有爬虫开放全站（本站没有需要屏蔽的路径）。
- `Sitemap:` 行：告诉爬虫站点地图在哪（Google / Bing 都认这一行，不提交也能被发现）。
- GitHub Pages 会原样伺服仓库根目录的 `robots.txt`，无需任何配置。

### 10.2 根目录 `sitemap.xml`（告诉爬虫“站点有哪些页面”）

标准 urlset；本站有五个页面（根目录 + 四种语言各一个），每条都带同一组 `xhtml:link` 交替注解（sitemap 版的 hreflang，与页面 `<head>` 里的互为备份）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://sysgrapes.github.io/RuneLearn/</loc>
    <lastmod>2026-10-18</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="zh" href="https://sysgrapes.github.io/RuneLearn/zh/"/>
    <xhtml:link rel="alternate" hreflang="zh-Hant" href="https://sysgrapes.github.io/RuneLearn/zh-hant/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://sysgrapes.github.io/RuneLearn/en/"/>
    <xhtml:link rel="alternate" hreflang="ja" href="https://sysgrapes.github.io/RuneLearn/ja/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://sysgrapes.github.io/RuneLearn/"/>
  </url>
  <!-- zh/、zh-hant/、en/、ja/ 四条结构相同（loc 与 priority 0.9 不同），各带同样 5 个 xhtml:link -->
</urlset>
```

- `<loc>` 必须写**完整规范 URL**（含协议与末尾斜杠），且与对应页面 `<head>` 里的 `canonical` 一致。
- 以后每次较大改版，更新各条的 `<lastmod>` 即可。

### 10.3 `<head>` 元数据块（告诉爬虫与社交平台“这是什么”）

这些标签由 `build_lang_pages.js` 生成（根目录页 + 四个分语言页各一份，按语言本地化），加在 `index.html` 的 `<title>` 之后，共七类：

| 元数据 | 作用 | 要点 |
| --- | --- | --- |
| `meta description` | 搜索结果摘要 | 按页面语言撰写（中文为主含中英日关键词 / 繁体台湾用词 / 英文 Roco Script / 日文 ロコ文） |
| `meta keywords` | 面向百度等仍看 keywords 的引擎 | 与 description 关键词同源 |
| `link rel="canonical"` + `og:url` | 规范 URL | **每页指向自身**（根目录 → `/`，`/en/` → `/en/`…），五个页面互为“备份版本”而不是重复页 |
| hreflang 互指组 | 告诉搜索引擎“这五页是同内容的不同语言版本” | 五页都带同一组五个 `<link rel="alternate" hreflang="…">`：zh / zh-Hant / en / ja / **x-default → 根目录** |
| Open Graph | 分享到社交平台的卡片 | `og:type`=website、title、description、`og:locale` 取该页语言 + 三个 `og:locale:alternate`（去重）；**不放 `og:image`**——favicon 只有 64×64，低于各平台最低要求 |
| Twitter Card | 分享到 X/Twitter 的卡片 | `summary`（无图形态）+ title / description |
| JSON-LD | 结构化数据 | `@type: WebApplication`：name、alternateName、url（指向自身）、description、`applicationCategory=EducationalApplication`、`operatingSystem=Any`、`inLanguage`（分语言页只列该语言，根目录列四种）、`isAccessibleForFree`、`offers` 价格 0 USD |

> 这些标签只影响爬虫与分享卡片，**不影响页面渲染出的任何文字**（可用浏览器 F12 核对可见内容逐字未变）。

### 10.4 分语言 URL 是怎么做出来的（`build_lang_pages.js`）

四语界面本来共用一份 `index.html`（语言在浏览器端切换）。分语言 URL 的思路是“**构建产物**”：一个脚本从 `index.html` 生成五个页面，源文件仍然只有一份。

```
node build_lang_pages.js
```

脚本做的事（在 `runelearn/` 根目录运行，零依赖）：

1. **读 `index.html` 与 `js/i18n.js`**（用 `vm` 加载，取各语言的 `doc.title` 当 `<title>`，保证标题与界面文案同源）。
2. **生成五个页面**：`index.html`（根目录，x-default，静态文案仍为简体中文）与 `zh/`、`zh-hant/`、`en/`、`ja/` 四个子页。`<body>` 从 `index.html` **逐字复制**（页面结构只有一份源），只改 `<head>`：
   - head 元数据按语言本地化（见 10.3 表）；`canonical` / `og:url` / JSON-LD `url` 指向自身；五页共享同一组 hreflang；
   - `<html lang="…" data-lang="…">` 预置该语言；
   - 子页资源引用统一加 `../` 前缀（`../css/style.css`、`../favicon.png`、`../js/i18n.js`、`../js/wordbank.js`、`../js/app.js`）——因为子页在 `/en/` 下，裸路径会 404；这样线上与本地 `file://` 双击都能打开。
3. **`<head>` 引导脚本升级**（五页同一份）：先做路径检测——`location.pathname` 以 `/zh/` `/zh-hant/` `/en/` `/ja/` 结尾时，预置对应语言（`zh-hant` 映射到语言键 `zh-Hant`）并**写入 localStorage**。因为“首访弹窗”的判据就是有没有语言记忆，写了库自然不弹窗——**`js/app.js` 一行都不用改**。
4. **行为口径**：URL 只是**入口预置**。用户访问 `/en/` 后又在页脚切到中文，以用户选择为准（已写库）；再次访问 `/en/` 会再次预置英文。localStorage 按源共享，所以 `/en/` 记住的语言在根目录也生效。

> **改了 `index.html` 之后必须重跑本脚本**（分语言页的 body 要从新 index.html 复制）。`tests/i18n_test.js` 的 [8] 段会把磁盘上的五个页面与脚本输出逐一比对，忘记重跑会直接测试失败。
> 换托管域名：只改脚本顶部的 `SITE` 常量再重跑（`sitemap.xml` 里的 URL 同步手改）。

### 10.5 托管后的验证（无需额外配置）

1. 推送代码到 GitHub，Settings → Pages 开启（Source 选仓库根目录），等几分钟访问线上地址。
2. 验证这几个地址能正常打开：`/robots.txt`、`/sitemap.xml`、`/`、`/zh/`、`/zh-hant/`、`/en/`、`/ja/`。
3. 之后收录交给搜索引擎自行完成即可；如日后想主动催收录，可自行到 Google Search Console / Bing Webmaster Tools 等站长平台提交 sitemap（**非必需**，本项目未做任何平台绑定）。

### 10.6 已知局限

- 分语言页的语言是“入口预置”：用户之后在页脚切走，URL 不会跟着变（以用户选择为准，避免跳转打断体验）。
- 根目录页与 `/zh/` 内容相同（都是简体静态文案）：靠 canonical 各自指向自身 + hreflang 互指来区分，搜索引擎不会判重复。
- og:image 仍未设置（缺一张 ≥1200×630 的分享图）；加上后六个页面都要补（改 `build_lang_pages.js` 的 head 生成处）。

---

## 11. 常见问题（FAQ）

- **为什么要用 JS 全局变量存词库而不是 JSON + fetch？** 因为双击打开是 `file://` 协议，浏览器对本地文件的 `fetch` 会拦截（跨域）；用 `<script>` 引入 JS 全局变量则没有任何网络/跨域问题，也能直接部署到 GitHub Pages。
- **V 和 W 为什么特殊？** 本项目用的 Rune 字体里 `V` 与 `W`（大小写不care）字形显示相同，所以「认字母」里二者都算对、答案显示“V 或 W”；「认单词」因为答案是整词，靠用户自行辨别，不特殊处理（这也是难度提升点之一）。
- **为什么专家难度没有很多同时含 V 和 W 的词？** 英语里 12 个字母以上且同时含 v、w、又是常用词的词本来就极少（如 `overwhelming`），规则允许“没有也可以”，故以常用度优先。
- **我改了词库想重新生成怎么办？** 改 `build_wordbank.py` 的参数或拿新的 `ecdict.csv` 重跑它即可，再运行 `verify_wordbank.py` 复核。
