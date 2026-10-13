# dsh-incident-journal

> 给 DeepSeek Harness 用的**工程日记**：把你踩过的坑、留下的技术点、认下的设计立场写成可复习、可审计的条目，而不是让它烂在聊天记录里。

三个 skill：**记录**（`incident-journal`）、**复习**（`incident-review`）、**体检**（`incident-audit`）。

---

## 它解决什么问题

大多数人的「踩坑笔记」死于三件事：

1. **写的是流水账** —— 只有「我做了什么」，没有「我原来以为什么」。三个月后重读，学不到东西。
2. **只写不复习** —— 记了一百条，一条没再看。没有复习的笔记等于没写。
3. **只装得下坑** —— 值得留下的技术点和设计立场无处可放，最后都流失了。

第三条靠**把条目分成三类**解决，前两条靠一条铁律：

| kind | 收什么 | 硬筛子（反事实） |
|---|---|---|
| `坑` | 一个被推翻的判断 | **我原来以为**什么，凭什么 |
| `技术点` | 一个值得留下的做法 | **没有它我会怎么做**，错在哪 |
| `思想风格` | 一个设计立场 | 它在**什么约束下**是对的，换什么条件不成立 |

**每条必须能写出反事实。** 写不出来的不收 —— 「今天我学了 Redis」写不出「没有它会怎样」，「他们用了分层架构」写不出「什么条件下它会错」。**没有反事实的条目是摘抄，不是条目。**

外加一条**可迁移判据**的要求：如果一条经验只对当时的那个报错有用，它不该进这个库。

---

## 三个 skill

| skill | 触发时机 | 干什么 |
|---|---|---|
| `incident-journal` | 「开始记录」/「停止记录」/「落盘」，或刚发生一件值得留的事 | 检查开关，判断够格，按骨架写条目并同步三处索引 |
| `incident-review` | 「考考我」「复习」 | 从库里挑 5–8 条出题，按 kind 换角度考，优先考最可能忘的 |
| `incident-audit` | 「审一遍笔记」 | 扫全库找退化：索引断链、缺反事实、`[资料]` 被写成事实、位置不可校验、三类失衡、该记没记 |

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

### 1. 建库、指定库、启动

库的目录结构是**固定的**：

```bash
mkdir -p my-journal/资料 my-journal/my-project/{坑,技术点,思想风格}
```

```
my-journal/
  资料/                        外部参考资料（面经、文档）
  my-project/
    坑/  技术点/  思想风格/
  README.md   career.log   REVIEW.md
```

没有可配的路径 —— 布局固定，所以**没有配置文件**。跟 Agent 说「**开始记录**」，它会问一次库的绝对路径（**只问这一次**），写进 `~/.dsh/incident-journal.yml`：

```yaml
journal_root: /abs/path/to/my-journal
active_workspaces:
  - /abs/path/to/the/project/you/work/in
```

之后在每个工作区里说一次「开始记录」，那个工作区就一直记，直到你说「**停止记录**」—— 跨会话有效。

> **没启动的时候什么都不会记**，但也不会静默：如果那一刻本来该记，Agent 会回一句「（journal 未启动，这次没记）」。看不到这句提示，就是真的没发生值得记的事。

### 2. 记一条

跟 Agent 说「把刚才那个坑记下来」。它会：

1. 检查开关状态；
2. 按三类各自的反事实筛子判断够不够格；
3. 拿关键词 grep 一遍 `资料/`，命中就加一节 `## 与资料的关联`；
4. 按 [`skills/incident-journal/references/skeleton.md`](skills/incident-journal/references/skeleton.md) 的骨架落一条；
5. 同步三处索引（条目 / `README.md` 主题索引 / `career.log` 时间线）。

**库在工作区之外时**，条目先写到 `<工作区>/.incident-journal-staging/`，你说「**落盘**」时批量搬过去 —— 一次授权，而不是每个文件一次。

### 3. 复习

跟 Agent 说「考考我」。它会挑 5–8 条出题，**按 kind 换角度**：

| kind | 考什么 |
|---|---|
| `坑` | 你凭什么做出那个错误推断 |
| `技术点` | 没有它你打算怎么做，会怎么坏 |
| `思想风格` | 加上什么条件之后，这个结论就不成立了 |

答案用 `<details>` 折叠，出完追加到 `REVIEW.md`。

**答错的条目，它会回去给那条的「追问会问什么」补一条** —— 答错说明笔记缺了这个角度，不是记性的问题。

### 4. 定期体检

