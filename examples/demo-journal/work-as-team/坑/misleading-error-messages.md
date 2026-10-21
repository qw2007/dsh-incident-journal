# 误导性报错

`kind: 坑` · `status: 需复习`

报错信息指向的方向是错的——它把人引到一个跟原因无关的地方。三条都在同一台机器上遇到，都是 Windows。

---

## of-0001 `Win32 5 ACCESS_DENIED`：ACL 看起来完全正常

**status: 需复习**

### 现象（报错原文）

写 `D:\DSh\work-AS-team` 失败，返回 `Win32 5`（`ERROR_ACCESS_DENIED`）。

### 我原来以为

ACL 里缺我的写权限 → 去看有哪些 ACE → 全都是 Allow，看不出问题 → 那就「用管理员权限跑」或者「去改 ACL」。

**两条路都是错的。** 看 ACE 列表这个动作，从一开始就不能回答问题。

### 真正的原因

观察到的 ACL 完全正常：

```
S-1-5-32-544 (Administrators)  Allow  FullControl          inherited
S-1-5-18     (SYSTEM)          Allow  FullControl          inherited
S-1-5-11     (Authenticated)   Allow  Modify, Synchronize  inherited
S-1-5-32-545 (Users)           Allow  ReadAndExecute       inherited
```

**没有任何一条 Deny。** 所以「找到拒绝我的那条规则」是一条死路——不存在那条规则。

真正的缺口是**有效 `WRITE_OWNER` 缺失**，而它只能通过「以目标权限实际打开对象」测出来，不能通过枚举 ACE 推出来：

```
writeDac   = true
writeOwner = false     ← 真凶
```

这个不对称是关键：**能改 DACL，但不能改 owner**。工具把它分类成 `PRECONDITION`——调用方无法同时以 `WRITE_DAC` 和 `WRITE_OWNER` 打开目标对象。

### 怎么定位的

