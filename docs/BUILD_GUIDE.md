# RuneLearn 构建指南（面向零基础，可逐步复现）

这份文档用**最具体的步骤**说明「RuneLearn」这个纯前端网站是如何一步步建出来的：用到了哪些字体、哪些数据、这些数据是怎么创建/精制出来的、脚本参数是什么。即使你从未写过代码，按顺序照做也能在本地复现出一个功能一致的网站。

> 本指南面向「从零复现」。若你只想**使用**现成的网站，直接双击 `index.html` 即可，与本文档无关。

---

## 0. 一句话概述

本项目 = 一个 HTML 页面 + 一份 CSS + 两份 JS（应用逻辑 + 单词库）+ 两个字体文件。
其中**单词库**不是手写的，而是从开源英汉词典 `ECDICT` 的 CSV 数据里，用 Python 脚本按难度规则筛选、精制、校验后自动生成的。

---

## 1. 准备工具与原料

### 1.1 需要安装的软件
- **Python 3.10+**（用于生成词库；本机验证时用 3.10.11 通过）
- **现代浏览器**（Chrome / Edge / Firefox 任一即可，用于运行页面）
- （可选）**Node.js** 用于校验 JS 语法（不装也不影响生成；本机用 v24.9.0 验证）

### 1.2 需要准备的字体（共 2 个）
1. **Rune 字体**（英文字母的“符文”字形）——你在工作区里提供的 `RUNEREGULAR.ttf`。
2. **中文美术字体**（页面中文显示，风格与 Roco 官网一致）——你提供的 `MIANFEIZITI (1).ttf`，其字体族名为 `244-SSDunDunTi`。

### 1.3 需要准备的数据源
- **ECDICT**：一个开源、免费的英汉词典数据库，GitHub 仓库：<https://github.com/skywind3000/ECDICT>。
- 本项目使用的输入文件是它导出的 `ecdict.csv`（约 66 MB），按该仓库许可（MIT 类）使用。

> 你无需联网下载它；如果你只想了解“数据是怎么来的”，下面会讲。若要完全复现词库生成，需要这份 CSV（后文第 4 步给出获取方式）。

---

## 2. 建立项目骨架（目录结构）

在工作区里建一个文件夹 `runelearn`，内部按下述结构规划（用文件管理器建文件夹即可）：

