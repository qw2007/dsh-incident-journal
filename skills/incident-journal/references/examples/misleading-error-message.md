# 一句「没有可用的凭据」，把你引向去登录账号

`status: 需复习`

`of-0001`

## 现象

本机所有 HTTPS 请求失败，看起来像断网：

```
$ curl https://example.com
curl: (35) schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS (0x8009030e)

$ git ls-remote https://github.com/octocat/Hello-World.git
fatal: unable to access '...': schannel: AcquireCredentialsHandle failed
```

但网络本身完全正常：

```
DNS 解析            example.com → 93.184.216.34     ✅
TCP 443 握手        TcpTestSucceeded = True          ✅
```

**同一个网络下，`curl`、`git`、`Invoke-WebRequest` 全挂，DNS 和 TCP 全正常。**

## 我原来以为

报错说 `SEC_E_NO_CREDENTIALS`（没有可用的凭据），所以我以为：

> 这台机器没有配置 HTTPS 的客户端凭据 / 证书，需要登录某个账号或者导入证书。

这个推断很自然 —— 报错原文就在说「凭据」。**但方向完全错了。**

## 真正的原因

不是缺凭据，是**选错了 TLS 后端**。

```
系统级配置   http.sslbackend = openssl     ← 正常
用户级配置   http.sslbackend = schannel    ← 覆盖了上一行
```

`schannel` 是 Windows 的原生 TLS 栈，它要访问系统凭据存储。在**这个进程环境下**（受限会话 / 非交互式登录）拿不到那个句柄，于是它在**发起 TLS 握手前**就失败了。

关键点：**`SEC_E_NO_CREDENTIALS` 说的是「我拿不到 TLS 客户端凭据」，不是「你没有登录账号」。** 报错文案本身把人引向了错误的动作。

## 怎么定位的

1. 先证伪「断网」——DNS 正常 + TCP 443 通。**问题被缩小到 TLS 层。**
2. 用 `openssl` 系工具对照测试（`git`、Python `requests`、Node）——**全部正常**。
3. 到这里范围已经很小：**同一台机器、同一个网络，只有 schannel 系的工具失败。**
4. 于是去看谁在决定「用哪个 TLS 后端」，发现用户级 gitconfig 覆盖了系统级。

## 修法

```bash
git config --global http.sslBackend openssl
```

验证：

```bash
git -c http.sslBackend=openssl ls-remote https://github.com/octocat/Hello-World.git
# exit 0，返回真实 refs
```

撤销就是把 `openssl` 改回 `schannel`。

**受影响范围**：走 OpenSSL 的工具恢复（`git`、Python、Node、Go）；**schannel 系的仍然坏**（PowerShell 的 `Invoke-WebRequest` / `Invoke-RestMethod`、基于 .NET 的程序）——它们改用 `curl.exe` 或 Python 绕开。

## 数字证据

- `curl` 退出码 `35`，报错 `SEC_E_NO_CREDENTIALS (0x8009030e)` `[实测]`
- 修复后 `git ls-remote` exit 0，返回真实 refs `[实测]`
- 受影响：schannel 系工具 100% 失败；openssl 系工具 100% 正常 `[实测]`

## 一句话怎么讲

**报错文案里的名词，可能指的是「实现细节」而不是「业务概念」。** `SEC_E_NO_CREDENTIALS` 里的 "credentials" 是 TLS 层的凭据句柄，不是账号。看到自己不认识的专有名词，第一步是**查它属于哪一层**，而不是按字面意思行动。

## 追问会问什么

- 为什么 `curl` 和 `git` 都失败，但 Python 正常？→ 它们用了不同的 TLS 后端。**故障域按「实现」划分，不按「功能」划分。**
- 怎么最快判断是 TLS 层而不是网络层？→ DNS + TCP 端口分别单独测。两个都通，就在 TLS 及以上。
- 为什么用户级配置会覆盖系统级？→ git 配置的就近覆盖语义。**改之前先 `git config --list --show-origin` 看是谁生效。**
- 遇到不认识的报错名词，通用做法是什么？→ 先定位它属于哪一层（网络/TLS/应用），再决定它是不是在说你以为的那件事。
