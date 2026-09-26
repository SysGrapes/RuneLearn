# RuneLearn · 对抗测试报告（Adversarial Test Report）

> 本文档记录对 RuneLearn 纯前端应用进行的对抗性测试（漏洞/健壮性/逻辑/安全/观感）的范围、方法、结论与已修复问题。
>
> 适用范围：当前 `runelearn/` 目录下的 `index.html`、`css/style.css`、`js/app.js`、`js/wordbank.js`。

---

## 1. 范围与目标

围绕以下硬性约束展开对抗测试：

- 任何非法输入（空、非字母、数字、符号、中文、emoji、超长、零宽字符、换行、HTML 注入串等）都**不得导致页面崩溃**；
- 所有用户输入必须经转义 / `textContent` / 逐字符 span 构建，**防 XSS**；
- localStorage 损坏 / 写满 / 抛异常、词库脚本缺失、某难度缺失都不得崩溃；
- 作答状态机（done 防重复判定、认字母 2.5s 自动切题、认单词不自动切题）行为正确；
- V/W 判定、历史字段、文案一致性、字号/描边/换行/字形切换等本轮迭代功能正确。

## 2. 方法

1. **静态源码审查**：逐文件通读 `js/app.js`（约 810 行）、`index.html`、`css/style.css`，逐点核对 XSS 注入点、localStorage 异常、词库缺失、V/W 边界、状态机、动态字号、字符级字体、导出逻辑。
2. **Node DOM 桩回归测试**：构造最小 `document/window/localStorage/FontFace/setTimeout/URL` 桩，`eval` 读入 `js/wordbank.js` 后 `require('./js/app.js')`，再通过桩 `fire` 事件、改写 `input.value`、检查 `textContent/innerHTML/style` 来触发并断言各种场景，跑完删除临时脚本。
3. **语法校验**：`node --check js/app.js`、`node --check js/wordbank.js`。

> 说明：最初的对抗测试任务原计划由独立子代理执行，但因运行环境网络反复中断，子代理连续多次在“读文件阶段”失败；为保证结论，对抗测试改由主代理按上述同一套维度与方法完成。独立审计子代理随后另行做了最终把关（见第 6 节）。

## 3. 各维度核对结论

| # | 维度 | 结论 |
| --- | --- | --- |
| 1 | 非法/边界输入（空/符号/中文/emoji/超长/零宽/换行/HTML注入） | ✅ 通过：各输入框均有 `normalizeInput` + `onlyAtoZ` + 长度守卫，非法输入只提示不崩溃 |
| 2 | XSS / 注入 | ✅ 通过：转换 stage 用逐字符 `textContent` 写 span；判定/历史/meta 均经 `escapeHtml`；`title` 属性也转义 |
| 3 | localStorage 异常（抛错/非数组/null/损坏） | ✅ 通过：`storeGet/storeSet` 均 try/catch；初始化用 `Array.isArray` 守卫 |
| 4 | 词库异常（缺失/难度缺失/空数组/缺 senses/ph） | ✅ 通过：`renderWord`、`setDiff` 均校验 `!WKB || !WKB[key] || !length`；初始化给出提示 |
| 5 | V/W 边界 | ✅ 通过：`isVW(up)` 对 V/W 均判对；答案“V 或 W”；历史答案列一般字形 |
| 6 | 状态机（done 防重复、定时器不叠加、认单词不自动切题） | ✅ 通过：均有 `done` 分支；`clearTimeout` 后再排定时器；认单词已移除自动切题 |
| 7 | 动态字号 `computeGlyphFontSize`（超长/emoji/canvas不可用/parentNode为null） | ✅ 通过：均有回退（默认 560 可用宽 / 直接返回 base） |
| 8 | CSS 观感（`.verdict` 标签不被多行拉高、user-select、16px、两列 grid、page 宽度阈值、placeholder 防溢出） | ✅ 通过：`.tag` 已 `align-self:flex-start`；题目区 `user-select:none`；历史统一 16px；宽屏两列仅在 ≥920px；page 宽度阈值仅在 ≥1360px |
| 9 | 文案一致性（无“Rune 字体/字形”残留、认字母历史无“难度”列、认单词历史有“难度”列） | ✅ 通过 |
| 10 | 转换控件缺失时 updateConvert / 导出 | ⚠️ 原存在 P3 问题 → 已修复（见第 4 节），修复后通过缺失元素抗性测试 |

