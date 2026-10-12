---
name: incident-journal
description: Use when a belief you acted on has just been disproven — a fix that did not work for the reason you assumed, an assumption a measurement overturned, a tradeoff you would decide differently now — to capture it as a durable, reviewable journal entry before the details are lost. 当你发现「我原来以为是 X，实测是 Y」时使用。
---

# incident-journal

把「**我原来以为是 X，实测是 Y，所以改成 Z**」沉淀成一条可复习的条目。

记流水账没有价值。**没有 `wrong_belief` 的条目不要写。**

## 什么时候触发

刚发生下面任意一件事：

- 一个修复试了没生效，或者生效的原因和你以为的不一样
- 一次测量、日志或报错推翻了你之前写下的判断
- 你刚说出口「原来是……」，而且这句话让你改了做法
- 一个取舍（选 A 不选 B）你现在会给不同答案

**不触发**：语法错误、装环境的琐事、抄来的标准做法、没有数字的「最佳实践」。

四条资格规则和「明确不收」清单见 `references/qualifying.md`。

## 三步

1. **先定位 journal 根。** 读根目录下的 `.incident-journal.yml`。文件不存在时用默认值：

   | 键 | 默认值 | 作用 |
   |---|---|---|
   | `entries` | `topics/` | 条目目录 |
   | `index` | `README.md` | 索引（一行一个指针） |
   | `timeline` | `career.log` | 时间线（一行一个事件） |
   | `review` | `REVIEW.md` | 自测题 |

2. **写条目。** 按 `references/skeleton.md` 的骨架落到 `<entries>/<slug>.md`。
   完整范例见 `references/examples/`。

3. **同步三处索引。** 漏任一处等于没收录：
   - 索引文件加一行指针
   - 时间线文件加一行 `日期 | 事件 | 证据`
   - 复习文件加 1–2 道自测题（答案用 `<details>` 折叠）

## 铁律

- 每个数字标 `[实测]` 或 `[推算]`；**没标的视为不可信**。
- **保留报错原文、命令、输出尾部。** 三个月后你需要的是原文，不是你的转述。
- 写明「我当时**凭什么**信了那个错答案」。错得有道理才值得记，手滑不值得。
- 条目里绝不出现真实 Key、token、账号、内网地址。
- 判断标准是「三个月后的自己能否看懂并复现」，不是「读起来漂亮」。

## 写完自检

- [ ] `wrong_belief` 段写了「我原来以为」，不是「我不小心」
- [ ] 至少有一个 `[实测]` 数字，或有明确证据路径
- [ ] 有「可迁移判据」——换个项目还会遇到同一个模式吗
- [ ] 三处索引都动了
- [ ] 没有凭据泄漏
