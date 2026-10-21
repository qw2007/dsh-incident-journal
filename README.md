# dsh-incident-journal

> 给 DeepSeek Harness 用的**工程日记**：把你踩过的坑、留下的技术点、认下的设计立场写成可复习、可审计的条目，而不是让它烂在聊天记录里。

五个 skill：**记录**（`incident-journal`）、**复习**（`incident-review`）、**体检**（`incident-audit`）、**资料**（`incident-resource`）、**布局**（`incident-layout`）。

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

## 速览

**输入**：「记一条 —— 沙箱报 `SetNamedSecurityInfoW failed (Win32 5)`，我以为是没权限，其实不是。」

**agent运行**（一次，不会问你第二遍）：

1. 读开关 → 这个工作区已登记 → 继续
2. 过筛子 → 「我原来以为是 X，实测是 Y」成立，B 存在 → 收
3. grep 全库 → 没写过 → 新建；写过 → 加厚
4. 按骨架写 → 数字标 `[实测]`，报错原文照抄（见[这条真实条目](examples/demo-journal/work-as-team/坑/misleading-error-messages.md)）
5. 同步四处索引、追加 `career.log`

**你得到**一个三个月后还能读回来、每个数字都能回溯到证据的条目 —— 不是一段聊天记录。

---

## 在 DSH 里用

### 安装

#### 方式 A：零安装（推荐先试）

skill 就是普通目录。把本仓库 `skills/` 下的五个目录复制到 Harness 的用户技能目录：

```bash
mkdir -p ~/.dsh/skills
cp -r skills/incident-journal skills/incident-review skills/incident-audit skills/incident-resource skills/incident-layout ~/.dsh/skills/
```

DSH 的 filesystem skill provider 会自动发现 `~/.dsh/skills/<name>/SKILL.md`，**不需要装插件、不需要重启**（改 `SKILL.md` 会热重载）。

Windows 对应目录：`C:\Users\<你>\.dsh\skills\`。

#### 方式 B：作为插件包（会真正「注入」到 profile）

方式 A 是「DSH 自己去技能目录里发现」，方式 B 是「这个包自己把五个 skill 注册进 `ctx.skills`」。后者的意义是**分发**：换台机器装一次这个包，五个 skill 一起到位，不用逐个目录复制。

这个包本身零运行期依赖（只用 Node 内置模块），**已发布到公共 npm**：

| | |
|---|---|
| 包名 | `dsh-incident-journal` |
| dist-tag | `latest` |
| 页面 | <https://www.npmjs.com/package/dsh-incident-journal> |
| 源码 | <https://github.com/qw2007/dsh-incident-journal> |

先在一个空目录里确认它装得出来（19 个文件，含 `skills/` 下全部 `references`）：

```bash
npm i dsh-incident-journal
```

然后让 Agent 把它装进当前 profile —— 用 `plugin_manager` 的 `install_bundle`，`target` 传包名 `dsh-incident-journal@latest`。**如果它只接受本地目录**（我实际跑通过的是 tarball 与目录两条路，直接传包名这一步还没实测），就先取 tarball 再传绝对路径：

```bash
npm pack dsh-incident-journal@latest
```

要改代码就 `git clone` 那个源码仓库 —— 它现在是公开的；只是装来用则完全不需要。

> **不要手改 profile 的 `package.json` 或 `cordis.patch.yml`。** 那两步由 `install_bundle` 完成；手写的每一处都要单独授权，而且很容易写漂。你只需要给它一个目录。

装进去的三个文件各自干什么：

| 文件 | 作用 |
|---|---|
| `lib/index.js` | Cordis provider：`name = 'dsh-incident-journal'`、`inject = ['skills']`，在 `apply(ctx)` 里调 `ctx.skills.registerProvider()`，把 `skills/` 下的四个 `SKILL.md` 交给 `ctx.skills`；返回的 `resourceBase` 是目录形式，所以 `SKILL.md` 里可以用相对路径引用 `references/…` |
| `dsh.plugin.json` | 插件清单：`contributes.skills` 列出四个技能名，`engines.dsh` 声明最低版本 |
| `cordis.patch.yml` | 一行 loader 配置（`insert: [{ id, name }]`）—— `install_bundle` 把它并进 profile 的 composition |

代价，按会不会影响你的程度排序：每个 `plugin_manager` 动作都要一次授权；改动影响该 profile 下**所有**会话；启动期 profile 要重启一次才生效。**只想自己用就走方式 A**，这些代价一个都不会遇到。

**如果你同时留着方式 A 的副本，副本会赢。** skill 注册表把候选按 rank **升序**排序后取同名里的第一个（`dsh-skill/lib/index.js:519` 的 `compareIndexedCandidates`，用在 `:314-322`），所以**数字越小优先级越高**：

```
项目目录 100/200  <  运行时 250  <  自定义目录 300
     <  ~/.dsh/skills 400  <  ~/.agents/skills 500
     <  本包 550  <  dsh 自带 600
