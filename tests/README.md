# 测试（tests/）

本目录存放 RuneLearn 的**离线 Node 测试脚本**（零依赖，不需要浏览器）。

## 运行

在项目根目录（`runelearn/`）执行：

```bat
node tests\smoke_test.js
node tests\ui_behavior_test.js
```

两个脚本都用**最小的 DOM 桩**（`document/window/localStorage/FontFace/setTimeout/URL` 等）在 Node 中加载
`../js/wordbank.js` 与 `../js/app.js`，然后通过派发事件、改写输入值、读取 `textContent/innerHTML/style`
来断言行为；以退出码 0 表示全部通过，非 0 表示有失败。

> 脚本用 `__dirname` 定位 `../js/...`，因此无论从哪里调用都能正确解析资源；
> 但建议在项目根目录运行，便于阅读输出。

## 覆盖范围

| 脚本 | 覆盖内容 |
| --- | --- |
| `smoke_test.js` | 核心逻辑冒烟与对抗：转换舞台 XSS（注入串以**文本**插入、`innerHTML` 从不被设置、字符按序精确还原）、认字母 V/W 判定、认单词难度/解锁、历史记录（含难度列、释义、清空）、非法输入不崩溃（空/符号/emoji/超长/`<script>`）、done 态狂点不重复写历史、localStorage 抛错与损坏值的容错、专家难度连对 5 次解锁。 |
| `ui_behavior_test.js` | 机型相关与滚动行为：**[2]** 电脑显示长 placeholder（“输入字母，回车或点确定”）、手机/平板显示短 placeholder（“输入字母”），认字母/认单词各自正确；**[3]** 初始化不滚动、提交答案本身不滚动（保留判定可见）、点“继续”或“换一个”推进时把题目展示框滚动到屏幕顶端（`smooth` + `start`），认字母与认单词都正确。 |

## 说明

- 桩为了让 `app.js` 能加载，会按 `index.html` 的选择器按需构造元素；
  无法覆盖真实浏览器的排版/字体渲染，那部分需打开 `index.html` 目测。
- 若新增了 DOM id，请同步在桩的 `querySelector` 映射中补齐，否则相关分支会走到兜底值。
