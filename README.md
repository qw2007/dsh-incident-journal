# dsh-incident-journal

> 给 DeepSeek Harness 用的**工程事故日记**：把你自己踩过的坑写成可复习、可审计的条目，而不是让它烂在聊天记录里。

三个 skill：**记录**（`incident-journal`）、**复习**（`incident-review`）、**体检**（`incident-audit`）。

---

## 它解决什么问题

大多数人的「踩坑笔记」死于两件事：

1. **写的是流水账** —— 只有「我做了什么」，没有「我原来以为什么」。于是三个月后重读，学不到东西。
2. **只写不复习** —— 记了一百条，一条没再看。没有复习的笔记等于没写。

这个库用两个机制堵住它们：

- **强制写「我原来以为 + 因为」**。有价值的故事不是「我解决了 X」，而是「我原本以为 X，实测是 Y，所以我改成 Z」。**没有「我原来以为」的条目不允许写进去。**
- **`status` 字段 + 出题技能**。每条标记 `已掌握` / `需复习` / `只见过一次`，复习时优先考最可能已经忘掉的。

外加一条**可迁移判据**的要求：如果一条经验只对当时的那个报错有用，它不该进这个库。

---

## 三个 skill

| skill | 触发时机 | 干什么 |
|---|---|---|
| `incident-journal` | 你刚定位完一个坑、或我说「记一下」 | 按固定骨架写条目，并同步三处索引 |
| `incident-review` | 「考考我」「复习」 | 从库里挑 5–8 条出题，优先考最可能忘的 |
| `incident-audit` | 「审一遍笔记」 | 扫全库找退化：索引断链、流水账、数字过期、重复模式、该记没记 |

---

## 安装

### 方式 A：零安装（推荐先试）

skill 就是普通目录。把本仓库 `skills/` 下的三个目录复制到 Harness 的用户技能目录：

```bash
mkdir -p ~/.dsh/skills
cp -r skills/incident-journal skills/incident-review skills/incident-audit ~/.dsh/skills/
```

DSH 的 filesystem skill provider 会自动发现 `~/.dsh/skills/<name>/SKILL.md`，**不需要装插件、不需要重启**（改 `SKILL.md` 会热重载）。

