import * as stencilCompiler from '@stencil/core/compiler';
import { dirname } from 'node:path';
import type TS from 'typescript';

type TypeScript = typeof TS;

/**
 * `@stencil/core/compiler` ships the TypeScript instance the Stencil compiler is built
 * against. Reusing it keeps type resolution identical to `transpile()` and avoids adding
 * a `typescript` dependency to this package. It is exported at runtime but not typed.
 */
const ts = (stencilCompiler as unknown as { ts: TypeScript }).ts;

interface ResolveVarCall {
  arg: TS.Identifier | TS.PropertyAccessExpression;
  call: TS.CallExpression;
}

interface TextEdit {
  end: number;
  start: number;
  text: string;
}

let cachedProgram: TS.Program | undefined;
let cachedOptionsKey: string | undefined;

/** Parsed source files for everything except the file being transformed, keyed by path. */
const sourceFileCache = new Map<string, { mtime: number; sourceFile: TS.SourceFile }>();

function normalize(fileName: string): string {
  return fileName.replace(/\\/g, '/');
}

function isResolveVarCallee(expression: TS.Expression): boolean {
  if (ts.isIdentifier(expression)) {
    return expression.text === 'resolveVar';
  }
  return (
    ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.name) &&
    expression.name.text === 'resolveVar'
  );
}

function rootIdentifier(node: TS.Expression): TS.Identifier | undefined {
  let current: TS.Expression = node;
  while (ts.isPropertyAccessExpression(current)) {
    current = current.expression;
  }
  return ts.isIdentifier(current) ? current : undefined;
}

/**
 * Names bound by value `import` declarations in the file. `resolveVar()` arguments rooted
 * at one of these cannot be resolved by Stencil's single-file `transpile()`.
 */
function collectImportedBindings(sourceFile: TS.SourceFile): Set<string> {
  const names = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) continue;
    const { importClause } = statement;
    if (importClause.isTypeOnly) continue;
    if (importClause.name) names.add(importClause.name.text);
    const bindings = importClause.namedBindings;
    if (!bindings) continue;
    if (ts.isNamespaceImport(bindings)) {
      names.add(bindings.name.text);
    } else {
      for (const element of bindings.elements) {
        if (!element.isTypeOnly) names.add(element.name.text);
      }
    }
  }
  return names;
}

