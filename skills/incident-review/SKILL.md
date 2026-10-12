---
name: incident-review
description: Use when the user wants to be quizzed on their own incident journal — 复习、考考我、抽查、quiz me、test me — to turn written-but-unreviewed entries into tested recall. Pairs with the incident-journal skill.
---

# incident-review

**只写不复习的笔记等于没写。** 这个技能把 journal 里 `status: 需复习` 和 `只见过一次` 的条目变成测试。

## 先定位 journal 根

读根目录的 `.incident-journal.yml`；不存在时用默认值：
`entries` = `topics/`，`review` = `REVIEW.md`，`index` = `README.md`。

## 怎么出题

按这个优先级挑条目：

1. `status: 只见过一次` —— 最可能已经忘了
2. `status: 需复习`，且距离上次复习最久
3. 同一「可迁移判据」有多条实例的，抽一条考迁移

**每次 5–8 题**，混着出。一次全考完没有意义，间隔重复才有用。

## 出题的四条规矩

**1. 考机制，不考结论。**
> ❌ 「`NOASSERTION` 是不是开源？」
> ✅ 「哪些情况下 `spdx_id` 会返回 `NOASSERTION`？为什么不能拿它筛选依赖？」

**2. 优先考「我原来以为」那一段。**
错误信念是这个库的核心资产。考它是为了强化「我当时为什么会想错」。
> ✅ 「你当时看到 `SEC_E_NO_CREDENTIALS`，第一反应是去登录账号。**是什么让你确信问题在 TLS 层而不是网络层？**」

**3. 出变式题，考迁移。**
把判据搬到一个新场景，看能不能用出来。
> ✅ 「你从 `-1` 和 `NOASSERTION` 里总结出『查不到被编码成合法值』。现在一个 API 对未初始化的字段返回 `0`，你怎么判断这是不是同一类问题？」

**4. 答案用 `<details>` 折叠**，先把题全给出，等对方答完再展开。

## 出完题之后

1. 把新题追加到 `review` 文件，按主题分组，题号接着往下排。
2. 对方答对的条目，问他一句：**`status` 要不要升到 `已掌握`？**
   —— 只有本人能改 `status`。答对一次不等于掌握。
3. 对方**答错**的条目，回到条目文件，**给「追问会问什么」补一条**。
   答错说明那里少了一个角度，那是笔记的缺口，不是对方的记性问题。

## 不要做

- 不要在他答完之前给提示
- 不要一次问到底（一次 5–8 题，剩下的下次）
- 不要把题目本身写进条目文件；题目只属于 `review` 文件
