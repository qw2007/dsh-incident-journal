# 把 `HOME` 指进沙箱，是让「必须写盘才能登录」的工具活过来的最小代价

`kind: 技术点` · `of-0026` · `status: 需复习` · `projects: [kaggle]`

## 是什么

`workspace-write` 沙箱下，任何把状态**持久化到 `~`** 的工具都会在「刷新 / 登录」这条路径上失败，而上层把这次失败翻译成「认证错误」。把 `USERPROFILE` 与 `HOME` 指向工作区内一个预置了凭据文件的目录，工具就能正常刷新并保存 —— 不动 SDK、不提权。

## 没有这个判断我会怎么做

我会把 kaggle CLI 的失败当成 token 问题：反复重设 `KAGGLE_API_TOKEN`、反复核对 `KAGGLE_CONFIG_DIR`、怀疑 DPAPI blob 不被 CLI 接受，最后要么去申请一个新 token，要么把整条提交流程提到 `danger-full-access` 跑（放开所有写入，每次还要人批）。

两种都不对，但第二种更贵：**用提权绕过权限问题，等于把"这个工具需要写 `~`"这个事实藏起来**，下次换一台机器还会踩。

错在哪：我在「凭据的内容」这一侧修，而问题在「凭据的存放位置」那一侧。

## 它怎么工作

三件事叠起来：

1. 沙箱是 restricted-token / ACL 实现：工作区内可写，区外一律 `ACCESS_DENIED`（表现为 `WinError 5`）；
2. 大量 SDK 把 home 当凭据库 —— 路径来自 `os.path.expanduser("~")`，而它读环境变量 `HOME`（Linux/macOS）或 `USERPROFILE`（Windows），**不是**读注册表里的用户目录；
3. 所以改这两个变量 = 只改「库房位置」，不需要改库的代码。

必须**预置**一份凭据文件，因为 `KAGGLE_CONFIG_DIR` 这类变量只管 CLI 自己**读**的位置，SDK 的**写**路径是硬编码的。读可配、写不可配，是两件事。

```powershell
$home2 = 'D:\DSh\kaggle\local\home'
New-Item -ItemType Directory -Force -Path "$home2\.kaggle" | Out-Null
Copy-Item 'D:\DSh\kaggle\.kaggle\credentials.json' "$home2\.kaggle\credentials.json" -Force
$env:USERPROFILE = $home2   # Windows 系库读这个
$env:HOME        = $home2   # 跨平台库读这个
```

## 怎么用

1. **先确认失败是「写」不是「读」**：绕过上层封装，直接调最底层的凭据对象，拿完整栈。上层封装会把不同原因压成同一句「请提供凭据」。
2. 建目录 + 复制凭据。
3. 设两个变量（Windows 上两个都要，不同库读不同变量；漏一个就只修好一半）。
4. 复跑同一条命令。**成功判据是拿到实际业务返回**（本例是配额三行），不是「没有报错」。

边界 —— 换什么条件不成立：

- 工具把路径**写死**成 `C:\Users\<name>` 而不读环境变量 → 无效；
- 状态要在多个进程/服务之间共享（守护进程用另一个账号的 home）→ 会分叉出两份状态，谁也不知道哪份是新的；
- 凭据是**跨机器绑定**的（DPAPI 的机器密钥）→ 同一用户下换个目录复制仍可解密（本例 `CfDJ8` 前缀的 blob 复制后可用），换机器不行；
- **复制意味着两份会漂移**：刷新只更新副本，原件越来越旧。每次新 session 都要重新复制一次，否则会拿着过期副本去刷。

## 源码位置

本机 `D:\DSh\kaggle\pyuser\Python314\site-packages\kagglesdk\kaggle_creds.py`：

```python
# kaggle_creds.py:77  save()
if not os.path.exists(dir_name):
    os.makedirs(dir_name)     # 沙箱：WinError 5
# kaggle_creds.py:115 refresh_access_token()
self.save()                   # 无条件调用，这就是只在刷新时炸的原因
```

## 数字证据

- `[实测]` 重定向前：`PermissionError: [WinError 5] 拒绝访问: 'C:\\Users\\Administrator/.kaggle'`，栈 `kaggle_creds.py:115 → :77 → os.makedirs`。
- `[实测]` 重定向后同一脚本：`get_access_token -> len 147`、`introspect -> qwfrog`，且 `expired now? True` —— 过期状态下也能刷新成功。
- `[实测]` 重定向后 `python -m kaggle competitions submission-limits`：`Submissions today: 0 / Lifetime submissions: 3 / Remaining today: 1`（同一条命令在重定向前只打印帮助文本、`exit code 1`）。

## 与资料的关联

`~/.dsh/AGENTS.md` 与 `dsh` 技能都写了「不要写工作区外」，但没写「需要写 `$HOME` 的工具怎么办」。本条补的就是这个缺口：不是放宽边界，而是把 `$HOME` 搬进边界内。

## 这个技巧的推广面

同一招对每一个「把状态写在 `~` 下」的工具都成立，只是要预置的文件不同：

| 工具 | 它要写的东西 | 预置 |
|---|---|---|
| `kaggle` / `kagglesdk` | `~/.kaggle/credentials.json` | 复制凭据 |
| `gh` | `~/.config/gh/hosts.yml` | 或改用 `GH_TOKEN` |
| `aws` | `~/.aws/credentials` | 或改用环境变量 |
| `gcloud` | `~/.config/gcloud/` | 或 `CLOUDSDK_CONFIG` |

规律：**先看这个工具有没有「只读凭据」的入口**（环境变量 / `*_CONFIG_DIR`）；有就走那条，不用复制；没有才搬 `$HOME`。反过来，如果工具在启动时**既要读又要写**同一个文件（本例 kagglesdk），搬 `$HOME` 是唯一不改库就能用的办法。

## 一句话怎么讲

在 `workspace-write` 下 `~` 是只读的；把工具的 `USERPROFILE`/`HOME` 指进工作区并预置它的凭据文件，比提权到 `danger-full-access` 便宜，也不会把真实问题藏起来。

## 追问会问什么

1. **为什么只设 `KAGGLE_CONFIG_DIR` 不够？**
   它管 CLI **读** `credentials.json`；SDK 的**写**路径硬编码 `~/.kaggle`。读可配、写不可配。

2. **复制凭据算不算扩大暴露面？**
   不算 —— 原件本来就在工作区内的 `.kaggle/credentials.json`。但 `local/home/` 必须进 `.gitignore`，否则副本会被提交。

3. **这个技巧会不会掩盖真正的权限问题？**
   会。如果工作区内也写不进去，它无效反而让人以为是凭据问题。所以第一步必须是拿完整栈，而不是先改环境变量。

4. **还有别的办法吗？**
   都更贵：提权 `danger-full-access`（每次人批、放开全部写入）；改 SDK 存储路径（改第三方库，升级即失效）；CLI 有显式 `--config` 时用它（本例 SDK 侧没有对应开关）。