逐层向上检查（`work-AS-team` → `D:\DSh` → `D:\`），对每一层记录**有效** `writeDac` / `writeOwner`，而不是记录 ACE 列表。判据不是「ACL 长什么样」，而是「能不能真的打开」。

`D:\` 那一层 `writeDac=false`，`work-AS-team` 与 `D:\DSh` 是 `writeDac=true / writeOwner=false`。 `[实测]`

### 修法

1. 先备份现有 ACL 到 `acl-backup-9d33c02378cd4b4ea4526d180719ee87.json`（附一个 45 KB 的 `.ps1` 还原脚本）。
2. 给当前用户 SID `S-1-5-21-2473081800-4014950869-2763676865-500` 加一条 `FullControl` 的 Allow ACE，**保留 deny ACE、owner 和 SACL 不动**。
3. 复检：`writeOwner` 从 `false` 变成 `true` ✅ `[实测]`

### 数字证据

| 项 | 值 |
|---|---|
| 备份文件 | `acl-backup-9d33c02378cd4b4ea4526d180719ee87.json`（273 B） `[实测]` |
| 还原脚本 | 同目录 `.json.ps1`（45460 B） `[实测]` |
| 修复前 | `writeDac=true, writeOwner=false` `[实测]` |
| 修复后 | `writeDac=true, writeOwner=true` `[实测]` |
| 报告 | `acl-report-dceaa6c4c0e74286b954f1c6bfbc297f.jsonl`（12027 B，每步都留痕） `[实测]` |

### 一句话怎么讲

`ACCESS_DENIED` 不等于「ACL 里有条 Deny」；**枚举 ACE 无法解释拒绝，只有以目标权限实际打开才能测出缺的是哪一项**——本例缺的是 `WRITE_OWNER`，而它在 ACL 里根本看不出来。

### 追问会问什么

- 为什么 `writeDac` 有而 `writeOwner` 没有？→ 两者是不同的权限位，可以独立授予；能改 DACL 不代表能改 owner。
- 为什么不能用「读 ACE 列表」代替实测？→ 只有 Deny 才直接对应拒绝，而 Allow 是否生效取决于 token、组归属、权限过滤，静态读不出有效权限。
- 为什么要先备份 ACL 再改？→ 改坏 ACL 会让目录彻底不可访问，且没有 root 可以绕过。
- 为什么逐层向上查？→ 子目录的 ACL 往往是继承来的，看父层才知道 ACE 从哪来。

---

## of-0002 `SEC_E_NO_CREDENTIALS`：字面意思是「没有凭据」，但跟登录无关

**status: 需复习**

### 现象（报错原文）

```
schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS (0x8009030E)
```

表现：`curl`、`Invoke-WebRequest`、`git` 的 **HTTPS 全部失败**，连 `www.baidu.com` 都返回 HTTP 000。看起来完全像断网。

但：

- DNS 正常：`github.com → 20.205.243.166` `[实测]`
- TCP 正常：`Test-NetConnection github.com -Port 443` → `TcpTestSucceeded = True` `[实测]`

### 我原来以为

「没有可用的凭据」→ 我以为是没登录、没证书、没 token → 去查账号、查代理、查防火墙。

报错措辞把我引到了一个跟原因**完全无关**的方向。

### 真正的原因

**TLS 后端配置被覆盖。**

- 系统级 `C:/Program Files/Git/etc/gitconfig`：`http.sslbackend=openssl`
- 用户级 `C:/Users/Administrator/.gitconfig`：`http.sslbackend=schannel` ← **覆盖了系统级**

schannel 在本会话拿不到凭据 → **每一次 TLS 握手都失败**。

### 怎么定位的

关键判据不是读那句报错，而是**看哪些工具坏了、哪些没坏**：

| 工具 | TLS 后端 | 结果 |
|---|---|---|
| `curl` | schannel/系统 | ❌ |
| `git` | 用户级覆盖为 schannel | ❌ |
| `Invoke-WebRequest` | .NET/schannel | ❌ |
| Node、Python `requests`/`urllib` | 自带（OpenSSL） | ✅ |
| Go / `gh` | 自带 TLS 栈 | ✅（只报「未登录」） |

**同一台机器上不同 TLS 后端行为分裂** → 不是网络问题，是后端问题。

再用 `git config --list --show-origin` 找到那行覆盖。

### 修法

```powershell
git config --global http.sslBackend openssl
```

验证：

```powershell
git -c http.sslBackend=openssl ls-remote https://github.com/octocat/Hello-World.git
# exit=0，返回真实 refs   [实测]
```

撤销只需改回 `schannel`。

**残留影响**：schannel 系（PowerShell 的 `Invoke-WebRequest` / `Invoke-RestMethod`、.NET 程序）仍然坏。绕开办法是改用 `curl.exe` 或 Python/Node。

### 数字证据

| 项 | 值 |
|---|---|
| DNS 解析 | `github.com → 20.205.243.166` `[实测]` |
| TCP 443 | `Test-NetConnection github.com -Port 443` → `TcpTestSucceeded = True` `[实测]` |
| 坏掉的工具 | `curl`、`Invoke-WebRequest`、`git`（HTTPS 全失败；`www.baidu.com` 也返回 HTTP 000） `[实测]` |
| 不受影响的工具 | Node、Python `requests`/`urllib`、Go、`gh` `[实测]` |
| 覆盖来源 | 用户级 `C:/Users/Administrator/.gitconfig` 的 `http.sslbackend=schannel` 覆盖系统级 `openssl` `[实测]` |
| 修复验证 | `git -c http.sslBackend=openssl ls-remote https://github.com/octocat/Hello-World.git` → exit=0，返回真实 refs `[实测]` |
| 残留 | schannel 系（`Invoke-WebRequest` / `Invoke-RestMethod`、.NET 程序）仍失败 `[实测]` |

### 一句话怎么讲

`SEC_E_NO_CREDENTIALS` 说的是 **TLS 后端**取不到凭据，不是「你没登录」；定位靠的是**比较不同工具的表现分裂**（都坏 = 网络问题，部分坏 = 后端问题），而不是抠报错字面。

### 追问会问什么