```

也就是说，装了这个包之后，`~/.dsh/skills/incident-journal` 仍然是生效的那个，包里那份被**静默忽略**，只在日志里留一行 `skill "incident-journal" from custom ignored because a higher-priority skill already exists`。这条分层是有意的：**你自己的副本 > 第三方包 > dsh 自带**。所以**用方式 B 就不要再复制 `skills/`**。

> 想核对包没被篡改：`npm view dsh-incident-journal dist.shasum` 会打印当前版本的 tarball SHA-1，和本地 `npm pack` 出来的 `.tgz` 对一下即可。这里不写死哈希 —— 每次发版都会变。

自检（不需要装任何东西）：

```bash
node scripts/verify-provider.mjs
```

它会走一遍 `list()` / `get()`，并检查每个 `SKILL.md` 里用反引号引用的 `references/...` 路径是否真的存在，外加一条：frontmatter 是不是 YAML 安全的。单行 `description:` 里出现 `": "` 会让宿主**静默丢弃**整个技能 —— 这个坑真踩过，所以现在有机器检查。

---

### 用起来

#### 1. 建库、指定库、启动

库的默认目录结构：

```bash
mkdir -p my-journal/资料 my-journal/{技术点,思想风格} my-journal/my-project/坑
```

```
my-journal/
  .layout.yml                  目录改名后的覆盖表（可选，没改过就没有）
  资料/                        外部参考资料（面经、文档）—— 用 `/incident-resource` 收进来
  技术点/                      跨项目共享 —— 跟人走
  思想风格/                    跨项目共享 —— 跟人走
  my-project/
    README.md                  该项目的条目清单（只存链接，不存内容）
    坑/                        只属于这个项目
  README.md   career.log   REVIEW.md
```

**`坑` 跟项目走，`技术点` / `思想风格` 跟人走。** 后两类不属于任何一个项目，所以放在一级目录，靠条目里的 `projects:` 标签关联项目 —— 那是条目与项目之间唯一的关联。`<项目名>/README.md` 只存链接，让你进到项目目录就能看全三类；它不复制内容，所以不会出现「指针和正文不一致」。这个文件由写条目那一步顺带更新。

**目录名可以改。** 上面这四个是默认名。说一句「把坑改成 trouble」，`incident-layout` 会把每个项目下的 `坑/` 一起改名、写 `<库根>/.layout.yml` 记下这次覆盖、再把库里所有引用一起改掉。覆盖表放在**库根里**而不是机器配置里 —— 它是库的一部分，`git clone` 到新机器名字还在。改回去就说「把 trouble 改回坑」。**别手改目录名**，链接会一起断。

跟 Agent 说「**开始记录**」，它会问一次库的绝对路径（**只问这一次**），写进 `~/.dsh/incident-journal.yml`：

```yaml
journal_root: /abs/path/to/my-journal
active_workspaces:
  - /abs/path/to/the/project/you/work/in
```

之后在每个工作区里说一次「开始记录」，那个工作区就一直记，直到你说「**停止记录**」—— 跨会话有效。

> **没启动的时候什么都不会记**，但也不会静默：如果那一刻本来该记，Agent 会回一句「（journal 未启动，这次没记）」。看不到这句提示，就是真的没发生值得记的事。

#### 2. 记一条

跟 Agent 说「把刚才那个坑记下来」。它会：

1. 检查开关状态；
2. 按三类各自的反事实筛子判断够不够格；
3. **先 grep 库查重** —— 命中、且这次的新判断是原条目没顾到的，就**加厚**它，不新建；
4. 拿关键词 grep 一遍 `资料/`，命中就加一节 `## 与资料的关联`；
5. 按 [`skills/incident-journal/references/skeleton.md`](skills/incident-journal/references/skeleton.md) 的骨架落一条；
6. 同步**四处**索引（根 `README.md` / `career.log` / `REVIEW.md` / `<项目名>/README.md`）。

