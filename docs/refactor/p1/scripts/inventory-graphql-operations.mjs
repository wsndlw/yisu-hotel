import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';

const repositoryRoot = path.resolve(process.cwd());
const requireFromServer = createRequire(path.join(repositoryRoot, 'server/package.json'));
const { buildSchema } = requireFromServer('graphql');
const schemaSource = fs.readFileSync(path.join(repositoryRoot, 'server/schema.gql'), 'utf8');
const schema = buildSchema(schemaSource);
const schemaFields = {
  query: new Set(Object.keys(schema.getQueryType()?.getFields() ?? {})),
  mutation: new Set(Object.keys(schema.getMutationType()?.getFields() ?? {})),
};
const clients = [
  { name: 'PC', root: 'client-pc/src' },
  { name: 'Mobile', root: 'client-mobile/src' },
];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return /\.(?:ts|tsx|js|jsx)$/.test(entry.name) ? [absolute] : [];
  });
}

function relative(file) {
  return path.relative(repositoryRoot, file).split(path.sep).join('/');
}

function lineNumber(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

function resolveLocalImport(importer, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(importer), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
    path.join(base, 'index.jsx'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

function reverseImportGraph(files) {
  const reverse = new Map();
  for (const importer of files) {
    const source = fs.readFileSync(importer, 'utf8');
    const importPattern = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importPattern.exec(source)) !== null) {
      const imported = resolveLocalImport(importer, match[1]);
      if (!imported) continue;
      if (!reverse.has(imported)) reverse.set(imported, new Set());
      reverse.get(imported).add(importer);
    }
  }
  return reverse;
}

function transitiveImporters(startFiles, reverse) {
  const seen = new Set(startFiles);
  const queue = [...startFiles];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const importer of reverse.get(current) ?? []) {
      if (seen.has(importer)) continue;
      seen.add(importer);
      queue.push(importer);
    }
  }
  return [...seen];
}

const operations = [];

for (const client of clients) {
  const root = path.join(repositoryRoot, client.root);
  const files = walk(root);
  const graphqlFiles = files.filter((file) => relative(file).includes('/graphql/'));
  const reverseImports = reverseImportGraph(files);

  for (const file of graphqlFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const documentPattern = /^[ \t]*export\s+const\s+([A-Z][A-Z0-9_]*)\s*=\s*gql\s*`([\s\S]*?)`\s*;/gm;
    let documentMatch;

    while ((documentMatch = documentPattern.exec(source)) !== null) {
      const [, exportName, document] = documentMatch;
      const operationPattern = /\b(query|mutation)\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:\([^)]*\))?\s*\{\s*([A-Za-z_][A-Za-z0-9_]*)/g;
      let operationMatch;

      while ((operationMatch = operationPattern.exec(document)) !== null) {
        const [, kind, operationName, rootField] = operationMatch;
        const usedBy = files
          .filter((candidate) => candidate !== file)
          .filter((candidate) => {
            const candidateSource = fs.readFileSync(candidate, 'utf8');
            return new RegExp(`\\b${exportName}\\b`).test(candidateSource);
          })
          .map(relative)
          .sort();
        const directConsumerFiles = usedBy.map((consumer) => path.join(repositoryRoot, consumer));
        const transitiveConsumers = transitiveImporters(directConsumerFiles, reverseImports)
          .map(relative)
          .sort();
        const pageConsumers = transitiveConsumers.filter((consumer) =>
          consumer.includes('/pages/') || consumer.includes('/containers/'),
        );

        operations.push({
          client: client.name,
          kind,
          operationName,
          rootField,
          exportName,
          definition: relative(file),
          line: lineNumber(source, documentMatch.index),
          usedBy,
          pageConsumers,
          schemaRootFieldPresent: schemaFields[kind].has(rootField),
        });
      }
    }
  }
}

operations.sort((a, b) =>
  a.client.localeCompare(b.client) ||
  a.kind.localeCompare(b.kind) ||
  a.operationName.localeCompare(b.operationName),
);

const duplicateNames = [...new Set(
  operations
    .filter((operation, index) =>
      operations.findIndex((candidate) => candidate.operationName === operation.operationName) !== index,
    )
    .map((operation) => operation.operationName),
)].sort();

const unused = operations.filter((operation) => operation.usedBy.length === 0);
const missingRootFields = operations
  .filter((operation) => !operation.schemaRootFieldPresent)
  .map((operation) => `${operation.kind}.${operation.rootField}`);
const summary = {
  generatedAt: new Date().toISOString(),
  totals: {
    all: operations.length,
    queries: operations.filter((operation) => operation.kind === 'query').length,
    mutations: operations.filter((operation) => operation.kind === 'mutation').length,
    pc: operations.filter((operation) => operation.client === 'PC').length,
    mobile: operations.filter((operation) => operation.client === 'Mobile').length,
    unused: unused.length,
  },
  duplicateOperationNames: duplicateNames,
  missingSchemaRootFields: [...new Set(missingRootFields)].sort(),
  operations,
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