- 为什么用户级配置能覆盖系统级？→ git 配置的优先级是 系统 < 全局(用户) < 本地(仓库) < 命令行。
- 怎么快速看出是哪个文件设的？→ `git config --list --show-origin`，`--list` 本身不含来源。
- 为什么 Go 程序不受影响？→ Go 用自带 TLS 栈，不走 schannel，也不读 gitconfig。
- 怎么验证修好了？→ 拿一个确定存在的公开仓库跑 `ls-remote` 看 exit code，而不是看浏览器能不能打开。

---

## of-0003 「Congratulations」和「未登录」可以同时为真

**status: 需复习**

### 现象（报错原文）

浏览器页面：

```
Congratulations, you're all set!
Your device is now connected.
Signed in as qw2007
```

同机终端：

```
$ gh auth status
You are not logged into any GitHub hosts.
```

### 我原来以为

两个消息矛盾 → 其中一个坏了 → 大概是 gh 的 bug，或者授权没生效要重来。

### 真正的原因

**两个各自维护状态的系统，说的是两件不同的事。**

- 浏览器那句话 = **GitHub 服务端**记下「这个设备码已被授权」。
- `gh auth status` 读的是**本机配置目录**（`%APPDATA%\GitHub CLI`）。

授权成功只完成了**前半段**。后端还要 gh 拿着 `device_code` 去换 `access_token`，然后写进本地存储。这一步没跑完（当时是网络超时导致轮询中断），本地就没有 token，`gh auth status` 如实报告「未登录」。

两个状态**都是真的**，它们只是不同步。

### 怎么定位的

问「这两句话各自读的是哪份状态」，而不是「哪个是错的」：

| 消息 | 读的状态 | 在哪 |
|---|---|---|
| Congratulations | 设备码已授权 | GitHub 服务端 |
| not logged in | 是否有 token | 本机配置目录 |

对照证据：修好网络后重跑，`%APPDATA%\GitHub CLI\hosts.yml` 只有 **80 字节** `[实测]`：

```yaml
git_protocol: https
users:
    qw2007:
user: qw2007
```

**token 不在这个文件里**——它在 Windows keyring。所以「文件里没有 token」也不能证明没登录。

### 修法

回到终端，在同一环境里重跑 `gh auth login --hostname github.com --git-protocol https --web`，盯住输出直到出现：

```
✓ Authentication complete.
✓ Logged in as qw2007
```

轮询期间（最长约 15 分钟 `[资料]`）**别关窗口、别 Ctrl+C**。失败时把 `$env:HTTPS_PROXY` 设对再试。

最终验证：

```
$ gh auth status
✓ Logged in to github.com account qw2007 (keyring)
- Git operations protocol: https
- Token scopes: 'gist', 'read:org', 'repo', 'workflow'
```

### 数字证据

| 项 | 值 |
|---|---|
| 本地配置文件 | `%APPDATA%\GitHub CLI\hosts.yml`，**80 字节**，内容只有 `git_protocol` + 用户名 `[实测]` |
| token 存放位置 | Windows keyring（不在 `hosts.yml` 里） `[实测]` |
| 设备码有效期 | 约 15 分钟 `[资料]` |
| 最终状态 | `gh auth status` → `✓ Logged in to github.com account qw2007 (keyring)`，scopes `gist, read:org, repo, workflow` `[实测]` |

### 一句话怎么讲

一句「成功」只代表**报这句话的那个组件**成功了；遇到两个状态打架，先弄清**各自读的是哪份状态**，再判断谁需要推进。

### 追问会问什么

- 为什么 token 不在 `hosts.yml`？→ 凭据存在系统 keyring，配置文件只存非敏感项。
- 中间那段 `device_code → access_token` 交换失败会怎样？→ 服务端认为已授权，本地什么都没有，就是你看到的这个矛盾。
- 设备码有效期多久？→ 约 15 分钟 `[资料]`，过期要重跑。
- 为什么 SSH 协议不能让这一步变简单？→ `gh auth login` 选 SSH 仍然要走一次浏览器 OAuth 才能上传公钥，等于多一套钥匙。