**库在工作区之外时**，条目先写到 `<工作区>/.incident-journal-staging/`，你说「**落盘**」时一次搬完 —— 暂存目录是库根的影子，相对路径一一对应，**授权按调用计、不按文件计**，所以搬 20 个和搬 1 个一样贵。要动的索引也先复制进暂存目录里改好，落盘时随条目一起盖回去。

**加厚最容易失效，所以它被写成了一个硬动作。** 不先 grep，你就只有想起来「我记过」的时候才会去加厚 —— 而想得起来的时候，你本来就不需要这条规则。

| 情况 | 动作 |
|---|---|
| 同主题条目已有，新判断是它没顾到的 | **加厚**：补进对应那一节、补 `projects:`，不新建文件 |
| 同主题条目已有，它已经答上了 | 什么都不做 |
| 新点自己是完整的另一个反事实 | **新建** |
| `坑` | **从不加厚** —— 坑绑在一个项目的代码位置上 |

边界：补到**需要改标题**就该新建，那已经不是原来那件事了。`坑` 在三个以上项目反复出现就不再是坑，`incident-audit` 会提示把它提成一条技术点或思想风格。

**条目编号 `of-NNNN` 必须声明在条目文件里。** 四处索引按编号引用条目，所以编号不能只活在索引里。合法位置只有两个：

- **一个文件一个条目** —— 写在身份行上：`` `kind: 坑` · `of-0007` · `status: 需复习` ``；
- **一个文件多个条目** —— 每个条目一个 `## of-NNNN <子标题>` 小节，身份行不写编号。

两处都没有、却被索引引用的，`incident-audit` 报 `[断链]`。

#### 3. 复习

跟 Agent 说「考考我」。它会挑 5–8 条出题，**按 kind 换角度**：

| kind | 考什么 |
|---|---|
| `坑` | 你凭什么做出那个错误推断 |
| `技术点` | 没有它你打算怎么做，会怎么坏 |
| `思想风格` | 加上什么条件之后，这个结论就不成立了 |

答案用 `<details>` 折叠，出完追加到 `REVIEW.md`。

**答错的条目，它会回去给那条的「追问会问什么」补一条** —— 答错说明笔记缺了这个角度，不是记性的问题。

#### 4. 定期体检

跟 Agent 说「审一遍笔记」。输出形如：

```
[断链]   career.log:18 引用 of-0007，但身份行和 `## of-0007` 小节里都没有声明它
[悬空]   项目视图 my-project/README.md 指向 技术点/xxx.md，该文件不存在
[流水账] 坑/foo.md 缺「我原来以为」；技术点/bar.md 说不出不用会怎样
[污染]   技术点/baz.md 把 [资料] 写成了事实
[退化]   坑/qux.md 只写了行号没写符号名
[重复]   同一条判据在 坑/a.md、坑/b.md、坑/c.md 各写了一遍 → 更像是骨架的 bug，不是三次独立的收获
[提升]   坑/jwt-expiry-a.md、坑/jwt-expiry-b.md 分属两个项目、同一判据 → 建议提成一条 技术点
[失衡]   库里有 9 条坑、0 条技术点、0 条思想风格
[缺记]   commit abc1234 (revert: ...) 没有对应条目
```

---

## 在 Codex 里用

五个技能就是普通的 `SKILL.md` 目录，Codex 直接认 —— 它要的 `name` / `description` frontmatter 本来就在。装法是把目录**接**过去，不要在磁盘上放第二份：

```powershell
# Windows：junction，不需要管理员权限
$repo = 'C:\path\to\dsh-incident-journal\skills'
foreach ($n in 'incident-journal','incident-review','incident-audit','incident-resource','incident-layout') {
  New-Item -ItemType Junction -Path "$env:USERPROFILE\.codex\skills\$n" -Target "$repo\$n"
}
```

```bash
# macOS / Linux
mkdir -p ~/.codex/skills
for n in incident-journal incident-review incident-audit incident-resource incident-layout; do
  ln -s "$PWD/skills/$n" ~/.codex/skills/$n
