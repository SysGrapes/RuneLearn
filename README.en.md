# RuneLearn · Learn & Convert the Roco Script

[简体中文](README.md) · [繁體中文](README.zh-Hant.md) · **English** · [日本語](README.ja.md)

[Use RuneLearn online](https://sysgrapes.github.io/RuneLearn/)

Welcome to **RuneLearn** — a fun little tool that helps you learn the Roco Script with ease.

Here, English letters are displayed in a unique "Roco" typeface. You can use it as a small text-conversion app, or as a playful way to memorize vocabulary — though the results are probably nothing special. Everything runs fully offline: just open it and go, no internet required.

## What it does

RuneLearn has two main sections, switchable from the top of the page:

### 1. Roco Converter

Turn the English text you type into good-looking "Roco" glyphs, with customizable style:

- The conversion is shown live below as you type, and supports multiple lines;
- Freely adjust the **glyph color**, **outline color** and **outline width**;
- Switch back to the "Normal" glyph anytime to compare plain text with the Roco Script;
- Export a **transparent-background PNG** in one click — handy for saving, sharing or illustrating.

### 2. Roco Practice

Turn learning into a game: look, guess, memorize and practice. It contains two sub-sections:

- **Letters**: a random Roco letter appears, and you type the English letter it stands for. Upper or lower case both work, and you get instant feedback.
- **Words**: pick a difficulty, then a random Roco word appears and you spell out the English word. Besides checking your answer, it shows the word's **pronunciation, part of speech and Chinese definitions** to help you truly remember it.

Both quizzes feel smooth:

- Submit by clicking "Submit" or just pressing Enter — you see the result immediately;
- Want another question? Hit "Continue" (or "Another") to move on;
- When you answer, the newest history entry flashes in color, so you can see at a glance how you did.

## A few design notes

- **Four interface languages**: Simplified Chinese, Traditional Chinese, English and Japanese. On your first visit, a language picker pops up — pick one and it takes effect instantly and never bothers you again; to switch later, use the bottom of the page at any time. You can also open a language-specific link directly — the main address plus /zh/, /zh-hant/, /en/ or /ja/ — to land right in that language.
- **Each language gets its own typeface**: Simplified Chinese and English use the DunDun typeface, Traditional Chinese uses common Taiwanese sans-serifs, and Japanese uses common Japanese sans-serifs (such as Noto Sans JP), with graceful fallbacks to system fonts. In the first-visit dialog — where all four languages appear together — each segment is rendered in its own typeface too.
- **V and W look the same**: in this typeface V and W are visually identical, so in **Letters** either one counts as correct when you meet them — no need to agonize. But in **Words** you'll still want to watch out.
- **Words come in difficulties**: the Words section offers several levels from easy to hard, moving gradually from short words to longer, more challenging ones.
- **History stays on your device**: every answer is saved locally; close the page and it's still there next time. Letters and Words keep separate histories, and you can clear either with one click.

## Getting started

Take the whole `runelearn` folder and simply double-click `index.html` — no installation, no internet needed. You can also zip the folder and share it with friends to play together, or visit the GitHub Pages version.

You can also [click here](https://sysgrapes.github.io/RuneLearn/) to use it online.

---

This project and its documentation were mostly developed or written by Deepseek V4 Flash, but if you run into problems using the site, issues are still welcome. This is a fan-made project, not affiliated with the official site. Last but not least, enjoy!
