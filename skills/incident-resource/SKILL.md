---
name: incident-resource
description: >
  Use when the user hands over outside material to keep — 资料、面经、别人的文章、
  官方文档摘录、任何我无法验证的二手信息 — so it lands in the journal with its
  provenance intact, instead of drifting into something that looks like my own
  finding. Explicit form: /incident-resource <file>. Pairs with the
  incident-journal skill.
---

# incident-resource

把**别人说的东西**收进 `<库根>/<资料>/`。

它和 `incident-journal` 各管一头：那个写我**实测**到的，这个收我**没验证过**的。两类东西绝不混着放 —— 混在一起之后，「资料说 X」会慢慢变成「X」，而这是这个库里最贵的错误：**带出处的错误比没出处的更可信。**

## 先定位库

读 `~/.dsh/incident-journal.yml` 拿 `journal_root`。
文件不存在或没有 `journal_root` → 让用户先跑一次 `incident-journal` 指定库，然后停在这里。

材料落在 `<库根>/<资料>/`，索引是 `<库根>/<资料>/README.md`。实际目录名看 `<库根>/.layout.yml` 的 `dirs:`（不存在 = 用默认名）。

显式调用（`/incident-resource <文件>`）等于用户亲口说要收，**不看 `active_workspaces`**。

## 第一步：先要出处，要不到就拒收

| 要什么 | 例子 |
|---|---|
| 来源 | URL；或「某人 / 某场面试 / 某本书第几章」 |
| 日期 | 什么时候拿到的 |
| 类型 | 面经 / 官方文档 / 第三方文章 / 我自己的旧笔记 |

**来源拿不到就拒收**，并说清缺哪一样。不要「先收下来以后再补」—— 补不上的，而一份查不到出处的材料会在库里慢慢变成事实。

## 第二步：查重，加厚优先

拿材料的**来源**和**标题关键词** grep 一遍 `<库根>/<资料>/`。

| 情况 | 动作 |
|---|---|
| 同一个来源已经有文件 | **加厚**：补进那个文件，标日期，不新建 |
| 不同来源、讲同一件事 | **不合并。** 两份都留 —— 它们可能互相矛盾，而矛盾本身是信息 |
| 新来源、新话题 | 新建 `<库根>/<资料>/<slug>.md` |

## 第三步：写材料文件

落点是 `<库根>/<资料>/<slug>.md`（**实际写进暂存目录，见下**）。slug 用小写英文或拼音 + 连字符，**不用中文文件名**。

```markdown
# <材料标题>

- 来源：<URL 或 出处>
- 日期：<YYYY-MM-DD>
- 类型：<面经 / 官方文档 / 第三方文章>

## 要点

<这份材料说了什么。照抄它的话。>

## 与我的实测的关联

<可选。已经和库里条目对过的地方：哪一条一致、哪一条矛盾。>
```

**照抄，不要润色。** 润色是这里唯一不可逆的污染：改过语气的二手材料，以后没人分得清哪句是原作者说的、哪句是我加的。

**落到 `<工作区>/.incident-journal-staging/<资料>/<slug>.md`，不要直接写库根。** 库根在工作区之外，写一个文件就要一次越权批准；暂存目录在工作区内，写多少都免费。暂存目录是**库根的影子**（路径与库根里的相对路径一一对应），用户说「落盘」时一次搬完 —— **授权按调用计、不按文件计**，所以永远是一条命令，不是每文件一次：

```powershell
$stage = '<工作区>\.incident-journal-staging'
$root  = '<库根>'
Copy-Item -Path (Join-Path $stage '*') -Destination $root -Recurse -Force
Remove-Item -LiteralPath $stage -Recurse -Force
'--- 库根现在有什么 ---'
Get-ChildItem -LiteralPath $root -Recurse -File | ForEach-Object { $_.FullName }
```

**回读再收工**：最后一段列出来的东西里要能看到刚搬过去的材料，看不到就是没落。（`incident-journal` 的 `## 落盘` 说的是同一条命令。）

## 第四步：更新索引

`<库根>/<资料>/README.md` 的表格加一行 —— **改的是暂存目录里的那一份**，先把读到的 `<库根>/<资料>/README.md` 复制进 `<工作区>/.incident-journal-staging/<资料>/README.md` 再改（读库根不需要批准）：

```
| <材料标题> | [<slug>.md](<slug>.md) | <来源简写> | <YYYY-MM-DD> |
```

**表格还不存在就建表头**（新库的 `<资料>/README.md` 是散文 + 一句「目前为空」，把那句换掉）。

## 第五步：报一句它和谁对得上

拿材料的关键词 grep 一遍 `<库根>/<技术点>/`、`<库根>/<思想风格>/`、`<库根>/<各项目>/<坑>/`，**只报不改**：

> 这份材料对得上 `xxx.md` 和 `yyy.md` —— 一致还是冲突？要不要在那些条目里补一节 `## 与资料的关联`？

改条目是 `incident-journal` 的活。这个技能不碰它们 —— 一个技能只写自己那一种东西，是这套东西能一直干净的原因。

## 不要做

- 不要把材料写成 `坑` / `技术点` / `思想风格` —— 那些是我的实测，这是别人的话
- 不要在材料文件里下结论；写「材料说 X」，不写「X」
- 不要合并互相矛盾的来源
- 不要覆盖已有材料文件；加厚是追加
- 不要把材料里的数字当 `[实测]`
- 不要收真实 Key、token、账号、内网地址