function findImportedResolveVarCalls(sourceFile: TS.SourceFile): ResolveVarCall[] {
  const imported = collectImportedBindings(sourceFile);
  if (imported.size === 0) return [];

  const calls: ResolveVarCall[] = [];
  const visit = (node: TS.Node): void => {
    if (ts.isCallExpression(node) && node.arguments.length === 1 && isResolveVarCallee(node.expression)) {
      const arg = node.arguments[0];
      if (ts.isIdentifier(arg) || ts.isPropertyAccessExpression(arg)) {
        const root = rootIdentifier(arg);
        if (root && imported.has(root.text)) {
          calls.push({ arg, call: node });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return calls;
}

/**
 * Compiler options for the type-check-only program. Starts from the nearest `tsconfig.json`
 * so `paths`, `baseUrl` and `moduleResolution` match the project, then forces the settings
 * that make module resolution work and emit irrelevant.
 */
function loadCompilerOptions(fileName: string): TS.CompilerOptions {
  let projectOptions: TS.CompilerOptions = {};
  const configPath = ts.findConfigFile(dirname(fileName), ts.sys.fileExists);
  if (configPath) {
    const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
    if (config) {
      projectOptions = ts.parseJsonConfigFileContent(config, ts.sys, dirname(configPath)).options;
    }
  }

  return {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ESNext,
    ...projectOptions,
    // The program exists only to answer type queries; never emit or build-info.
    composite: undefined,
    declaration: false,
    declarationMap: false,
    incremental: undefined,
    inlineSourceMap: false,
    isolatedModules: false,
    noEmit: true,
    noResolve: false,
    skipLibCheck: true,
    sourceMap: false,
    tsBuildInfoFile: undefined,
    jsx: projectOptions.jsx ?? ts.JsxEmit.Preserve,
  };
}

function createProgram(fileName: string, code: string, options: TS.CompilerOptions): TS.Program {
  const target = normalize(fileName);
  const host = ts.createCompilerHost(options, true);
  const getSourceFile = host.getSourceFile.bind(host);

  host.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) => {
    if (normalize(name) === target) {
      // Use the in-memory code Vite handed us, not what is on disk.
      return ts.createSourceFile(name, code, languageVersion, true, ts.ScriptKind.TSX);
    }

    const mtime = ts.sys.getModifiedTime?.(name)?.getTime() ?? 0;
    const cached = sourceFileCache.get(name);
    if (cached && cached.mtime === mtime) {
      return cached.sourceFile;
    }
    const sourceFile = getSourceFile(name, languageVersion, onError, shouldCreateNewSourceFile);
    if (sourceFile) {
      sourceFileCache.set(name, { mtime, sourceFile });
    }
    return sourceFile;
  };

  const optionsKey = JSON.stringify(options);
  const oldProgram = cachedOptionsKey === optionsKey ? cachedProgram : undefined;
  const program = ts.createProgram({ rootNames: [fileName], options, host, oldProgram });
  cachedProgram = program;
  cachedOptionsKey = optionsKey;
  return program;
}

/**
 * Mirrors the compiler's fallback: when the type is widened to `string` (object declared
 * without `as const`), read the string literal initializer off the declaration instead.
 */
function literalFromDeclaration(checker: TS.TypeChecker, node: TS.Node): string | undefined {
  let symbol = checker.getSymbolAtLocation(node);
  if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  const declaration = symbol?.valueDeclaration;
  if (!declaration) return undefined;

  const initializer =
    ts.isPropertyAssignment(declaration) || ts.isVariableDeclaration(declaration) ? declaration.initializer : undefined;
  if (initializer && (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer))) {
    return initializer.text;
  }
  return undefined;
}

function resolveStringValue(checker: TS.TypeChecker, arg: TS.Expression): string | undefined {
  const type = checker.getTypeAtLocation(arg);
  if (type.isStringLiteral()) {
    return type.value;
  }
  return literalFromDeclaration(checker, arg);
}

/**
 * Replaces `resolveVar(<imported const>)` calls with the string literal they resolve to.
 *
 * Stencil's `transpile()` type-checks a single file with module resolution disabled, so
 * `resolveVar()` can only see `const` declarations in that same file. Components that import
 * their event-name catalog (`import { EVENTS } from '@my/pkg'`) compile fine under
 * `stencil build` but fail in the per-file transform this plugin performs.
 *
 * This runs a lightweight type-check-only program with real module resolution (honouring the
 * project's `tsconfig.json`) and inlines the resolved literal before handing the source to
 * Stencil. Same-file constants are left untouched - Stencil already handles those - and
 * anything that does not resolve to a string literal is left in place so the Stencil compiler
 * reports its usual diagnostic.
 *
 * @param code the component source
 * @param fileName the absolute path of the component source
 * @returns the source with imported `resolveVar()` calls inlined, or `code` unchanged
 */
export function inlineImportedResolveVars(code: string, fileName: string): string {
  if (!code.includes('resolveVar(')) return code;

  const probe = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (findImportedResolveVarCalls(probe).length === 0) return code;

  const edits: TextEdit[] = [];
  try {
    const options = loadCompilerOptions(fileName);
    const program = createProgram(fileName, code, options);
    const sourceFile = program.getSourceFile(fileName);
    if (!sourceFile) return code;

    const checker = program.getTypeChecker();
    for (const { arg, call } of findImportedResolveVarCalls(sourceFile)) {
      const value = resolveStringValue(checker, arg);
      if (value === undefined) continue;
      edits.push({ end: call.getEnd(), start: call.getStart(sourceFile), text: JSON.stringify(value) });
    }
  } catch {
    // Fall through with the original source; Stencil's transpile() reports its own diagnostic.
    return code;
  }
  if (edits.length === 0) return code;

  // Apply from the end so earlier offsets stay valid.
  edits.sort((a, b) => b.start - a.start);
  let output = code;
  for (const edit of edits) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  return output;
}
