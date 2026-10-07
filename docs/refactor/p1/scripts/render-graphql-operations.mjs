import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repositoryRoot = path.resolve(process.cwd());
const reportPath = path.join(repositoryRoot, 'docs/refactor/p1/reports/graphql-operations.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const lines = [
  '# P1 GraphQL Operation 使用矩阵',
  '',
  `> 生成时间：${report.generatedAt}  `,
  '> 来源：PC/移动端源码静态扫描；页面通过本地 import 依赖链反向追踪。',
  '',
  '## 汇总',
  '',
  `- Operation：${report.totals.all} 个（Query ${report.totals.queries}、Mutation ${report.totals.mutations}）。`,
  `- PC：${report.totals.pc} 个；移动端：${report.totals.mobile} 个。`,
  `- 未被引用的文档：${report.totals.unused} 个。`,
  `- Schema 缺失根字段：${report.missingSchemaRootFields.length} 个。`,
  '',
  '## 已知差异',
  '',
  '- `Mobile/GetTagsForH5` 实际被页面链路引用，但 `Query.getTagsForH5` 不存在于当前 Schema。',
  '- `PC/RoomTypeCalendar` 未被引用，且 `Query.roomTypeCalendar` 不存在；实际页面使用 `merchantRoomTypeCalendar`。',
  '- PC 和移动端的六个认证 operation 使用相同 operation name，属于跨客户端重复，不是单次请求冲突。',
  '',
  '## 使用矩阵',
  '',
  '| 端 | 类型 | Operation | 根字段 | Schema | 定义 | 页面/容器消费者 |',
  '|---|---|---|---|---|---|---|',
];

for (const operation of report.operations) {
  const definition = `${operation.definition}:${operation.line}`;
  const consumers = operation.pageConsumers.length > 0
    ? operation.pageConsumers.map((consumer) => `\`${consumer}\``).join('<br>')
    : '—';
  lines.push(
    `| ${operation.client} | ${operation.kind} | \`${operation.operationName}\` | \`${operation.rootField}\` | ${operation.schemaRootFieldPresent ? '存在' : '**缺失**'} | \`${definition}\` | ${consumers} |`,
  );
}

lines.push(
  '',
  '## 可重复生成',
  '',
  '在仓库根目录运行：',
  '',
  '```bash',
  'node docs/refactor/p1/scripts/inventory-graphql-operations.mjs',
  'node docs/refactor/p1/scripts/render-graphql-operations.mjs',
  '```',
  '',
  '第一个命令将 JSON 输出到标准输出；更新快照时需经过评审后覆盖 `reports/graphql-operations.json`。第二个命令将 Markdown 输出到标准输出。',
  '',
);

process.stdout.write(lines.join('\n'));