Windows 对应目录：`C:\Users\<你>\.dsh\skills\`。

### 方式 B：作为插件包

本包自带一个 Cordis provider（`lib/index.js`），会把 `skills/` 注册进 `ctx.skills`。在 Harness profile 的 `package.json` 里加依赖：

```json
{
  "dependencies": {
    "dsh-incident-journal": "github:qw2007/dsh-incident-journal"
  }
}
```

然后在 profile 目录安装。包内 `cordis.patch.yml` 会把插件挂成一行 loader 配置。

> 尚未发布到 npm。等接口稳定后再说 —— 现在发上去只会固化一个还会改的形态。

自检（不需要装任何东西）：

```bash
node scripts/verify-provider.mjs
```

它会走一遍 `list()` / `get()`，并检查每个 `SKILL.md` 里用反引号引用的 `references/...` 路径是否真的存在。

---

## 用起来

### 1. 建一个日记库

```bash
mkdir -p my-journal/topics my-journal/measurements
cd my-journal
```

在库根放一个可选的 `.incident-journal.yml`：

```yaml
entries: topics/          # 条目目录
index: README.md          # 主题索引
timeline: career.log      # 一行一条的时间线
review: REVIEW.md         # 自测题
```

不写这个文件时，上面就是默认值。

### 2. 记一条

跟 Agent 说「把刚才那个坑记下来」。它会：

1. 读 `.incident-journal.yml` 定位库根；
2. 按 [`skills/incident-journal/references/skeleton.md`](skills/incident-journal/references/skeleton.md) 的八节骨架写条目；
3. 同步三处索引（条目目录 / 主题索引 / 时间线）。

### 3. 复习

跟 Agent 说「考考我」。它会挑 5–8 条出题，答案用 `<details>` 折叠，出完追加到 `REVIEW.md`。

**答错的条目，它会回去给那条的「追问会问什么」补一条** —— 答错说明笔记缺了这个角度，不是记性的问题。

### 4. 定期体检

跟 Agent 说「审一遍笔记」。输出形如：

```
[断链]   career.log:18 引用 of-0007，但没有任何条目定义它
[流水账] topics/foo.md 缺「我原来以为」
[退化]   topics/bar.md 标 [实测] 但无证据
[重复]   a.md / b.md / c.md 共享同一判据「查不到被编码成合法值」→ 建议合并
[缺记]   commit abc1234 (revert: ...) 没有对应条目
```

---

## 什么算够格

四条满足**一条**就收：

1. **错误信念被推翻** —— 错得有道理，不是手滑（拼错变量名不算）。
2. **有可核对的数字** —— 命令输出、耗时、内存、成本。
3. **有代价** —— 不处理会烧钱、烧数据或烧时间。
4. **能迁移到别的项目** —— 幂等、可重放 vs 副作用、容器内存、事件存储选型这类。

**明确不收**：语法错误、环境配置琐事、网上抄来的标准做法、没有数字的「最佳实践」。

完整规则见 [`skills/incident-journal/references/qualifying.md`](skills/incident-journal/references/qualifying.md)。

### 两条诚信规则

- 数字必须标 `[实测]` 或 `[推算]`。**`[推算]` 是允许的，不标是不允许的。**
- 现象段**抄报错原文，不要转述** —— 转述会丢掉后来定位时最有用的那个词。

---

## 条目长什么样

[`skills/incident-journal/references/examples/`](skills/incident-journal/references/examples/) 里有两个脱敏的真实条目：

- [`misleading-error-message.md`](skills/incident-journal/references/examples/misleading-error-message.md) —— 报错文案里的名词指「实现细节」而不是「业务概念」
- [`sentinel-value-folded-semantics.md`](skills/incident-journal/references/examples/sentinel-value-folded-semantics.md) —— 一个字段把多种语义折叠成一个值时，它就不能用于决策

第二个例子的核心：`String.IndexOf` 查不到返回 `-1`，`-1 + 1 = 0` 是合法索引；GitHub 的 `license.spdx_id` 认不出 license 时返回 `NOASSERTION`，读起来像「自定义但开源」。**两个 bug 是同一个形状 —— 把「无法确定」编码成了一个看起来有意义的值，都不抛异常。**

---

## 设计说明

**为什么是 skill 而不是 plugin（自动化这件事）。**

这个库难点 100% 在判断侧：什么算「错误信念被推翻」、这条经验能不能迁移。这部分不可自动化。能自动化的只有最后几条 `git add/commit/push`。

做一个插件把这个包起来，代价是 peer 依赖版本区间、构建、打包、profile 安装、重启，换来的判断力是 0。而 skill 的触发权在人手里 —— 该由人决定「现在这一刻值不值得记」。

（`lib/index.js` 存在只是为了让这个库能作为插件**分发**到别的机器，不是为了让判断自动化。走方式 A 的话你根本用不到它。）

**为什么骨架是固定的八节。**

自由格式的笔记会退化成流水账。八节里有三节是硬约束：`我原来以为`（必须有）、`怎么定位的`（写过程不写结论）、`数字证据`（没有就承认没有）。

**为什么 `status` 由人改。**

Agent 答对一次不等于你掌握了。`status` 的修改权只在本人手里，这是刻意设计的。

---

## 兼容性

- DSH `>=0.1.0-rc.6`（开发与验证在 `0.2.0-rc.2` 上）
- 方式 A 无任何依赖；方式 B 需要 `@deepseek-ai/cordis ^4.0.1`（peer）
- 平台无关。skill 正文里不含任何写死的绝对路径或平台专有命令 —— 那是这类库腐化最快的地方。

## License

MIT，见 [LICENSE](LICENSE)。

`lib/index.js` 的 provider shim 改写自 [`dsh-ponytail-skills`](https://github.com/gongyijie85/dsh-ponytail)（MIT），源文件头已署名。
