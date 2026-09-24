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
并支持英文→符文转换、导出透明 PNG。

【架构（务必先读这三份再改）】
- index.html：两大板块（洛克文转换 / 洛克文识记 顶部切换）；识记内又有两个子板块（认字母 / 认单词）。
- css/style.css：样式与 @font-face（Rune-Regular.ttf 为符文英文；SSDunDun-CN.ttf 为中文，风格同 roco）。
- js/wordbank.js：单词库，硬编码为全局变量 window.RUNE_WORDBANK。
- js/app.js：全部交互逻辑；在 wordbank.js 之后加载。
- build_wordbank.py + verify_wordbank.py：词库的生成与校验脚本（数据源 ECDICT 的 ecdict.csv）。

【关键规则（不可打破）】
1. 主语言用中文；不使用 emoji；避免花哨渐变；面向用户文案中“Rune 字体/字形”一律称“洛克文”（品牌名 RuneLearn 除外）。
2. V/W 在 Rune 字体中字形相同：<认字母> 出现 V/W 时同时接受二者为正确、答案显示“V 或 W”；<认单词> 不特殊处理。
3. 认字母历史字段：序号、洛克文字形、正确答案（一般字形）、正误、时间（无“难度”）；认单词历史多一个“难度”，且“正确答案”悬停(title)显示该词释义。
4. 难度规则：简单≤4且不含v/w；中等5–8；困难≥9；专家≥12且尽可能含v/w。每难度词库≥300。
5. 困难难度连续答对5次解锁“专家”（解锁前隐藏）；连击进度**只内部计数不显示**，解锁才提示“已解锁专家难度”。解锁与历史都存 localStorage。
6. 作答交互：点“确定”或回车提交并判定；提交后按钮文本变“继续”、回车也=切下一题；**统一在 2.5 秒后自动进入下一题**；已判定后再点/回车只切题，绝不重复判定同一题；进入下一题后复原“确定”+回车判定。输入框提示(placeholder)在聚焦(出现光标)时立即消失，失焦且为空时恢复。
7. 展示洛克文字形的题目区域（.quiz-glyph、.stage-canvas）必须 `user-select: none`（不可复制），防作弊。
8. 词库必须用 <script> 引入的 JS 全局变量（不能用 fetch 本地 JSON，否则 file:// 下跨域）。
9. 板块/子板块切换要有简洁动画。
10. 转换板块控件顺序固定为：字形颜色 → 描边颜色 → 描边粗细 → 字形(正常/洛克文) → 导出；描边采用 8 方向的“向外描边”（DOM 与导出一致）；判定处音标用通用无衬线字体（不用 CJK 美术字包 IPA 符号）。

【强约束】
- 任何改动都要保证面对非法输入不崩溃：空输入、非字母、超长、emoji 注入、localStorage 损坏/满、
  词库脚本缺失或某难度缺失。所有用户输入经转义，防 XSS。
- 改 js/app.js 后请用 `node --check js/app.js` 校验语法；改词库后运行 `python verify_wordbank.py` 复核；
  最后双击 index.html 在浏览器里回归一遍：两大板块、认字母(含V/W)、认单词各难度、困难连对5次解锁专家、
  转换+导出透明PNG、历史持久化/清空。
- 交付 = 打包整个 runelearn 文件夹；也可托管 GitHub Pages。不要引入外部 CDN。

请先简要复述你的理解与将要改动的点，再实施。改动尽量小、可回退。
```

---

## 2. 工程背景（接手者必读）

### 2.1 这是什么
一个完全离线的单页网站，帮助用户把 Rune 字体的“符文”（人造字母）与英文字母/单词对应起来。含：
- 转换（英文 → 符文，可调颜色/描边，导出透明 PNG）
- 识记（认字母、认单词两子板块，带难度与历史）

### 2.2 目录结构
```
runelearn/
├── index.html            # 页面骨架（两大板块 + 两子板块 + 专家解锁按钮）
├── README.md             # 项目总览与使用说明（留根目录，其余 md 都在 docs/）
├── docs/
│   ├── BUILD_GUIDE.md    # 面向零基础的逐步构建/数据生成文档
│   └── AGENT_HANDOFF.md  # 本文件
├── css/style.css         # 样式与 @font-face
├── js/
│   ├── app.js            # 全部逻辑
│   └── wordbank.js       # 词库（window.RUNE_WORDBANK）
├── fonts/
│   ├── Rune-Regular.ttf  # 符文英文
│   └── SSDunDun-CN.ttf   # 中文（SSDunDun，风格同 roco）
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
| 语言/文案 | 中文（`zh-CN`） |
| 风格 | 简洁、暖纸色、无 emoji、避免过度渐变、罗可风格 |
| 字体 | 中文 `SSDunDun-CN`，符文 `Rune`；均在 `fonts/`，用 `@font-face` 相对引用 `../fonts/` |
| 词库加载 | `<script src="js/wordbank.js">` → 全局 `window.RUNE_WORDBANK`；app.js 后加载 |
| 无跨域 | 不 fetch 本地文件 |
| localStorage 键 | `runelearn.letter.history`、`runelearn.word.history`、`runelearn.expertUnlocked`、`runelearn.hardStreak` |
| 防 XSS | 用户输入一律 `normalizeInput` + `escapeHtml`，渲染用 `textContent`/转义 |
| 动画 | 切换类 `.active`，动画放 CSS（`.panelIn` keyframes） |
| 答题防复制 | `.quiz-glyph`、`.stage-canvas` 设 `user-select: none` |
| 作答状态机 | `letterState/wordState.done` 标志 + `letterReset/wordReset`；提交后按钮变“继续”并 `setTimeout(renderX, 2500)` 自动切题；切题时复原。回车/按钮在 done 态只切题 |
| 描边(向外) | DOM 用 `buildOutline()` 生成 8 方向 `text-shadow`；canvas 用 8 方向偏移 `fillText` 再中心盖回 |
| 转换字形切换 | `convertScript`（'rune'/'normal'）+ `.script-btn[data-script]`；`updateConvert` 依此设 `.stage-canvas` 的 font-family |
| 音标字体 | `.ph` 用 `--font-read`（PingFang/雅黑 等无衬线），不覆盖 IPA 特殊符号 |
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

### 2.7 推荐的改动流程（最小可回退）
1. 读 README + docs + 相关源码。
2. 小步修改，一次只改一件事。
3. 校验：`node --check js/app.js`；改词库跑 `verify_wordbank.py`。
4. 浏览器双击 `index.html` 回归主流程。
5. 同步更新 README / docs 中受影响的部分。

### 2.8 常见扩展方向（仅供接手者参考，未实施）
- 认单词增加“读音播放”（需引入音频数据或 TTS，注意离线约束）。
- 历史记录支持导出/统计（正确率、难度曲线）。
- 认字母增加大小写对照或首字母猜词。
- 为词库增加更多难度档或自定义难度。
