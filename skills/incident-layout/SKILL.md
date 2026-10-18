---
name: incident-layout
description: >
  Use when the user wants different directory names inside their journal —
  改名、换个目录名、把坑改成 trouble、目录叫什么我自己定 — to rename a layout
  directory across the whole library and rewrite every reference to it. The
  other incident-journal skills resolve the same override file.
---

# incident-layout

库的四个目录默认叫 `坑` / `技术点` / `思想风格` / `资料`。这个技能改的是**目录名**，不是 `kind` 标签 —— 条目里永远写 `kind: 坑`，变的只是它落在哪个文件夹。

覆盖表在**库根里**，跟着库走（`git clone` 到新机器名字还在）：

```yaml
# <库根>/.layout.yml
dirs:
  坑: trouble
```

只写改过的键；没写的用默认名；文件不存在 = 全部默认。

## 先读清楚

1. 读 `~/.dsh/incident-journal.yml` 拿 `journal_root`。没有就问，别猜。
2. 读 `<库根>/.layout.yml`（可能不存在，不存在就是全默认）。
3. 列一次库根顶层，看清哪些是目录、哪些是文件。

**逻辑名 → 实际目录名**：四个键 `坑` `技术点` `思想风格` `资料`，取值就是这个库里的实际目录名。

## 指令

| 指令 | 做什么 |
|---|---|
| `/incident-layout` | 只报现状：四个逻辑名各自解析成什么，库根下实际有什么。不改任何东西 |
| `/incident-layout rename 坑 trouble` | 把 `坑` 的全部目录改名成 `trouble`，并修好引用 |
| `/incident-layout rename 坑 坑` | 改回默认名（等价于删掉这个覆盖键） |

## rename 的步骤

### 1. 校验新名（不过就停，一个字符都别改）

- 必须匹配 `^[a-z0-9][a-z0-9-]*$` —— **小写英文、数字、连字符，不用中文**。理由和条目 slug 一样：这些名字要进路径、进 grep、进别的机器的 shell。
- 不能和另外三个逻辑名的**实际**目录名撞。
- 不能已经存在同名目录 —— 那是合并，不是改名，停下来问。
- 库根是 git 仓库时，目标名不能在 `git ls-files` 里已经出现。

### 2. 找出属于这个逻辑名的目录

- `资料` / `技术点` / `思想风格`：库根下只有一个。
- `坑`：**每个 `<项目名>/` 下面各一个**，它们都属于 `坑`，一起改。

动手前先把清单打给用户：待改目录、新名、预计受影响引用条数。用户没反对再改。

### 3. 改目录

用普通移动（`Move-Item` / `mv`）。**别用 `git mv`** —— 目录里有未跟踪的文件时它会直接失败（`fatal: source directory is empty, source=p1/坑`），而这个库里经常有刚加、还没提交的条目。移动不改内容，`git add -A` 之后 git 会按内容把它识别成 rename，历史照样接得上。

下面这个循环对两类都成立：`资料` / `技术点` / `思想风格` 在库根下，`坑` 在每个 `<项目名>/` 下。

```powershell
$root = '<库根>'; $old = '<旧名>'; $new = '<新名>'
Get-ChildItem -LiteralPath $root -Directory |
  Where-Object { Test-Path (Join-Path $_.FullName $old) } |
  ForEach-Object {
    Move-Item -LiteralPath (Join-Path $_.FullName $old) -Destination (Join-Path $_.FullName $new)
    $_.Name
  }
```

```bash
root='<库根>'; old='<旧名>'; new='<新名>'
for d in "$root"/*/; do [ -d "$d$old" ] && mv "$d$old" "$d$new" && echo "${d#$root/}"; done
```

### 4. 写覆盖表

改 `<库根>/.layout.yml` 里对应的那一个键。文件不存在就新建，加一行注释说明它是什么。

**新名等于默认名就去掉这个键**，不要留 `坑: 坑` —— 一个等于默认值的覆盖只会在下次改名时骗人。

### 5. 修引用（漏了这一步，库就开始断链）

grep 整个库根的 `.md`（跳过 `.layout.yml`），找含**旧目录名**的相对路径：

- `[标题](坑/xxx.md)`、`[标题](../坑/xxx.md)`
- 正文里的 `坑/xxx.md:12`、`资料/yyy.md`、`<项目名>/坑/`
- 此刻若有暂存目录，里面也是同样的相对路径

逐个换成新名。**只动路径位置的旧名**：一行里同时出现 `kind: 坑` 和 `坑/xxx.md`，只改后者。

改完再 grep 一次旧名，**残留必须能逐条解释** —— 「这行说的是 kind，不是目录」可以，「我漏了」不行。

### 6. 回读

- 目录：新名下面是原来的文件；旧名下面是空的或不存在。
- 覆盖表：`dirs:` 里那个键现在的值。
- 引用：把 grep 旧名的命中逐条列给用户看。

## 不要做

- 不要改 `kind:` 的值，也不要改条目正文里的概念名 —— 那是语义标签，不是路径。
- 不要改根文件名（`README.md` / `career.log` / `REVIEW.md`）—— 它们不是目录，这一版不管。
- 不要在别的技能里再存一份覆盖表；四个技能读的都是 `<库根>/.layout.yml`。
- 不要为了「统一」把没配过的目录也写进覆盖表。
- 不要手改目录名 —— 库里的链接会一起断，这正是这个技能存在的理由。
