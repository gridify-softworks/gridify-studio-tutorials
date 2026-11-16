// The tutorials as projects of one Angular workspace: what the scripts of the tutorials share (`tutorial.mjs`, `tutorials-sync.mjs`, `tutorial-eject.mjs`, `tutorials-check.mjs`,
// `export-samples.mjs`). A tutorial is a folder `tutorials/NNN-name` with `src/`, `public/`, `README.md` and `tsconfig.app.json`; it is the project `tutorial-NNN` of the `angular.json` of the
// root, served on the port 30000 + NNN (010 on 30010, 130 on 30130), so every tutorial has an address, and a `localStorage`, of its own.
//
// The same file runs in this repository and in the download of the samples (`npm run export:samples`): it reads only `angular.json`, `package.json` and the folder `tutorials`.

import {spawnSync} from 'node:child_process';
import {copyFileSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {basename, join, resolve} from 'node:path';

/** The folder of the tutorials, under the root of the workspace. */
export const TUTORIALS = 'tutorials';
/** The first port of the tutorials: a tutorial is served on this one plus its number. */
export const TUTORIAL_PORT_BASE = 30000;
/** Where `@use '@gridify/studio/styles'` finds the styles of the library when the library is its source (this repository): a load path of the tutorials (see `tutorials/.dev`). */
export const DEV_STYLE_LOAD_PATH = `${TUTORIALS}/.dev`;
/** Where the customer test (`npm run tutorials:check`) writes its TypeScript configurations and its builds. */
export const CHECK_DIR = 'tmp/tutorials-check';

/** A tutorial: its number (`010`), its folder (`010-hello-world`), its project (`tutorial-010`), its port and the one line that describes it. */
export function tutorialOf(folder, descriptions = new Map()) {
    const number = /^(\d{3})-/.exec(folder)?.[1];
    if (!number) return null;
    return {number, folder, project: `tutorial-${number}`, port: TUTORIAL_PORT_BASE + Number(number), description: descriptions.get(folder) ?? ''};
}

/** The tutorials of the workspace, in the order of their numbers. */
export function listTutorials(root) {
    const dir = join(root, TUTORIALS);
    if (!existsSync(dir)) return [];
    const descriptions = readDescriptions(root);
    return readdirSync(dir, {withFileTypes: true})
        .filter(entry => entry.isDirectory() && existsSync(join(dir, entry.name, 'src', 'main.ts')))
        .map(entry => tutorialOf(entry.name, descriptions))
        .filter(tutorial => tutorial !== null)
        .sort((a, b) => a.folder.localeCompare(b.folder));
}

/** The descriptions of the tutorials: the rows `| \`NNN-name\` | what it shows |` of the tables of `tutorials/README.md`, by the folder. */
export function readDescriptions(root) {
    const file = join(root, TUTORIALS, 'README.md');
    const found = new Map();
    if (!existsSync(file)) return found;
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
        const row = /^\|\s*`(\d{3}-[a-z0-9-]+)`\s*\|\s*(.*?)\s*\|\s*$/.exec(line);
        if (row) found.set(row[1], row[2]);
    }
    return found;
}

