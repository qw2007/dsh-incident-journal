# 本机根本没有 PowerShell 7：`powershell.exe` 5.1 的默认编码与直觉相反

`kind: 坑` · `of-0008` · `status: 需复习`

## 一句话

本机 **没装 PowerShell 7**——我一直在 `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`（**Windows PowerShell 5.1**）上跑脚本。5.1 下 `Get-Content -Raw` **按系统 ANSI（本机 GBK/936）解码**，`Set-Content -Encoding UTF8` **写 BOM**。两个默认行为都与直觉相反，合起来就是：把 UTF-8 中文文件读成乱码，再原样写回去，**不可逆地毁掉原文**。

---

## 现象

我写脚本给 `README.md` 插一行索引。跑完：

- `README.md` 和 `career.log` 的中文**全部变成乱码**（本机看到的是 `鏈満`、`琚樿樆` 这类）。
- 新加的那一行**插到了文件最开头**，而不是索引表里。

第二个才是真正难查的。乱码让 `IndexOf("| 本机网络双模态 |")` 返回 **-1**，而插入位置写的是 `$t.Insert($idx + 1, $line)` —— `-1 + 1 = 0`，**一个合法索引**。所以它不抛异常，只是安静地插错了地方。

**这是这个坑的第二次伤害**：编码问题先毁掉内容，再毁掉程序逻辑，而第二层是静默的。

---

## 修法

### 1. 读写都绕开 cmdlet，走 .NET

```powershell
$p = 'D:\DSh\offer\README.md'
$t = [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)
# ... 改 $t ...
[System.IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))
```

`UTF8Encoding($false)` 里的 `$false` = **不写 BOM**。用 `Set-Content -Encoding UTF8` 会写 BOM，而 BOM 会让 `json.load` 报 `Expecting value: line 1 column 1`、让 shell 脚本首行的 `#!` 失效。

### 2. 插入锚点用**纯 ASCII** 字符串

别拿中文当锚点。命令行参数里的中文在 Windows 上还可能被再转一次编码，`IndexOf` 就又找不到。

实测：锚点改成 `topics/local-network-dual-modality.md`、`D:\DSh\repos\` 之后稳定命中。（那个文件现已移到 `work-as-team/坑/local-network-dual-modality.md`。）

### 3. 从 `Set-Content` 产生的文件要去 BOM

```powershell
$s = $s.TrimStart([char]0xFEFF)
```

### 4. 动手之前先 commit

这次能救回来**全靠 git**：

```powershell
git checkout c4b16c1 -- README.md career.log
```

GBK 解码是**有损的**（非法字节序列被替换掉），所以乱码不可逆——**没有 git 就真的没了**。

---

## 一个反直觉的细节

同一个进程里：

```
OutputEncoding = utf-8
Console 代码页 = utf-8
```

**但 `Get-Content -Raw` 仍然按 GBK 读文件。** 所以「我把控制台编码改成 UTF-8 了」并不解决这个问题——文件读取在 5.1 下走的是另一条路径。

排查时不要拿 `$OutputEncoding` 去推断 `Get-Content` 的行为。

---

## 数字证据

先在干净文件上做了对照实验（内容 `中文测试 OK`，UTF-8 无 BOM，字节 `228,184,173,230,150,135,230,181,139,232,175,149,32,79,75`）：

| 项 | 值 | 来源 |
|---|---|---|
| `$PSVersionTable.PSVersion` | `5.1.26100.9444`（Major=5，PSEdition=Desktop） | `[实测]` |
| 进程路径 | `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe` | `[实测]` |
| `Get-Command pwsh` | **不存在**（没装 PS 7） | `[实测]` |
| `Get-Content -Raw` 读上述文件 | `涓枃娴嬭瘯 OK`（乱码） | `[实测]` |
| `Set-Content -Encoding UTF8` 头 3 字节 | `239,187,191`（= BOM） | `[实测]` |
| 被毁文件 | `README.md`、`career.log` | `[实测]` |
| 恢复来源 | commit `c4b16c1` | `[实测]` |
| 修复后复查 | 10 个文件 UTF-8 无 BOM | `[实测]` |

---

## 一句话怎么讲

**跨版本默认值不同的时候，不显式指定就是在赌**；而且编码问题的第二次伤害比第一次隐蔽——它会让字符串匹配失效，把「找不到锚点」变成一个静默的错误位置写入。

---

## 追问会问什么

- 为什么 5.1 用 ANSI，PS 7 用 UTF-8？→ PS 7 把 `Get-Content` 的默认编码统一成 UTF-8 无 BOM；5.1 沿用的是 ANSI 代码页。
- 为什么不干脆装 PS 7？→ 可以，但别人仍可能在 5.1 上跑你的脚本。显式指定编码比依赖环境可靠。
- 怎么一眼判断自己在哪个版本？→ `$PSVersionTable.PSEdition`：`Desktop` = 5.1，`Core` = 7+。
- 乱码能反推回原文吗？→ 不能。GBK 解码遇到非法字节序列会替换，**信息已经丢了**。唯一的救法是版本控制。
- 为什么 `$OutputEncoding=utf-8` 却不生效？→ 它管的是**管道输出的编码**，不管 `Get-Content` 读文件时的解码。
