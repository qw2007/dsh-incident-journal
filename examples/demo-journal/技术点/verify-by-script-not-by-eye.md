# 验收写成脚本、结果落文件 —— 不要用眼睛看页面和控制台

`kind: 技术点` · `of-0015` · `status: 需复习` · `projects: [work-as-team]`

## 是什么

D1–D3 每一步的验收，都不是「打开页面看一眼」，而是一段跑在**容器里**的探针：它把每个断言的结果写成一个 JSON 文件，再 `docker cp` 出来，用显式 UTF-8 读。

```
/health       → {"status":"ok","degraded":[],"version":"0.1.0-d1","components":{...}}
/api/registry → 81 个盒子 / 109 条边 / 0 重复 id / 0 悬空边
/api/activity → ok: true
```

D3 的探针一次覆盖 20 多项，包括那些「用眼睛绝对想不起来要试」的：

| 断言 | D3 的实测值 |
|---|---|
| 四个能力档位是否都绑定了模型 | 全部 `bound` |
| Key 回显是否只有掩码 | `save_leaks_the_key: false`，掩码 `sk-fak…0001` |
| provider Key 有没有泄漏进 app 容器 | `provider_key_in_app_container: false` |
| 四种脏输入是否都拒绝 | `BADNAME` / 纯空格值 / 不存在的模板 / `../../etc/passwd` 全部 400 |
| 网关自己认不认这四个档位 | `/v1/models` 报 `code-cheap/code-strong/judge/planning` |
| 两个页面是否活着 | `/` 6602 B、`/config` 8953 B，都 200 |

## 没有它我会怎么做

我会用一条 `Invoke-RestMethod http://127.0.0.1:8010/health | ConvertTo-Json` 看一眼，再打开浏览器扫一眼页面。这会漏掉三件事：

| 会漏掉的 | 后果 |
|---|---|
| `Invoke-RestMethod` 把 UTF-8 读成 Latin-1（`of-0012`） | 我读到的 `2 ä¸ªæ¨¡æ¿` 会被当成应用 bug，去查一个根本不存在的编码问题 |
| `/health` 里某个组件字段**根本没被求值** | 页面上看着是绿的 —— 一个缺失的字段不会自己渲染成红色 |
| 十几项里靠后的那几项（四种 400、掩码、泄漏检查） | 肉眼不会把每一种脏输入都试一遍，只会试最容易想到的那一种 |

第二条不是假设。真跑起来抓到过：

```
AttributeError: 'str' object has no attribute 'get'
```

`app/main.py` 里 `_probe(fn)` 在**成功**路径上返回被探测值本身，而调用处写的是 `_probe(...).get("detail")` —— 成功时 `fn()` 返回一个字符串，`.get` 就炸。**结果是 `/health` 整个 500。**

任何「点一下看看」的验收都看不出来：浏览器里那是一次失败请求，页面上不是白屏，是一句看不到内容的错误；而失败的那一轮，恰好是所有依赖都健康、本该最绿的一轮。修法是加一个成功路径也返回组件记录的包装：

```python
def _version() -> dict:
    return {"ok": True, "detail": get_settings().version}

"version": _probe(_version)["detail"],
```

## 它怎么工作

三个要点，缺一个都会退化成「看一眼」：

1. **探针跑在目标进程的旁边**（容器里），不是从宿主隔着一层 shell 猜。宿主 shell 有自己的 TLS 后端、自己的解码器、自己的网络路径（`of-0010`、`of-0012`）。
2. **结果落成文件**，绕开所有「会替你解码」的中间层：终端、PowerShell 的解码器、`Select-Object` 这类会缓冲到最后的管道。
3. **断言写成布尔、可以被数**。`PASS 72 checks` 这种数字才是能跨版本比较的验收信号 —— 「我看了，没问题」不能比较。

配套的是容器内那份 `tests/test_smoke.py`：不依赖网络和数据库，一条命令就能跑，输出固定格式：

```
PASS 72 checks, 2 templates, all references resolve
```

**每次改动之后跑同一个数字。** 数字掉了，就是这次改动弄坏了什么。

## 怎么用

```powershell
# 1. 探针跑在容器里，结果写文件
docker compose exec -T app python /tmp/probe.py
docker cp work-as-team-app-1:/tmp/out.json "$env:TEMP\out.json"

# 2. 显式 UTF-8 读，再断言（不要用 Invoke-RestMethod）
[System.IO.File]::ReadAllText("$env:TEMP\out.json", [System.Text.Encoding]::UTF8)

# 3. 纯逻辑的回归用容器内的 smoke test，输出「N checks」这种可比较的数
docker compose exec -T app python tests/test_smoke.py

# 4. 造数据验证「灯会不会亮」时，插进去的每一行都要能按条件删干净
docker compose exec -T -e PGCLIENTENCODING=UTF8 postgres psql -U wat -d wat -v ON_ERROR_STOP=1 -f /tmp/001_light_test.sql
```

第 4 条是同一件事的另一面：**验收造的脏数据必须能被一条 SQL 精确删掉。** D2 的点灯验证插了 3 行 `events`（`payload->>'box'` 是 `Q9`/`J`）和 1 行 `decisions`，验证完用 `DELETE ... WHERE payload->>'box' IN ('Q9','J')` 删干净 → `DELETE 3` / `DELETE 1`。

**别给 docker 套会缓冲的管道**（`| Select-Object -Last 50`）。它会等整条流水线结束才吐一个字，第一次 `docker compose up --build` 因此看起来像卡死了，我把它错误归因成「构建太慢」。

## 数字证据

| 项 | 值 |
|---|---|
| `docker compose exec -T app python tests/test_smoke.py` | `PASS 72 checks, 2 templates, all references resolve`，exit 0 `[实测]` |
| D2 探针 | 81 盒子 / 109 边 / 0 重复 id / 0 悬空边 `[实测]` |
| D2 点灯验证 | 插入后 `activity_box_keys: ["J","Q9"]`，清理后 `[]` `[实测]` |
| D3 探针 | 档位全 `bound`、`save_leaks_the_key: false`、`provider_key_in_app_container: false` `[实测]` |
| 探针抓到的真 bug | `AttributeError: 'str' object has no attribute 'get'`（`/health` 500） `[实测]` |

## 一句话怎么讲

**「我看过了，没问题」不是验收。** 把断言写成脚本、结果落成文件、结论压缩成一个可比较的数字 —— 这样才能区分「这次真的对」和「这次我没看到错」。

## 追问会问什么

- 为什么不用浏览器？→ 浏览器能看版式，看不出「这个字段根本没被求值」。两者互补，脚本负责不会骗人的那一部分。
- 为什么一定要落文件？→ 见 `of-0012`：任何会替你解码的中间层，都可能给出关于它自己的读数。
- 「72 checks」这个数字有什么用？→ 它是唯一能跨版本比较的验收信号；「看起来正常」不能比较。
- 验收造的脏数据怎么处理？→ 插入时就设计好一条能把它精确删掉的谓词，清理和验证分成两步跑。
