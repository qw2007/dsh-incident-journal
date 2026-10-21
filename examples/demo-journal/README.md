# demo-journal

**这是一个从真实库节选出来的示例，不是我的完整库。** 下面九条条目全部原样来自一个跑了几个月的
`offer` 库（只做了目录裁剪，正文一字未动）—— 包括里面的 `[实测]` 数字、源码位置和「不知道」的部分。

用途只有一个：让你在动手之前看见**「够格」到底长什么样**，以及三种 kind 各自该写什么。
照它的形状建你自己的库，然后把这个目录当成模板。

---

## 库的布局

```
demo-journal/
  .layout.yml                 目录名覆盖表（可选；这个示例里没有）
  资料/                        外部二手材料 —— 写条目前先翻这里
  技术点/                      跨项目共享 —— 跟人走
  思想风格/                    跨项目共享 —— 跟人走
  work-as-team/
    README.md                 项目视图：只存链接，不存内容
    坑/                       只属于这个项目
  README.md   career.log   REVIEW.md
```

**`坑` 跟项目走，`技术点` / `思想风格` 跟人走。** 后两类不属于任何项目，与项目之间唯一的关联
是条目里的 `projects:` 标签。

目录名可以改（`/incident-layout rename 坑 trouble`），覆盖表写在**库根**的 `.layout.yml`，
跟着库走 —— 换台机器 `git clone` 下来名字还在。

---

## 怎么用

- 复习某个技术主题 → [`技术点/`](技术点/)、[`思想风格/`](思想风格/)、[`work-as-team/坑/`](work-as-team/坑/)
- 想知道某个项目的全部条目 → [`work-as-team/README.md`](work-as-team/README.md)
- 想知道「我什么时候做过什么」 → [`career.log`](career.log)
- 想检查自己是否真记住了 → 做 [`REVIEW.md`](REVIEW.md) 里的题，**先不看答案**
- 想找外部参考资料 → [`资料/`](资料/)

每条记录带一个 `status`：

| status | 含义 |
|---|---|
| `需复习` | 还没考过 |
| `复习中` | 考过一次，答得不完整 |
| `已掌握` | 不看笔记能讲清楚 |

`status` 由人改，不由 agent 改 —— agent 答对一次不等于你掌握了。

---

## 索引：坑（`work-as-team/坑/`）

一个文件可以装多条条目（`## of-NNNN` 分节），所以下表的行数和文件数不一样。

| 编号 | 条目 | status |
|---|---|---|
| `of-0001` | [`misleading-error-messages.md`](work-as-team/坑/misleading-error-messages.md) — `Win32 5 ACCESS_DENIED`：ACL 看起来完全正常 | `需复习` |
| `of-0002` | 同上 — `SEC_E_NO_CREDENTIALS`：字面意思是「没有凭据」，但跟登录无关 | `需复习` |
| `of-0003` | 同上 — 「Congratulations」和「未登录」可以同时为真 | `需复习` |
| `of-0008` | [`powershell-51-encoding.md`](work-as-team/坑/powershell-51-encoding.md) — 本机根本没有 PowerShell 7：`powershell.exe` 5.1 的默认编码与直觉相反 | `需复习` |
| `of-0005` | [`premature-convergence.md`](work-as-team/坑/premature-convergence.md) — 代理还没确认在跑，就想把代理写死 | `已掌握` |
| `of-0006` | 同上 — 砍「太重」的系统时，砍错了对象 | `已掌握` |

## 索引：技术点（`技术点/`）

| 编号 | 条目 | status |
|---|---|---|
| `of-0015` | [`verify-by-script-not-by-eye.md`](技术点/verify-by-script-not-by-eye.md) — 验收写成脚本、结果落文件，不要用眼睛看页面和控制台 | `需复习` |
| `of-0026` | [`redirect-home-into-the-sandbox.md`](技术点/redirect-home-into-the-sandbox.md) — 把 `HOME` 指进沙箱，是让「必须写盘才能登录」的工具活过来的最小代价 | `需复习` |

## 索引：思想风格（`思想风格/`）

| 编号 | 条目 | status |
|---|---|---|
| `of-0016` | [`self-triggered-hooks-never-fire.md`](思想风格/self-triggered-hooks-never-fire.md) — 把「什么时候该触发」交给正在做事的模型，等于不触发 | `需复习` |

---

## 为什么只有六份文件、九条

**一个月三条好条目，胜过三十条摘抄。** 这九条每一条都能回答一个「我原来以为什么」，
而它们凑在一起刚好把三种 kind 的写法都演示了一遍 —— 这才是一个库该有的密度。

真正值得看的不是条目数量，是 `of-0008` 那类条目里那张**数字证据表**：每一行都带着
`[实测]` 或 `[推算]`，以及一个能回去查的 commit 或路径。