跟 Agent 说「审一遍笔记」。输出形如：

```
[断链]   career.log:18 引用 of-0007，但没有任何条目定义它
[流水账] 坑/foo.md 缺「我原来以为」；技术点/bar.md 说不出不用会怎样
[污染]   技术点/baz.md 把 [资料] 写成了事实
[退化]   坑/qux.md 只写了行号没写符号名
[失衡]   库里有 9 条坑、0 条技术点、0 条思想风格
[缺记]   commit abc1234 (revert: ...) 没有对应条目
```

---

## 什么算够格

**三类各有各的硬筛子**，完整规则见 [`skills/incident-journal/references/qualifying.md`](skills/incident-journal/references/qualifying.md)。

- **`坑` —— 「我原来以为 A，因为 B」。** B 必须存在。判据是：当时的你看到那段证据，会做出同样的错误推断吗？会，才收。
- **`技术点` —— 「没有它我会怎么做，错在哪」。** 必须有一个具体的、你会真的采用、而且确实错的替代方案。
- **`思想风格` —— 「它在什么约束下是对的，换什么条件就不对」。** 只有偏好没有约束的不收。

三类共用：有可核对的证据、有代价、能迁移。

**明确不收**：语法错误、环境配置琐事、网上抄来的标准做法、没有数字的「最佳实践」、只有偏好没有约束的设计品味。

### 三条诚信规则

- 每个数字必须标 `[实测]` / `[推算]` / `[资料]`。**没标的视为不可信。**
- `[资料]` 绝不能写成事实。资料是二手信息，可能有错、可能过时 —— 写法是「资料说 X」，不是「X」。**带出处的错误比没出处的更可信，所以这里的污染更严重。**
- 「是什么」段**抄报错原文，不要转述** —— 转述会丢掉后来定位时最有用的那个词。

---

## 条目长什么样

[`skills/incident-journal/references/examples/`](skills/incident-journal/references/examples/) 里有两个脱敏的真实条目（都是 `坑`）：

- [`misleading-error-message.md`](skills/incident-journal/references/examples/misleading-error-message.md) —— 报错文案里的名词指「实现细节」而不是「业务概念」
- [`sentinel-value-folded-semantics.md`](skills/incident-journal/references/examples/sentinel-value-folded-semantics.md) —— 一个字段把多种语义折叠成一个值时，它就不能用于决策

注意两个例子的 `## 源码位置` 都写的是「无」：例一是机器级 git 配置，例二是一次性脚本和外部 API。**没有项目代码就不要编一个位置出来** —— 为了填满格子造假，比空着糟糕得多。

---

## 设计说明

**为什么是 skill 而不是 plugin（自动化这件事）。**

这个库难点 100% 在判断侧：什么算「反事实成立」、这条经验能不能迁移。这部分不可自动化。能自动化的只有最后几条 `git add/commit/push`。

做一个插件把这个包起来，代价是 peer 依赖版本区间、构建、打包、profile 安装、重启，换来的判断力是 0。而 skill 的触发权在人手里 —— 该由人决定「现在这一刻值不值得记」。

（`lib/index.js` 存在只是为了让这个库能作为插件**分发**到别的机器，不是为了让判断自动化。走方式 A 的话你根本用不到它。）

**为什么三类都必须有反事实。**

反事实是唯一能挡住流水账的机制。放宽到三类之后，原来那条「必须有 `wrong_belief`」对后两类失效了 —— 如果不给每类配一个同等硬的筛子，「技术点」三个月后就会变成一个收藏夹。

**为什么 `status` 由人改。**

Agent 答对一次不等于你掌握了。`status` 的修改权只在本人手里，这是刻意设计的。

**为什么库的布局是固定的。**

之前它是四个可配的键（`entries` / `index` / `timeline` / `review`）。既然没有第二种合法布局，配置就只是三个 skill 里各抄一遍的默认值表 —— 删掉，少一处漂移。

---

## 兼容性

- DSH `>=0.1.0-rc.6`（开发与验证在 `0.2.0-rc.2` 上）
- 方式 A 无任何依赖；方式 B 需要 `@deepseek-ai/cordis ^4.0.1`（peer）
- 平台无关。skill 正文里不含任何写死的绝对路径或平台专有命令 —— 那是这类库腐化最快的地方。

## License

MIT，见 [LICENSE](LICENSE)。

`lib/index.js` 的 provider shim 改写自 [`dsh-ponytail-skills`](https://github.com/gongyijie85/dsh-ponytail)（MIT），源文件头已署名。