## 4. 发现的问题

### P3-1 / P3-2 / P3-3：转换控件取值缺少空值守卫（已修复）

- **现象**：`updateConvert()` 与导出按钮处理器中直接读取 `convSize.value` / `convStroke.value` / `convColor.value` / `convStrokeColor.value`。若对应 DOM 元素从页面缺失，`xxx.value` 会抛 `TypeError` 导致崩溃。
- **影响**：当前静态 `index.html` 中这些元素均存在，故不触发；但违背“元素/控件缺失不得崩溃”的健壮性要求，属潜在缺陷。
- **修复**：新增 `inputVal(el, fallback)` 安全取值工具，替换 `updateConvert()` 与导出处理器对上述控件的读取，缺失时回退到默认值（描边 0、字号 64、颜色 `#2f3a4d`/`#7d6b3a`）。
- **验证**：专门的“缺失控件抗性测试”（`#convert-size/#convert-stroke/#convert-color/#convert-stroke-color` 全部返回 null）通过——触发输入与导出均不崩溃，认字母/认单词逻辑也正常。

### 其余
- 未发现 P1（严重）与 P2（中等）问题。
- 若干可观察点（代码注释中的英文 “rune/rune 字形”、导出下载文件名 `luokenwen-*.png`）均为非用户可见/非问题。

## 5. 回归测试要点（通过）

- 认字母：提交→按钮变“继续”→自动定时器存在；重复点/回车只切题不重复判定。
- 认单词：提交→按钮变“继续”→**无自动切题定时器**；“继续”切到下一题并复原“确定”。
- 历史：最新行带 `flash-ok`/`flash-no`；正确答案列一般字形 + `title` 释义；统一 16px。
- 转换：字符级字体（洛克文模式英文字母 `rune-ch`、数字/汉字 `cn-ch`；正常模式全 `cn-ch`）；字号拉杆生效；输入换行拆为含 `\n` 的 span（`pre-wrap` 渲染）；XSS 注入串不崩溃。
- 缺失控件、缺失词库、损坏 localStorage、超长/emoji 输入：均不崩溃。
- `node --check js/app.js`、`node --check js/wordbank.js`：通过；`index.html` div 开闭平衡（33/33）。

## 6. 独立审计结论

经独立审计子代理对 `index.html / css/style.css / js/app.js / js/wordbank.js` 的只读复核（含 `node --check` 语法、ID 交叉引用、HTML 标签平衡、词库结构），结论为：**可交付**。未发现 P1/P2 阻塞项，所抽查的规则清单全部通过。

审计另提出 3 个非阻塞 P3，处理如下：

| 编号 | 问题 | 处理 |
| --- | --- | --- |
| P3-1 | 历史容器 div 同名 `history-table` 与内部表格类名嵌套（纯整洁性） | 保留原样（功能与观感正常；改动有轻微回归风险，按“逐步小步”原则不冒险） |
| P3-2 | 导出只判 `!text`，纯空格/纯换行可导出“空图” | **已修复**：导出改为 `if (!text || !text.trim())` 并提示“空白无法导出”，经桩测试验证 |
| P3-3 | 认字母 done 后 2.5s 定时器跨板块切换仍推进（无害） | 保留原样（非问题） |

## 7. 已知限制

- 纯 CSS/观感类问题（如 `.verdict` 标签高度、两列对齐、placeholder 是否溢出）主要通过静态阅读与上下文判断，未做真实浏览器截图比对。
- Rune/中文字体的真实渲染效果（如字形裁切肉眼观感、字符级字体混排观感）依赖在浏览器中打开 `index.html` 目测复核。

## 8. 后续微调（第三轮补充）

交付后的追加打磨（均已回归验证、并入第三轮记录）：

- **转换输入框字体**：输入文字与 placeholder 由默认无衬线改回敦敦体（`--font-cn`）。
- **转换输入框随行数增高**：textarea 用 `autoGrowTextarea` 按内容行数自动长高（手机端无需内部滚动）。
- **字母/单词输入框统一**：认字母与认单词输入框高度一致（52px）、placeholder 字距一致；正文对齐差异保留。
- **品牌颜色统一**：RuneLearn 标题两种字形（rune/原文）颜色统一为 `#2e2a26`。
- **网站 favicon**：新增 `favicon.png`（rune 字形 R、色 `#2e2a26`）并在 `<head>` 引用；经像素统计验证字形居中、非空白。
