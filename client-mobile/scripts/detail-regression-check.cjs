const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");
const ts = require("typescript");

const files = [
  "App.tsx",
  "src/navigation/requireAuth.ts",
  "src/pages/login/LoginPage.tsx",
  "src/pages/detail/DetailPage.tsx",
  "src/pages/list/ListPage.tsx",
  "src/pages/search/SearchPage.tsx",
  "src/components/DateSelectorModal.tsx",
  "src/components/Detail-DateSelectorModal.tsx",
  "src/components/Detail-CustomCalendar.tsx",
  "src/pages/detail/components/detail-navigation-bar.tsx",
  "src/pages/detail/components/detail-bottom-bar.tsx",
  "src/pages/detail/components/hotel-hero.tsx",
  "src/pages/detail/components/room-section.tsx",
  "src/pages/detail/components/room-type-card.tsx",
  "src/pages/detail/components/rate-plan-row.tsx",
  "src/pages/bookingConfirm/BookingConfirmPage.tsx",
  "src/store/bookingStore.ts",
  "src/services/order.ts",
  "src/utils/apollo.ts",
];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function checkRelativeImports(file, source) {
  for (const match of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
    const base = path.resolve(path.dirname(file), match[1]);
    const candidates = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      path.join(base, "index.ts"),
      path.join(base, "index.tsx"),
    ];
    invariant(
      candidates.some((candidate) => fs.existsSync(candidate)),
      `${file}: missing relative import ${match[1]}`,
    );
  }
}

for (const file of files) {
  const source = read(file);
  const syntax = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const errors = (syntax.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  invariant(
    errors.length === 0,
    `${file}: ${errors
      .map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      )
      .join("\n")}`,
  );
  babel.transformFileSync(file, { configFile: "./babel.config.js" });
  invariant(
    !source.split(/\r?\n/).some((line) => /[ \t]+$/.test(line)),
    `${file}: trailing whitespace`,
  );
  checkRelativeImports(file, source);
}

const roots = files.map((file) => path.resolve(file));
const rootSet = new Set(roots);
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
invariant(!config.error, "tsconfig.json cannot be read");
const parsed = ts.parseJsonConfigFileContent(
  config.config,
  ts.sys,
  process.cwd(),
  { noEmit: true, skipLibCheck: true },
  "tsconfig.json",
);
const program = ts.createProgram({ rootNames: roots, options: parsed.options });
const diagnostics = ts
  .getPreEmitDiagnostics(program)
  .filter(
    (diagnostic) =>
      diagnostic.file && rootSet.has(path.resolve(diagnostic.file.fileName)),
  );
invariant(
  diagnostics.length === 0,
  diagnostics
    .map((diagnostic) => {
      const position =
        diagnostic.file && diagnostic.start != null
          ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
          : null;
      return `${diagnostic.file?.fileName || ""}${
        position ? `:${position.line + 1}:${position.character + 1}` : ""
      } ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`;
    })
    .join("\n"),
);

const app = read("App.tsx");
const detail = read("src/pages/detail/DetailPage.tsx");
const dateModal = read("src/components/Detail-DateSelectorModal.tsx");
const calendar = read("src/components/Detail-CustomCalendar.tsx");
const login = read("src/pages/login/LoginPage.tsx");
const list = read("src/pages/list/ListPage.tsx");
const search = read("src/pages/search/SearchPage.tsx");
const bottomBar = read("src/pages/detail/components/detail-bottom-bar.tsx");
const navigationBar = read(
  "src/pages/detail/components/detail-navigation-bar.tsx",
);
const roomCard = read("src/pages/detail/components/room-type-card.tsx");
const ratePlan = read("src/pages/detail/components/rate-plan-row.tsx");
const apollo = read("src/utils/apollo.ts");

invariant(
  app.includes("<SafeAreaProvider>") && app.includes("</SafeAreaProvider>"),
  "SafeAreaProvider is missing at the application root",
);
invariant(
  navigationBar.includes("useSafeAreaInsets") &&
    bottomBar.includes("useSafeAreaInsets"),
  "detail navigation or bottom action bar is missing safe-area insets",
);
invariant(
  ![detail, dateModal, calendar, roomCard, ratePlan].some((source) =>
    source.includes("Dimensions.get("),
  ),
  "detail flow contains a fixed Dimensions.get measurement",
);
invariant(
  dateModal.includes("const CALENDAR_MONTH_COUNT = 6") &&
    dateModal.includes("useHotelMinPriceCalendar") &&
    dateModal.includes("重新加载"),
  "multi-month pricing calendar or its retry state is incomplete",
);
invariant(
  calendar.includes("'无房'") &&
    calendar.includes("disabled={isDisabled}") &&
    calendar.includes("isInRange"),
  "calendar availability or selection states are incomplete",
);
invariant(
  detail.indexOf("updateBooking({") <
    detail.indexOf("requireAuth(navigation, 'BookingConfirm')"),
  "booking selection is not saved before unauthenticated navigation",
);
invariant(
  login.includes("route.params?.redirectTo === 'BookingConfirm'") &&
    login.includes("navigation.replace('BookingConfirm')"),
  "post-login booking continuation is missing",
);
invariant(
  detail.includes("AsyncStorage.getItem('favoriteHotels')") &&
    detail.includes("AsyncStorage.setItem('favoriteHotels'"),
  "favorite persistence is incomplete",
);
invariant(
  roomCard.includes("defaultExpanded") &&
    roomCard.includes("RatePlanRow") &&
    ratePlan.includes("disabled={soldOut || !hasPrice || nights <= 0}"),
  "room expansion or sold-out booking protection is incomplete",
);
invariant(
  list.includes("from '../../components/DateSelectorModal'") &&
    search.includes("from '../../components/DateSelectorModal'") &&
    !list.includes("Detail-DateSelectorModal") &&
    !search.includes("Detail-DateSelectorModal"),
  "list/search date-selector isolation was broken",
);
invariant(
  apollo.includes("process.env.EXPO_PUBLIC_GRAPHQL_URL") &&
    apollo.includes("http://localhost:3000/graphql"),
  "GraphQL endpoint is not configurable for physical devices",
);

console.log(
  `Detail regression checks passed: ${files.length} syntax/Babel/semantic/import checks and 10 flow invariants.`,
);
