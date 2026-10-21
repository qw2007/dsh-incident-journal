# work-as-team

这个项目在库里的视图。**只存链接，不存内容** —— 内容只有一份，在这里复制一份必然不同步，
而且不同步不报错。

- 项目仓库：`git@github.com:qw2007/work-as-team.git`
- 本地工作目录：`D:\DSh\work-AS-team`

---

## 坑

| 编号 | 条目 | status |
|---|---|---|
| `of-0001` | [`坑/misleading-error-messages.md`](坑/misleading-error-messages.md) — `Win32 5 ACCESS_DENIED`：ACL 看起来完全正常 | `需复习` |
| `of-0002` | 同上 — `SEC_E_NO_CREDENTIALS`：字面意思是「没有凭据」，但跟登录无关 | `需复习` |
| `of-0003` | 同上 — 「Congratulations」和「未登录」可以同时为真 | `需复习` |
| `of-0008` | [`坑/powershell-51-encoding.md`](坑/powershell-51-encoding.md) — 本机根本没有 PowerShell 7 | `需复习` |
| `of-0005` | [`坑/premature-convergence.md`](坑/premature-convergence.md) — 代理还没确认在跑，就想把代理写死 | `已掌握` |
| `of-0006` | 同上 — 砍「太重」的系统时，砍错了对象 | `已掌握` |

## 一句话

这六条没有一条是「写代码写错了」：三条是量具（报错、编码、代理），两条是判断（砍什么），
一条是流程。而这正好是当时最不设防的那一类。

跨项目的两条（[`技术点/verify-by-script-not-by-eye.md`](../技术点/verify-by-script-not-by-eye.md)、
[`思想风格/self-triggered-hooks-never-fire.md`](../思想风格/self-triggered-hooks-never-fire.md)）
不在这张表里 —— 它们跟人走，靠条目里的 `projects:` 关联到这里。
