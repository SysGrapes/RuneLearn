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
- tests/smoke_test.js + tests/ui_behavior_test.js：离线 Node DOM 桩测试（零依赖，`node tests\smoke_test.js` 运行），覆盖核心逻辑/对抗场景与机型 placeholder、切题滚动行为；说明见 tests/README.md。
- favicon.png：网站图标（rune 字形 R，色 #2e2a26），由 index.html `<head>` 引用。

【关键规则（不可打破）】
1. 主语言用中文；不使用 emoji；避免花哨渐变；面向用户文案中“Rune 字体/字形”一律称“洛克文”（品牌名 RuneLearn 除外）。
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
13. **双文档并行维护**：根目录 `README.md` 面向用户/产品经理，用平实语言介绍功能，**不**涉及技术实现、架构、数据、迭代记录；`docs/REAL_README.md` 是技术向总览，可事无巨细地写实现细节、数据说明、迭代记录等。**任何改动 README 的场景必须两篇一并更新**，保持二者风格鲜明区别——README 说“是什么/怎么用”，REAL_README 说“怎么做到的/改过什么”。

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
├── README.md             # 面向用户/客户的产品介绍（平实语言，不涉及技术细节）
├── docs/
│   ├── REAL_README.md    # 技术向总览与原迭代记录（事无巨细，随代码同步更新）
│   ├── BUILD_GUIDE.md    # 面向零基础的逐步构建/数据生成文档
│   ├── AGENT_HANDOFF.md  # 本文件
│   └── ADVERSARIAL_TEST_REPORT.md  # 对抗测试报告（安全/健壮性/逻辑/观感）
├── css/style.css         # 样式与 @font-face
├── js/
│   ├── app.js            # 全部逻辑
│   └── wordbank.js       # 词库（window.RUNE_WORDBANK）
├── fonts/
│   ├── Rune-Regular.ttf  # 符文英文
│   └── SSDunDun-CN.ttf   # 中文（SSDunDun，风格同 roco）
├── favicon.png           # 网站图标（rune 字形 R）
├── tests/                # 离线 Node 测试（见 tests/README.md）
│   ├── smoke_test.js     # 核心逻辑冒烟/对抗测试
│   └── ui_behavior_test.js  # 机型 placeholder 与切题滚动
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
| 音标字体 | `.ph` 用 `--font-read`（PingFang/雅黑 等无衬线），不覆盖 IPA 特殊符号，并以双斜杠渲染 `/.../` |
| 历史闪烁 | `renderLetterHistory/renderWordHistory(flashFirst)`：最新行加 `flash-ok`/`flash-no`（CSS keyframes 1.5s） |
| 题目字号自适应 | `computeGlyphFontSize(text)` 用 canvas measureText，先算能一行显示的字号（≤74px），再 `wordGlyph.style.fontSize` 后设 textContent；字体加载完后 `renderWord()` 重渲染一次以精确测量 |
| 历史字号 | `.history-table`、`.history-table th,td` 与 `.history-table .rune` 统一 `font-size:15.5px`（表头与值一致） |
| 输入框 | `.text-input` 17px；`.letter-input` 居中/字距 2px；`.quiz-answer .text-input` 高度统一 52px、**字号统一 22px**（认字母与认单词一致，placeholder 随输入框同字号）、placeholder 字距 0；placeholder 仅 `nowrap+ellipsis+overflow:hidden` 防溢出 |
| placeholder 机型 | `isMobileOrTablet()`（`matchMedia('(pointer: coarse)')`/`(hover: none)` 或 UA）→ `placeholderFor('letter'｜'word')`：手机/平板短版，电脑长版 |
| 推进滚动 | `scrollStageToTop(glyphEl)`：取 `closest('.quiz-stage')` 后 `scrollIntoView({behavior:'smooth',block:'start'})`。**仅手机/平板启用**（`autoScrollEnabled()`=`isMobileOrTablet()`，电脑直接 return，完全禁用自动滚动）。触发点：「继续」/「换一个」/认字母自动切题（`renderLetter(true)`/`renderWord(true)`），以及用户直接点击/聚焦识记输入框（`bindStageScrollOnInput(input, glyph, isProgrammatic)`，同时监听 `click` 与 `focus`）。初始化与提交判定不触发。**关键顺序**：先 `input.focus({preventScroll:true})` 锁定光标（`preventScroll:true` 使聚焦不触发浏览器自动滚动），再平滑滚到 `.quiz-stage` 顶端——若先滚动、后聚焦，聚焦的自动滚动会覆盖平滑滚动。程序化聚焦期间置 `letterFocusLock`/`wordFocusLock`，`focus` 监听据此跳过。**`click` 为何必须单独监听**：识记板块初始 `display:none`，初始化时的 `focus()` 对隐藏元素无效（输入框并未持有焦点），首次点击是 `focus`→`click` 各一次（用 `nowMs()` 400ms 去重只滚一次）；用户已聚焦后再次点击不会再派发 `focus`，只能靠 `click`。**移动端补滚**：聚焦后输入法弹出是异步的，系统会按“保持输入框可见”再改写滚动位置并覆盖首次滚动，故在 `MOBILE_RESCROLL_DELAYS`=[400,700,1000]ms 于 `visualViewport` resize 时补滚（`stageReachedTop()` 误差 12px 内视为到位则跳过；一律用平滑滚动避免跳变；`cancelStageScroll()` 在新请求或用户滚轮/拖动时放弃补滚） |
| 转换 textarea | `.convert-textarea`：`--font-cn`、`resize:none`、`overflow:hidden`、`padding:5px 15px`（纵向收到 5px，使单行 17px×1.5≈25.5px 能装进按钮高度）、`min-height:39px`（兜底）、`rows="1"`；`autoGrowTextarea()` 按 `scrollHeight` 自动增高（单行下限取元素当前 `min-height`，`elMinHeight()`：内联 → 计算样式 → 39 兜底），并按 `box-sizing:border-box` 补上 `offsetHeight-clientHeight` 的上下边框，否则末行被裁约 2px；**元素不可见时（`offsetParent===null` 或 `scrollHeight===0`）直接 return，绝不改写高度**——否则会把手输多行后的高度压回单行，切回转换板块时后几行被 `overflow:hidden` 裁掉（`resize` 与 `document.fonts.ready` 都会触发本函数，务必保留这个守卫）；`syncConvertRowHeight()` 运行时测量 `#convert-clear` 的 `offsetHeight` 作为默认高度，保证输入框与右侧按钮等高 |
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

### 2.7 推荐的改动流程（最小可回退）
1. 读 README + docs + 相关源码。
2. 小步修改，一次只改一件事。
3. 校验：`node --check js/app.js`；改词库跑 `verify_wordbank.py`。
4. 浏览器双击 `index.html` 回归主流程。
5. 同步更新受影响文档：根目录 `README.md`（面向用户）与 `docs/REAL_README.md`（技术向）**必须一并更新**，保持二者风格鲜明区别；其余 docs 中受影响部分也要同步。

### 2.8 常见扩展方向（仅供接手者参考，未实施）
- 认单词增加“读音播放”（需引入音频数据或 TTS，注意离线约束）。
- 历史记录支持导出/统计（正确率、难度曲线）。
- 认字母增加大小写对照或首字母猜词。
- 为词库增加更多难度档或自定义难度。
