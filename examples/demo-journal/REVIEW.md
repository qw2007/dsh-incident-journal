# REVIEW.md

自测题。**先不看答案**，能答出来才算 `已掌握`。

答不出来的，回到对应条目文件，把 `status` 往下调一档。
这里的题全部来自条目自己的「追问会问什么」一节 —— 那才是这条经验真正的边界。

---

## 本机没装 PowerShell 7（`work-as-team/坑/powershell-51-encoding.md`，`of-0008`）

**Q1.** 为什么不干脆装 PowerShell 7 了事？

<details><summary>答案</summary>

可以装，但别人仍可能在 5.1 上跑你的脚本。**显式指定编码比依赖环境可靠。**

一眼判断自己在哪个版本：`$PSVersionTable.PSEdition` —— `Desktop` = 5.1，`Core` = 7+。

</details>

**Q2.** 已经乱码的字符串，能不能反推回原文？

<details><summary>答案</summary>

不能。GBK 解码遇到非法字节序列会替换，**信息已经丢了**。

唯一的救法是版本控制：从 commit 里把文件捞回来。

</details>

**Q3.** 设了 `$OutputEncoding = 'utf-8'` 为什么 `Get-Content` 还是乱码？

<details><summary>答案</summary>

`$OutputEncoding` 管的是**管道输出的编码**，不管 `Get-Content` 读文件时的解码。

后者由 `-Encoding` 参数决定，5.1 默认 ANSI 代码页。

</details>

**Q4.** 编码错位最阴的第二次伤害是什么？

<details><summary>答案</summary>

它让字符串匹配静默失效：按锚点做替换的脚本找不到锚点，于是**写错位置**，而不是报错。

见条目里那张表：`README.md` 和 `career.log` 就是这样被毁的。

</details>

---

## 过早收敛（`work-as-team/坑/premature-convergence.md`，`of-0005`/`of-0006`）

**Q5.** 为什么这里「不砍功能」反而是对的？

<details><summary>答案</summary>

因为这是要长期生长的系统；功能面砍掉以后要补回来，成本高于一开始就用轻实现。

**要砍的是实现，不是功能。** 这两个答案完全相反，所以动手削减之前必须先问砍的是哪一个。

一个进程怎么承载 30+ 个「服务」？它们本来就不是服务 —— 一张 Postgres 表 +
`SELECT … FOR UPDATE SKIP LOCKED` 就是队列，不需要 Redis + Celery。

</details>

**Q6.** 什么情况下该砍功能？

<details><summary>答案</summary>

当这个功能**不属于核心目标**时。这里核心目标（跑通整张流程图）明确包含所有盒子，
所以一个都不能砍。

</details>

---

## 验收写成脚本（`技术点/verify-by-script-not-by-eye.md`，`of-0015`）

**Q7.** 「我看过了，没问题」为什么不算验收？

<details><summary>答案</summary>

因为它区分不了「这次真的对」和「这次我没看到错」。

把断言写成脚本、结果落成文件、结论压缩成一个可比较的数字（`PASS 72 checks`），
才是能跨版本比较的信号。

</details>

**Q8.** 为什么一定要把结果落成文件，而不是看控制台？

<details><summary>答案</summary>

任何会替你解码的中间层，都可能给出**关于它自己的**读数。

```
别给 docker 套会缓冲的管道（| Select-Object -Last 50）——它会等整条流水线结束才吐字，
第一次 `docker compose up --build` 因此看起来像卡死，被错误归因成「构建太慢」。
```

</details>

---

## 把 `HOME` 指进沙箱（`技术点/redirect-home-into-the-sandbox.md`，`of-0026`）

**Q9.** 只设 `KAGGLE_CONFIG_DIR` 为什么不够？

<details><summary>答案</summary>

它管的是 CLI **读** `credentials.json`；SDK 的**写**路径硬编码在 `~/.kaggle`。

读可配、写不可配 —— 所以「必须写盘才能登录」的工具只能靠搬 `$HOME` 解决。

</details>

**Q10.** 这个技巧会不会掩盖真正的权限问题？

<details><summary>答案</summary>

会。如果工作区内也写不进去，它无效，还会让人以为是凭据问题。

所以第一步必须是**拿到完整栈**，而不是先改环境变量。

</details>

---

## 自触发钩子（`思想风格/self-triggered-hooks-never-fire.md`，`of-0016`）

**Q11.** 「记得在 X 的时候做 Y」这种规则，为什么写了等于没写？

<details><summary>答案</summary>

只要 X 的识别依赖执行者本人的注意力，它就等于不存在。

要让它存在，得把判断挪到一个不会忘的调用方那里 —— 宿主钩子、每轮注入的指令、或外部定时器。

**结构性失败要用结构性办法修**，不是让技能描述更醒目。

</details>

**Q12.** 这个立场什么时候会反过来咬人？

<details><summary>答案</summary>

每轮注入会占上下文、也会变成噪音。当任务本身很短、或用户明确不想被提醒时，
宿主钩子反而比「模型自己判断」更糟。

—— 这就是它属于「思想风格」而不是铁律的原因：它有边界，边界要一起写下来。

</details>
