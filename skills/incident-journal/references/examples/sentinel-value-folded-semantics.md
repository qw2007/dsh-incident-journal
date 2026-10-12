# 把「查不到」编码成一个合法值的字段，不能用来做决策

`status: 需复习`

`of-0002`

## 现象

用 `IndexOf` 在文件里找一行锚点，然后在它后面插一行新内容。结果**新行跑到了文件开头，而且没有任何报错**。

```powershell
$idx = $text.IndexOf('| some anchor |')
$text = $text.Insert($idx + 1, $newLine)   # 期望插到锚点后面
```

同一周，在另一件事上又撞到同一个形状：

```powershell
gh api repos/foo/bar --jq .license.spdx_id
# NOASSERTION
```

我把它读成「自定义 license，但大致开源」，于是在「优先使用开源组件」的规则下**直接跳过了核实**。

## 我原来以为

- 插入位置不对 = 插入函数用错了，或者行尾符有问题。
- `NOASSERTION` = GitHub 的识别器没认出来，估计是个少见的自定义 license。

两个推断都自然，两个都错在同一个地方。

## 真正的原因

**两个上游函数都用同一个合法值表示「查不到」：**

| 上游 | 表示「查不到」的值 | 下游怎么用 | 结果 |
|---|---|---|---|
| `String.IndexOf` | `-1` | `-1 + 1 = 0` | 索引 `0` 是**合法的**，静默插到开头 |
| GitHub `license.spdx_id` | `NOASSERTION` | 读成「自定义但开源」 | 这是个**看起来很合理的结论**，静默跳过核实 |

两个都不抛异常，因为下游拿到的都是一个**类型正确、范围合法的值**。

而 `NOASSERTION` 这个「垃圾桶」里，至少装着四种互不相同的东西：

| 类型 | 例子形态 | 实际含义 |
|---|---|---|
| 混合结构 | 核心 MIT + `enterprise/` 目录另授权 | 用核心部分没问题 |
| **源码公开但非开源** | Sustainable Use License、Elastic License 2.0 | **不能当开源组件用** |
| 完全自定义条款 | 项目自定的 Responsible AI 类许可 | 必须逐条读 |
| 正在迁移 | LICENSE 里两套并存 | 按文件判断 |

**同一批次的实测结果：10 个 `NOASSERTION` 里，结论从「完全可以依赖」横跨到「根本不是开源」。** 用这个字段筛选等于没筛。

## 怎么定位的

1. 看到「结果完全不对但没报错」这个组合，先怀疑**上游的值算错了**，而不是盯着下游的函数看。
2. 对 `-1`：把中间值打出来（`$idx` 是 `-1`），一眼就定位。
3. 对 `NOASSERTION`：读**原始数据**，不要停在外层字段上 —— `gh api repos/<o>/<r>/license` 拿 LICENSE 原文，看前三行。出现 `Portions of this software...` 就说明这个仓库不是一个许可单位。

## 修法

```powershell
# 1. 查不到就停下，不要继续算
if ($idx -lt 0) { throw "anchor not found in $path" }
$text = $text.Insert($idx + $newLine.Length, $newLine)
```

```bash
# 2. 枚举字段出现哨兵值时，回去看原始数据
gh api repos/<owner>/<repo>/license -H "Accept: application/vnd.github.raw"
```

## 数字证据

- `IndexOf` 返回 `-1`，`-1 + 1 = 0`，索引 `0` 合法 → 无异常 `[实测]`
- 24 个仓库核验：10 个 `spdx_id = NOASSERTION`，其中 3 个并非开源 `[实测]`
- `openai/mle-bench` 的 `NOASSERTION` 实为 MIT；`n8n-io/n8n` 的 `NOASSERTION` 实为 Sustainable Use License `[实测]`

## 一句话怎么讲

**当一个字段把多种语义折叠成一个值时，它就不能用于决策。** 看到 `OTHER` / `UNKNOWN` / `NONE` / `NOASSERTION` / `-1` / `null` 这类值，**不要继续往下算**，回去看原始数据。

`-1` 和 `NOASSERTION` 是同一个 bug 的两次出现：都把**「无法确定」编码成了一个看起来有意义的值**，而调用方把它当成普通值继续用下去。

## 追问会问什么

- `NOASSERTION` 和 `NONE` 有什么区别？→ `NONE` 是真的没有 license 文件（默认保留全部权利）；`NOASSERTION` 是有文件但没匹配上已知 license。**两者都不能当开源用。**
- 为什么这类 bug 特别难查？→ 因为它**不报错**。异常会被看见，合法值不会。所以「结果不对 + 无异常」是一个高价值信号。
- 怎么系统性地防？→ 把「查不到」和「查到了」在类型层面分开（`Option` / `Result` / 显式 `if`），而不是共用一个值域。
- 什么情况下可以用哨兵值？→ 当调用方**不可能忘记检查**时（例如语言层面强制）。靠约定和注释的哨兵值一定会有人漏检。