```
runelearn/
├── index.html          # 主页面（之后写）
├── css/
│   └── style.css       # 样式（之后写）
├── js/
│   ├── app.js          # 应用逻辑（之后写）
│   └── wordbank.js     # 单词库（脚本自动生成）
├── fonts/
│   ├── Rune-Regular.ttf
│   └── SSDunDun-CN.ttf
├── build_wordbank.py   # 词库生成脚本（之后写/直接使用）
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

- `lang="zh-CN"`、`charset="UTF-8"`、`viewport`。
- 顶部的**两个大板块按钮**，用 `data-main="convert"` / `data-main="recognize"` 区分；对应两个 `<section class="panel">`。
- 识记板块内部再放**两个子板块按钮**，用 `data-sub="letter"` / `data-sub="word"` 区分；对应两个 `<div class="subpanel">`。
- `<认单词>` 子板块里放 4 个难度按钮，用 `data-diff="easy|med|hard|expert"` 区分；“专家”按钮初始带 `class="locked hidden" disabled`（未解锁前隐藏）。
- 页面底部依次用 `<script src="js/wordbank.js">` 然后 `<script src="js/app.js">` 引入（**顺序不能反**：先有词库全局变量，app.js 才能读到）。

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

## 6. 写应用逻辑：`js/app.js`

app.js 是一个自执行函数（IIFE），在页面加载完、`wordbank.js` 之后执行。它做的事情：

1. **工具函数**：选择器、HTML 转义（防 XSS）、localStorage 安全读写、输入规范化（去空白、全角转半角、转小写）、随机“不重复”下标、时间格式化、判断 V/W。
2. **板块/子板块切换**：点击顶部按钮切换 `.panel.active`；点击子板块按钮切换 `.subpanel.active`；切换动画由 CSS 负责。
3. **【转换】实时显示**：监听输入框 `input`，把文本用 `textContent` 写入符文区（天然防注入）；颜色/描边控件变化时同步更新样式。
4. **【转换】导出透明 PNG**：用 `new FontFace("RuneCanvas", url("fonts/Rune-Regular.ttf"))` 确保 canvas 用同一个 Rune 字体 → 用 `canvas.getContext('2d')` 量字宽 → 分行以避免过宽 → 透明背景上画文字（需要描边再 `strokeText`）→ `canvas.toBlob` 得到 PNG → 生成 `<a download>` 触发下载。
5. **【认字母】**：随机取 26 个字母之一作为 `current`；若取到 V 或 W，`isVW=true`，判对错时 `V` 和 `W` 都算正确，正确答案显示为“V 或 W”；写入历史（无“难度”字段）并渲染。
6. **【认单词】**：按当前难度从词库随机取一个词显示符文；用户输入判对错；对时/错时展示正确答案、读音、词性+中文释义；写入历史（含“难度”字段）。
7. **专家解锁**：仅当难度是 hard 或 expert 时累计连击；答对 `streak+1`、答错清零；`streak>=5` 时把 `localStorage` 的解锁标记置真并显示“专家”按钮。
8. **初始化**：从 localStorage 读回历史、按当前锁定状态刷新专家按钮、渲染初始字母与单词。

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
6. 写 `js/app.js`（第 6 步）。
7. 运行 `python verify_wordbank.py` 校验词库。
8. （可选）`node --check js/app.js` 校验 JS 语法。
9. 双击 `index.html`，在浏览器里逐项测试：
   - 两大板块切换正常；识记内两个子板块切换正常。
   - **认字母**：作答后（无论对错）按钮变「继续」，2.5 秒后自动切下一题；已判定后再点或按回车只切题、不重复判定；V/W 均算对且答案显示“V 或 W”；输入框聚焦时提示立即消失；题目字形不可复制。
   - **认单词**：各难度含解锁；困难连对 5 次解锁“专家”（进度不显示，解锁才提示）；判定处音标为一般无衬线、每个词性单独一行；历史“正确答案”悬停可看释义。
   - **转换**：控件顺序为 字形颜色→描边颜色→描边粗细→字形(正常/洛克文)→导出；可切换“正常/洛克文”字形；描边为向外描边；导出透明 PNG。
   - 关闭再打开历史仍在；可清空历史。
10. 交付：把整个 `runelearn/` 文件夹打包即可分享；也可推到 GitHub Pages。

---

## 9. 关于 `ecdict.csv` 的获取与许可

- 数据来源：<https://github.com/skywind3000/ECDICT>（开源免费英汉词典库）。
- 在仓库里可找到 `ecdict.csv` 或从发布页/直链下载约 66MB 的 CSV 放到本项目根目录（`build_wordbank.py` 顶部 `ECDICT` 路径指向它）。
- 使用前请查看该仓库的许可证；本项目仅用了 `word/phonetic/translation/collins/tag/frq` 等字段，并做了常用度过滤与派生词清理。
- 由于 CSV 体积大且只用于生成，生成完 `wordbank.js` 后**不需要把它打进分享包**（本项目交付包里已删除 `ecdict.csv`，只保留生成脚本与校验脚本，说明数据出处）。

---

## 10. 常见问题（FAQ）

- **为什么要用 JS 全局变量存词库而不是 JSON + fetch？** 因为双击打开是 `file://` 协议，浏览器对本地文件的 `fetch` 会拦截（跨域）；用 `<script>` 引入 JS 全局变量则没有任何网络/跨域问题，也能直接部署到 GitHub Pages。
- **V 和 W 为什么特殊？** 本项目用的 Rune 字体里 `V` 与 `W`（大小写不care）字形显示相同，所以「认字母」里二者都算对、答案显示“V 或 W”；「认单词」因为答案是整词，靠用户自行辨别，不特殊处理（这也是难度提升点之一）。
- **为什么专家难度没有很多同时含 V 和 W 的词？** 英语里 12 个字母以上且同时含 v、w、又是常用词的词本来就极少（如 `overwhelming`），规则允许“没有也可以”，故以常用度优先。
- **我改了词库想重新生成怎么办？** 改 `build_wordbank.py` 的参数或拿新的 `ecdict.csv` 重跑它即可，再运行 `verify_wordbank.py` 复核。
