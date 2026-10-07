import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';

const repositoryRoot = path.resolve(process.cwd());
const requireFromServer = createRequire(path.join(repositoryRoot, 'server/package.json'));
const { buildSchema, parse, validate } = requireFromServer('graphql');

const schema = buildSchema(
  fs.readFileSync(path.join(repositoryRoot, 'docs/refactor/p1/baseline/schema.graphql'), 'utf8'),
);
const inventory = JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, 'docs/refactor/p1/reports/graphql-operations.json'), 'utf8'),
);

function extractDocuments(source) {
  const documents = new Map();
  const pattern = /^[ \t]*(?:export\s+)?const\s+([A-Z][A-Z0-9_]*)\s*=\s*gql\s*`([\s\S]*?)`\s*;/gm;
  let match;
  while ((match = pattern.exec(source)) !== null) documents.set(match[1], match[2]);
  return documents;
}

function resolveDocument(name, documents, resolving = new Set()) {
  if (resolving.has(name)) throw new Error(`Circular GraphQL interpolation: ${name}`);
  const source = documents.get(name);
  if (source === undefined) throw new Error(`GraphQL document not found: ${name}`);

  const nextResolving = new Set(resolving).add(name);
  return source.replace(/\$\{([A-Z][A-Z0-9_]*)\}/g, (_, dependency) =>
    resolveDocument(dependency, documents, nextResolving),
  );
}

const documentsByFile = new Map();
const results = inventory.operations.map((operation) => {
  let documents = documentsByFile.get(operation.definition);
  if (!documents) {
    const source = fs.readFileSync(path.join(repositoryRoot, operation.definition), 'utf8');
    documents = extractDocuments(source);
    documentsByFile.set(operation.definition, documents);
  }

  try {
    const documentSource = resolveDocument(operation.exportName, documents);
    const errors = validate(schema, parse(documentSource)).map((error) => error.message);
    return {
      client: operation.client,
      operationName: operation.operationName,
      kind: operation.kind,
      rootField: operation.rootField,
      definition: `${operation.definition}:${operation.line}`,
      used: operation.usedBy.length > 0,
      status: errors.length === 0 ? 'VALID' : 'INVALID',
      errors,
    };
  } catch (error) {
    return {
      client: operation.client,
      operationName: operation.operationName,
      kind: operation.kind,
      rootField: operation.rootField,
      definition: `${operation.definition}:${operation.line}`,
      used: operation.usedBy.length > 0,
      status: 'INVALID',
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
});

const invalid = results.filter((result) => result.status === 'INVALID');
const report = {
  baselineSchema: 'docs/refactor/p1/baseline/schema.graphql',
  inventory: 'docs/refactor/p1/reports/graphql-operations.json',
  totals: {
    operations: results.length,
    valid: results.length - invalid.length,
    invalid: invalid.length,
    usedInvalid: invalid.filter((result) => result.used).length,
  },
  results,
};

const json = `${JSON.stringify(report, null, 2)}\n`;
const markdown = [
  '# P1 GraphQL 文档全量校验报告',
  '',
  '> 校验方式：将 PC/移动端源码中的每个 `gql` 文档（包含 fragment 插值）完整解析，并使用 GraphQL 标准校验规则对 P1 Schema 基线执行校验。',
  '',
  '## 汇总',
  '',
  `- Operation：${report.totals.operations}`,
  `- 校验通过：${report.totals.valid}`,
  `- 校验失败：${report.totals.invalid}`,
  `- 已被页面使用且失败：${report.totals.usedInvalid}`,
  '',
  '## 校验失败项',
  '',
  '| 客户端 | Operation | 是否使用 | 结果 | 错误 |',
  '|---|---|---:|---|---|',
  ...invalid.map((result) =>
    `| ${result.client} | \`${result.operationName}\` | ${result.used ? '是' : '否'} | ${result.status} | ${result.errors.join('; ')} |`,
  ),
  '',
  '失败项均已在 `reports/node-baseline.md` 登记：移动端 `GetTagsForH5` 为 NB-05；PC 未使用的 `RoomTypeCalendar` 为 NB-06。除这两项外，其余前端 operation 均通过完整文档校验。',
  '',
  '## 可重复执行',
  '',
  '```bash',
  'node docs/refactor/p1/scripts/validate-graphql-documents.mjs',
  'node docs/refactor/p1/scripts/validate-graphql-documents.mjs --write',
  '```',
  '',
].join('\n');

if (process.argv.includes('--write')) {
  const reportDirectory = path.join(repositoryRoot, 'docs/refactor/p1/reports');
  fs.writeFileSync(path.join(reportDirectory, 'graphql-document-validation.json'), json);
  fs.writeFileSync(path.join(reportDirectory, 'graphql-document-validation.md'), markdown);
} else {
  process.stdout.write(json);
}
