---
name: incident-audit
description: Use when the user asks to audit or clean up their incident journal — 审一遍笔记、找出该记没记的坑、journal 体检、哪些条目退化了 — to find entries that have rotted and incidents that were never written down.
---

# incident-audit

journal 的失败模式不是「写错」，是**静默退化**：数字过期、status 虚高、同一类错误反复出现却没人发现。

这个技能扫一遍，只报告，**不自动改**。

## 先定位 journal 根

读 `.incident-journal.yml`；不存在时用 `entries` = `topics/`，`index` = `README.md`，`timeline` = `career.log`，`review` = `REVIEW.md`。

## 五项检查

### 1. 索引三联动是否完整

条目文件是否存在但**没进索引**？时间线是否缺行？`review` 文件里是否没有任何题指向它？

**漏一处等于没收录** —— 这个库的价值一半在索引，因为索引是复习的入口。

### 2. 有没有 `wrong_belief`

扫每个条目有没有「我原来以为」段。缺的就是**流水账**，按主技能 `incident-journal` 的资格规则应该删掉或重写。

同时检查那一段是不是只写了 A 没写 B（「我以为 X」而没有「因为 Y」）—— 只写结论的 `wrong_belief` 等于没写。

### 3. 数字是否退化

- 标了 `[推算]` 但后来实际跑过的 → 应该升级为 `[实测]`，补证据
- 标了 `[实测]` 但**没有命令或输出** → 降级，或补证据
- 数字**明显过期**（依赖的版本、外部服务的字段、价格） → 标记为待复核

### 4. 重复模式

把条目按「可迁移判据」聚类。**同一判据出现 3 次以上，说明规则没写清楚**，那不是三个 bug，是**一个规则的 bug**。建议把三条合并成一条，并新建一节写「为什么反复出现」。

### 5. 该记没记的坑

这是唯一需要推断的一项。看：

- `git log` 里 `fix` / `revert` / `hotfix` 类的提交，有没有对应的条目
- 时间线（`career.log`）里的事件，有没有引用了不存在的条目编号
- **本次会话里**是否发生过「判断被推翻」但没落盘的时刻

对第 2 条：时间线引用的 `of-NNNN` 编号必须在条目的正文里真的存在，否则就是断链。

## 输出格式

按严重度排序，每条一行：

```
[断链]   career.log:18 引用 of-0007，但没有任何条目定义它
[流水账] topics/foo.md 缺「我原来以为」
[退化]   topics/bar.md 标 [实测] 但无证据；标 [推算] 的 3 处已实际跑过
[重复]   a.md / b.md / c.md 共享同一判据「查不到被编码成合法值」→ 建议合并
[缺记]   commit abc1234 (revert: ...) 没有对应条目
[过期]   topics/baz.md 引用的外部 API 字段名可能已变更（2026-04 核验）
```

最后给一句总结：**库现在能不能用**（索引完整 / 有多少条需要动手）。

## 不要做

- 不要自动改文件。报告完等对方决定。
- 不要把「条目写得短」当成问题。短而准 > 长而全。
- 不要因为 status 是 `已掌握` 就跳过检查 —— 虚高的 status 恰恰是退化最常见的表现，抽查 2–3 条，让对方当场复述。
