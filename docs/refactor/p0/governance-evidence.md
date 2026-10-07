# P0 治理与审计证据

## 1. 基线版本控制

- 候选基线路径：`docs/refactor/p0/`
- 候选标签：`p0-baseline-candidate-2026-10-07`
- 正式标签：`p0-baseline-v1`（包含阿格尼独立评审记录的正式基线）
- 候选提交只包含 P0 决策包，不包含工作区已有的 `README.md`、根 `package.json`、`pnpm-lock.yaml` 或 P1 草案。
- 任意后续修改必须通过新提交保留差异；不得改写候选标签。

验证候选提交：

```bash
git show --stat p0-baseline-candidate-2026-10-07
git diff p0-baseline-candidate-2026-10-07 -- docs/refactor/p0
```

第二条命令无输出才表示工作区 P0 内容与候选基线一致。

## 2. 独立评审门禁

独立评审人必须同时满足：

- 不是项目执行人厉飞雨；
- 不是 P0 文档作者或该候选提交的作者；
- 能够检查范围、架构、安全、测试/发布门禁和 Git 证据；
- 对发现的问题能够给出“通过、条件通过、拒绝”结论。

最迟介入阶段：**P0 出口、P1 恢复之前**。未完成时，P1 技术草案可以保留，但不得继续采集/批准运行时契约快照，也不得把 ADR 标记为 Accepted。

评审记录模板：

| 字段 | 内容 |
|---|---|
| 评审人姓名 | 阿格尼 |
| 与作者/执行人的独立性说明 | 非项目执行人厉飞雨，非候选提交作者；以非作者 AI 技术评审身份审阅 |
| 评审候选标签 | `p0-baseline-candidate-2026-10-07` |
| 评审结论 | 通过 |
| 必改项 | 无 P0 阻断项 |
| 风险接受项 | MySQL 多版本迁移验证；单人多职后续独立复核；性能目标后续实测；生产发布需人类授权 |
| 日期 | 2026-10-07 |
| 签字/可验证身份 | 阿格尼；记录见 `reviews/2026-10-07-agni-p0-review.md` |

评审记录：[`reviews/2026-10-07-agni-p0-review.md`](./reviews/2026-10-07-agni-p0-review.md)。

通过后的操作：

1. [x] 将评审结论和问题处置写入本文件及风险登记表。
2. [x] 新提交评审证据和必要修正。
3. [x] 将 ADR 状态改为 Accepted，P0 改为 DONE。
4. [x] 在评审证据提交创建正式标签 `p0-baseline-v1`。
5. [x] 恢复 P1。

## 3. Git 非法引用修复

2026-10-07 发现以下非法 ref 名称导致 `git show-ref`、`git log --all` 和 `git fsck` 报错：

| 原路径 | 内容指向 | 处置 | 可恢复备份 |
|---|---|---|---|
| `.git/refs/heads/feat/customer-order-api 2` | `99093da4d04eaf93d68a3516886947b1bf4938ef` | 从 refs 移出 | `/private/tmp/yisu-hotel-invalid-git-refs-20261007/heads/customer-order-api 2` |
| `.git/refs/heads/feat/customer-order-api 3` | `b4175a9d81b2528ad07257a4997e2df2b41aa972` | 从 refs 移出 | `/private/tmp/yisu-hotel-invalid-git-refs-20261007/heads/customer-order-api 3` |
| `.git/refs/remotes/origin/feat/customer-order-api 2` | `b4175a9d81b2528ad07257a4997e2df2b41aa972` | 从 refs 移出 | `/private/tmp/yisu-hotel-invalid-git-refs-20261007/remotes-origin/customer-order-api 2` |

修复前已验证两个目标提交都是当前 `HEAD` 的祖先，因此移出非法 ref 不会造成提交不可达。修复后：

- `git show-ref --heads` 正常；
- `git log --all` 正常；
- `git fsck --full --no-reflogs` 不再报告 bad ref，仅报告原有 dangling objects。

禁止把备份文件原名复制回 `.git/refs`。若需要为这些提交建立引用，必须使用符合 `git check-ref-format` 的新名称。