done
```

用法上和 DSH 有两处不同：

- **触发**：靠 `description` 自动匹配；显式调用是 `$incident-journal`，而 DSH 那边是 `/incident-journal`。
- **入口文案**：每个技能目录里的 `agents/openai.yaml` 只有 Codex 会读，提供列表里的显示名和一句默认提示词。

装完可以当场验：

```bash
codex debug prompt-input
```

它打印的是模型实际看到的输入，里面应当出现 `- incident-journal: … (file: r0/incident-journal/SKILL.md)`。`~/.agents/skills` 也是 Codex 读的路径（会显示成 `r1/…`），两条都行。

> 已实测：五个技能都进了 Codex 的 prompt input，`agents/openai.yaml` 的显示名也被读到。`$incident-journal` 这种显式触发没有单独验证过 —— 确认可用的是 description 自动匹配。

---

## 在 Claude Code 及兼容宿主里用

五个技能的 frontmatter 只有 `name` 和 `description`，符合 [Agent Skills 规范](https://agentskills.io/specification) —— 任何按这个规范读技能目录的宿主都能直接用。装法仍然是**接目录，不是复制**：

```bash
mkdir -p ~/.claude/skills
for n in incident-journal incident-review incident-audit incident-resource incident-layout; do
  ln -s "$PWD/skills/$n" ~/.claude/skills/$n
done
```

> 这一条**未在本机实测** —— 这台机器没装 Claude Code。DSH 是本体、Codex 是验过的，Claude Code 这条是按规范推的；用之前先看一眼技能列表。三处装的是同一份文件，所以不会有版本漂移，只有「这个宿主认不认」的差别。

---

## 五个 skill

| skill | 触发时机 | 干什么 |
|---|---|---|
| `incident-journal` | 「开始记录」/「停止记录」/「落盘」，或刚发生一件值得留的事 | 检查开关，判断够格，按骨架写条目并同步**四处**索引 |
| `incident-review` | 「考考我」「复习」 | 从库里挑 5–8 条出题，按 kind 换角度考，优先考最可能忘的 |
| `incident-resource` | `/incident-resource <文件>`、「把这份面经收进资料」 | 先要出处（要不到就拒收），查重后加厚或新建 `资料/<slug>.md`，更新 `资料/README.md` 索引，最后只报不改地指出它和哪些条目对得上 |
| `incident-audit` | 「审一遍笔记」 | 扫全库找退化：索引断链或编号没人声明、缺反事实、`[资料]` 被写成事实、位置不可校验、同一判据反复出现、三类失衡、该记没记 |
| `incident-layout` | 「把坑改名成 trouble」「目录叫什么我自己定」 | 改库里的目录名：动目录（`Move-Item` / `mv`）、写 `<库根>/.layout.yml` 覆盖表、把库里所有引用一起改掉；不带参数时只报当前布局 |

---

## 什么算够格

**三类各有各的硬筛子**，完整规则见 [`skills/incident-journal/references/qualifying.md`](skills/incident-journal/references/qualifying.md)。

- **`坑` —— 「我原来以为 A，因为 B」。** B 必须存在。判据是：当时的你看到那段证据，会做出同样的错误推断吗？会，才收。
- **`技术点` —— 「没有它我会怎么做，错在哪」。** 必须有一个具体的、你会真的采用、而且确实错的替代方案。
- **`思想风格` —— 「它在什么约束下是对的，换什么条件就不对」。** 只有偏好没有约束的不收。

三类共用：有可核对的证据、有代价、能迁移。

**明确不收**：语法错误、环境配置琐事、网上抄来的标准做法、没有数字的「最佳实践」、只有偏好没有约束的设计品味。

**不想读规则，就直接看库。** [`examples/demo-journal/`](examples/demo-journal/) 是一份从真实库里节选的示例：六份文件、九条条目、四处索引齐全，条目正文一字未改 —— 三种 kind 各长什么样，看一遍比读十遍规则快。

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

**为什么布局不是一张通用配置表。**

它曾经是四个可配的键（`entries` / `index` / `timeline` / `review`），删掉是因为没有第二种合法布局。后来要的是「目录能改名」，回来的也不是通用配置层，而是一张**只记改过的键**的覆盖表（`.layout.yml`），写在库根、跟着库走 —— 放进 `~/.dsh/incident-journal.yml` 的话，`git clone` 到新机器名字就丢了。

---

## 兼容性

- DSH `>=0.1.0-rc.6`（开发与验证在 `0.2.0-rc.2` 上）
- 方式 A 无任何依赖；方式 B 也没有运行期依赖（只用 Node 内置模块）
- 平台无关。skill 正文里不含任何写死的绝对路径或平台专有命令 —— 那是这类库腐化最快的地方。

---

## License

MIT，见 [LICENSE](LICENSE)。

`lib/index.js` 的 provider shim 改写自 [`dsh-ponytail-skills`](https://github.com/gongyijie85/dsh-ponytail)（MIT），源文件头已署名。