/** The first part of a description, short enough for a line of a list. */
export function shortDescription(text, width = 90) {
    const plain = text.replace(/`/g, '').replace(/\*\*/g, '');
    const first = plain.split(/(?<=[.:;])\s/)[0].replace(/[.:;]$/, '');
    return first.length <= width ? first : first.slice(0, width - 1).replace(/\s+\S*$/, '') + '…';
}

/**
 * Finds the tutorials a name means: a number (`130`, `13` as the start of numbers), a folder (`130-languages`, or its start), a project (`tutorial-130`). One match is the tutorial; several, or none,
 * the caller lists.
 */
export function findTutorials(tutorials, name) {
    const wanted = String(name)
        .trim()
        .replace(/^tutorial-/, '');
    const exact = tutorials.filter(t => t.number === wanted || t.folder === wanted);
    if (exact.length) return exact;
    return tutorials.filter(t => t.number.startsWith(wanted) || t.folder.startsWith(wanted));
}

/** The relative path of a file of a tutorial from the root of the workspace, with forward slashes (as `angular.json` writes them on every system). */
const at = (tutorial, path = '') => `${TUTORIALS}/${tutorial.folder}${path ? '/' + path : ''}`;

/** The budgets of a new tutorial project: a docking application is bigger than the starter budget of `ng new`. */
const DEFAULT_BUDGETS = [
    {type: 'initial', maximumWarning: '1MB', maximumError: '2MB'},
    {type: 'anyComponentStyle', maximumWarning: '4kB', maximumError: '8kB'},
];

/**
 * The project of a tutorial in `angular.json`. `existing` is the project as it is there now: what is not derived from the folder is kept (the budgets, global styles of a package such as
 * PrimeIcons before `src/styles.scss`). `dev`: the library is its source (this repository) — the tutorials then take its styles through the load path `tutorials/.dev`, and the customer test has its
 * configuration `package`; the download of the samples has neither.
 */
export function projectFor(tutorial, existing = undefined, dev = true) {
    const build = existing?.architect?.build;
    const ownStyles = (build?.options?.styles ?? []).filter(style => style !== at(tutorial, 'src/styles.scss'));
    // The budgets measure what a customer builds: the library from its package. Here (`dev`) they are those of the configuration `package`; a build from the source takes the whole library
    // (its modules are not marked free of side effects, and the styles of its components count as the styles of the tutorial), so it has none.
    const budgets = build?.configurations?.package?.budgets ?? build?.configurations?.production?.budgets ?? DEFAULT_BUDGETS;
    const options = {
        browser: at(tutorial, 'src/main.ts'),
        index: at(tutorial, 'src/index.html'),
        tsConfig: at(tutorial, 'tsconfig.app.json'),
        inlineStyleLanguage: 'scss',
        assets: [{glob: '**/*', input: at(tutorial, 'public')}],
        styles: [...ownStyles, at(tutorial, 'src/styles.scss')],
        outputPath: `dist/tutorials/${tutorial.folder}`,
    };
    // The load paths of Sass are `includePaths` in the options of `@angular/build:application`; its schema knows no other name and refuses the whole angular.json for one.
    if (dev) options.stylePreprocessorOptions = {includePaths: [DEV_STYLE_LOAD_PATH]};
    const configurations = {
        production: dev ? {outputHashing: 'all'} : {budgets, outputHashing: 'all'},
        development: {optimization: false, extractLicenses: false, sourceMap: true},
    };
    // The customer test: the library from the package (see tutorials-check.mjs), not from its source.
    if (dev) {
        configurations.package = {
            tsConfig: `${CHECK_DIR}/tsconfig.${tutorial.project}.json`,
            stylePreprocessorOptions: {includePaths: []},
            outputPath: `${CHECK_DIR}/dist/${tutorial.folder}`,
            budgets,
        };
    }
    return {
        projectType: 'application',
        schematics: {'@schematics/angular:component': {style: 'scss'}},
        root: at(tutorial),
        sourceRoot: at(tutorial, 'src'),
        prefix: 'app',
        architect: {
            build: {builder: '@angular/build:application', options, configurations, defaultConfiguration: 'production'},
            serve: {
                builder: '@angular/build:dev-server',
                // Here (`dev`) the dev server does not prebundle the libraries (see BUILD.md, "Vývoj"): a browser that kept the old prebundled files ran two copies of Angular. The download keeps the default.
                options: dev ? {port: tutorial.port, prebundle: false} : {port: tutorial.port},
                configurations: {
                    production: {buildTarget: `${tutorial.project}:build:production`},
                    development: {buildTarget: `${tutorial.project}:build:development`},
                },
                defaultConfiguration: 'development',
            },
        },
    };
}

/** The `tsconfig.app.json` of a tutorial: the compiler options of all the tutorials (`tutorials/tsconfig.json`) and the sources of this one. In the style of the tutorials (Prettier, 2 spaces). */
export function tsconfigAppFor(tutorial) {
    return `{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../out-tsc/${tutorial.project}",
    "types": []
  },
  "include": ["src/**/*.ts"]
}
`;
}

/** Is the project the one a tutorial needs (the same JSON)? */
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The workspace as the folders of the tutorials want it: the projects `tutorial-NNN` of `angular.json` (a new folder gets its project, a project whose folder is gone goes, a project that differs
 * from what its folder needs is put right) and the `tsconfig.app.json` of every tutorial. The other projects of `angular.json` stay as they are, and in their place. Returns what is (or would be)
 * changed; `write: false` changes nothing (`--check`).
 */
export async function syncWorkspace(root, {write = true, dev = true} = {}) {
    const changes = [];
    const tutorials = listTutorials(root);
    const angularFile = join(root, 'angular.json');
    const angular = JSON.parse(readFileSync(angularFile, 'utf8'));
    const projects = {};
    // The other projects first, in their order; then the tutorials, in the order of their numbers.
    for (const [name, project] of Object.entries(angular.projects)) if (!/^tutorial-\d{3}$/.test(name)) projects[name] = project;
    const wanted = new Set(tutorials.map(t => t.project));
    for (const name of Object.keys(angular.projects)) if (/^tutorial-\d{3}$/.test(name) && !wanted.has(name)) changes.push(`angular.json: the project ${name} goes (no folder)`);
    for (const tutorial of tutorials) {
        const existing = angular.projects[tutorial.project];
        const project = projectFor(tutorial, existing, dev);
        if (!existing) changes.push(`angular.json: a new project ${tutorial.project} (${tutorial.folder}, port ${tutorial.port})`);
        else if (!sameJson(existing, project)) changes.push(`angular.json: the project ${tutorial.project} is put right`);
        projects[tutorial.project] = project;
    }
    const next = {...angular, projects};
    const angularChanged = !sameJson(angular, next);
    for (const tutorial of tutorials) {
        const file = join(root, TUTORIALS, tutorial.folder, 'tsconfig.app.json');
        const text = tsconfigAppFor(tutorial);
        const now = existsSync(file) ? readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : null;
        if (now !== text) {
            changes.push(`${TUTORIALS}/${tutorial.folder}/tsconfig.app.json: ${now === null ? 'new' : 'put right'}`);
            if (write) writeFileSync(file, text);
        }
    }
    if (write && angularChanged) writeFileSync(angularFile, formatJson(next) + '\n');
    return changes;
}

/**
 * JSON in the style of `angular.json` (and of Prettier with the settings of this repository): objects one member a line with 4 spaces, a list of plain values on one line (`["src/styles.scss"]`),
 * a list with objects one item a line. So a generated file reads like a written one, and the projects that are not tutorials keep their text.
 */
export function formatJson(value, indent = '    ', depth = 0) {
    const pad = indent.repeat(depth + 1);
    const end = indent.repeat(depth);
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        if (value.every(item => item === null || typeof item !== 'object')) return `[${value.map(item => JSON.stringify(item)).join(', ')}]`;
        return `[\n${value.map(item => pad + formatJson(item, indent, depth + 1)).join(',\n')}\n${end}]`;
    }
    if (value !== null && typeof value === 'object') {
        const entries = Object.entries(value);
        if (entries.length === 0) return '{}';
        return `{\n${entries.map(([key, item]) => `${pad}${JSON.stringify(key)}: ${formatJson(item, indent, depth + 1)}`).join(',\n')}\n${end}}`;
    }
    return JSON.stringify(value);
}

/** The Angular CLI of the workspace (`node_modules/@angular/cli/bin/ng.js`), started by Node itself, so that it works on Windows too; `null` before `npm i`. */
export function angularCli(root) {
    const file = join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
    return existsSync(file) ? file : null;
}

/**
 * The packages of `package.json` (its dependencies and devDependencies) that are not in `node_modules`: one was added to `package.json` after the last `npm i` (060 needs `primeicons`). The CLI would
 * stop later on something like "Could not resolve node_modules/primeicons/primeicons.css"; the scripts say what is wrong at once instead.
 */
export function missingPackages(root) {
    const file = join(root, 'package.json');
    if (!existsSync(file)) return [];
    const pkg = JSON.parse(readFileSync(file, 'utf8'));
    return Object.keys({...pkg.dependencies, ...pkg.devDependencies})
        .filter(name => !existsSync(join(root, 'node_modules', name, 'package.json')))
        .sort();
}

/** Stops the script (`name` is its command) when `npm i` is due: the CLI is not installed, or a package of `package.json` is missing. Returns the path of the Angular CLI. */
export function requireInstalled(root, name) {
    const missing = missingPackages(root);
    const ng = angularCli(root);
    if (!ng || missing.length) {
        const what = !ng ? 'the Angular CLI is not installed' : `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} not installed`;
        console.error(`${name}: run npm i in the root of the repository first: ${what}.`);
        process.exit(1);
    }
    return ng;
}

/** npm, the way it runs this script (npm tells its own path in `npm_execpath`), or else the `npm` of the system. */
export function npm(cwd, npmArgs, options = {}) {
    const execPath = process.env['npm_execpath'];
    if (execPath && /\.[cm]?js$/.test(execPath)) return spawnSync(process.execPath, [execPath, ...npmArgs], {cwd, encoding: 'utf8', ...options});
    // Without npm around (`node scripts/...` typed by hand): the npm of the system; on Windows through the shell (npm is npm.cmd there), with a path that has a space in quotes.
    if (process.platform !== 'win32') return spawnSync('npm', npmArgs, {cwd, encoding: 'utf8', ...options});
    return spawnSync(
        'npm',
        npmArgs.map(arg => (/\s/.test(arg) ? `"${arg}"` : arg)),
        {cwd, encoding: 'utf8', shell: true, ...options}
    );
}

/**
 * `@gridify/studio` for the `package.json` of a new project in `dir`. A version (`^1.2.0`) stays as it is. A package folder (`dist/studio-community`) is packed by npm into `dir`, and a `.tgz`
 * file is copied there; the project then names the file (`file:./gridify-studio-0.0.0.tgz`), and npm installs it the way it installs a package from the registry. (A folder npm would only link,
 * and the library would then take Angular from the folder it lies in, not from the project.) `base` is the folder a relative path is taken from; `file:` in front is allowed.
 */
export function libraryInto(dir, spec, base) {
    const path = resolve(base, spec.replace(/^file:/, ''));
    if (!existsSync(path)) return spec;
    if (statSync(path).isDirectory()) {
        const packed = npm(dir, ['pack', path, '--pack-destination', dir, '--json'], {stdio: ['ignore', 'pipe', 'inherit']});
        if (packed.status !== 0) throw new Error(`npm pack ${path} failed`);
        const [{filename}] = JSON.parse(packed.stdout);
        return `file:./${basename(filename)}`;
    }
    copyFileSync(path, join(dir, basename(path)));
    return `file:./${basename(path)}`;
}

/** Tells, for every build that failed (`{tutorial, output}`), the first lines of its output that name an error. */
export function printFailures(failed) {
    for (const {tutorial, output} of failed) {
        const lines = output
            .split(/\r?\n/)
            .filter(line => /error|Error|✘/.test(line))
            .slice(0, 12);
        console.log(`\n${tutorial.folder}:\n${lines.map(line => `    ${line}`).join('\n')}`);
    }
}

/** The list of the tutorials as a text: number, folder, address, what it shows. */
export function formatList(tutorials) {
    const width = Math.max(...tutorials.map(t => t.folder.length), 6);
    return tutorials.map(t => `  ${t.number}  ${t.folder.padEnd(width)}  http://localhost:${t.port}  ${shortDescription(t.description)}`).join('\n');
}
