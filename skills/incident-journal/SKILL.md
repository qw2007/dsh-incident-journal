---
name: incident-journal
description: >
  Use when the user wants to start, stop, or flush their engineering journal —
  开始记录 / 停止记录 / 落盘 — or when something worth keeping just happened: a
  belief that was disproven, a technique worth remembering, or a design stance
  and the constraints that make it right. 当你发现「我原来以为是 X，实测是 Y」、
  或遇到值得记下的技术点 / 思想风格时使用。
---

# incident-journal

把值得留的东西沉成**可复习**的条目。三类：

| kind | 收什么 | 硬筛子（反事实） |
|---|---|---|
| `坑` | 一个被推翻的判断 | **我原来以为**什么，凭什么 |
| `技术点` | 一个值得留下的做法 | **没有它我会怎么做**，错在哪 |
| `思想风格` | 一个设计立场 | 它在**什么约束下**是对的，换什么条件不成立 |

**三类共用的唯一铁律：每条必须有一个反事实。** 没有反事实的条目 = 摘抄，不要写。

## 第一步：检查状态（每次先做）

读 `~/.dsh/incident-journal.yml`：

| 情况 | 动作 |
|---|---|
| 文件不存在，或没有 `journal_root` | 问用户库路径（**只问这一次**），写回文件 |
| 当前工作区不在 `active_workspaces` | **什么都不做**，只回一句「（journal 未启动，这次没记）」 |
| 在列表里 | 继续 |

**例外**：用户明确说「开始记录 / 停止记录 / 落盘」时，直接执行对应动作，不看 `active`。

```yaml
# ~/.dsh/incident-journal.yml
journal_root: D:\DSh\offer
active_workspaces:
  - D:\DSh\work-AS-team
```

## 第二步：确认够格

按 `references/qualifying.md` 判。不够格就不写 —— **那个文件的用处就是把大部分东西挡在外面**。

## 第三步：写条目

按 `references/skeleton.md` 落到 `<库根>/<项目名>/<kind 目录>/<slug>.md`。
完整范例见 `references/examples/`。

写之前，拿条目的关键词 grep 一遍 `<库根>/资料/`；命中就在条目里加 `## 与资料的关联` 一节。

**写到 `<工作区>/.incident-journal-staging/`，不要直接写库根。** 库根在工作区之外，每写一个文件都要一次越权批准；暂存目录在工作区内，一次会话结束时 flush 一次即可。

## 第四步：同步三处索引

漏任一处等于没收录：

- `<库根>/README.md` 加一行指针
- `<库根>/career.log` 加一行 `日期 | 事件 | 证据`
- `<库根>/REVIEW.md` 加 1–2 道自测题（答案用 `<details>` 折叠）

## 库的固定布局

```
<库根>/
  资料/                        外部参考资料（面经、文档）
  <项目名>/
    坑/  技术点/  思想风格/
  README.md   career.log   REVIEW.md
```

布局是固定的，**不要为它造配置文件**。

## 铁律

- 每个数字标 `[实测]` / `[推算]` / `[资料]`；**没标的视为不可信**。
- **保留报错原文、命令、输出尾部。** 三个月后你要的是原文，不是你的转述。
- 写「我**凭什么**信了那个错答案」。错得有道理才值得记，手滑不值得。
- 源码位置一律写成 `repo @ commit · path:符号名`，**符号名稳定、行号不稳定**。
- 条目里绝不出现真实 Key、token、账号、内网地址。
- 判据是「三个月后的自己能否看懂并复现」，不是「读起来漂亮」。

## 写完自检

- [ ] 反事实段真的有一个反事实（不是「我不小心」）
- [ ] 至少一个 `[实测]` 数字，或有明确证据路径
- [ ] 有可迁移判据 —— 换个项目还会遇到同一个模式吗
- [ ] 源码位置写了符号名，不只有行号
- [ ] 三处索引都动了
- [ ] 没有凭据泄漏
