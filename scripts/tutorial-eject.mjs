// A tutorial as an Angular project of its own: `npm run tutorial:eject 130 ../my-languages` writes into the folder (it must be empty or new) a complete application, the one `ng new` makes,
// with the code of the tutorial: package.json, angular.json (one project, on http://localhost:4200), tsconfig.json, tsconfig.app.json, .gitignore, .editorconfig, .npmrc, the Prettier settings
// of the tutorials, src, public, the README and the license agreement of this repository (LICENSE.md). Then `npm i` and `ng serve` (or `npm start`) in that folder.
//
// The library: `@gridify/studio` in the version of this library (`^x.y.z`), from npm. `--library <spec>` takes another one: a version (`--library ^1.2.0`), or a package folder or file
// (`--library dist/studio-community`, `--library ./gridify-studio-1.0.0.tgz`): a folder is packed by npm into the new project, a file is copied there, and the project installs it from there.
//
// The folder is taken from where the command was typed (npm runs the script in the root of the workspace, and tells the place in INIT_CWD).

import {cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {findTutorials, formatJson, formatList, libraryInto, listTutorials, TUTORIALS} from './tutorials-workspace.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const libraryAt = args.indexOf('--library');
const library = libraryAt >= 0 ? args[libraryAt + 1] : undefined;
const [name, target] = args.filter((arg, index) => !arg.startsWith('--') && (libraryAt < 0 || index !== libraryAt + 1));
const tutorials = listTutorials(root);

if (!name || !target) {
    console.log(`Usage: npm run tutorial:eject <tutorial> <folder> [-- --library <version, package folder or .tgz>]\nThe tutorials:\n${formatList(tutorials)}`);
    process.exit(1);
}
const found = findTutorials(tutorials, name);
if (found.length !== 1) {
    console.log(found.length === 0 ? `No tutorial is "${name}". The tutorials:` : `"${name}" fits ${found.length} tutorials; name one of them:`);
    console.log(formatList(found.length ? found : tutorials));
    process.exit(1);
}
const [tutorial] = found;
const here = process.env['INIT_CWD'] ?? process.cwd();
const dir = resolve(here, target);
if (existsSync(dir) && readdirSync(dir).length > 0) {
    console.error(`tutorial:eject: ${dir} is not empty. Name a new or an empty folder.`);
    process.exit(1);
}

const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const angular = JSON.parse(readFileSync(join(root, 'angular.json'), 'utf8'));
const project = angular.projects[tutorial.project];
if (!project) {
    console.error(`tutorial:eject: angular.json has no project ${tutorial.project}; run npm run tutorials:sync first.`);
    process.exit(1);
}

/**
 * `@gridify/studio` for the project: the one given (`--library`), the one of the workspace (the samples to download name the version on npm, or a file next to their package.json), or the
 * version of the library of this repository. A folder or a file goes into the project (see libraryInto).
 */
function librarySpec() {
    if (library) return libraryInto(dir, library, here);
    const known = rootPackage.dependencies?.['@gridify/studio'];
    if (known?.startsWith('file:')) return libraryInto(dir, known, root);
    if (known) return known;
    const own = join(root, 'src', 'app', 'components', 'package.json');
    return `^${existsSync(own) ? JSON.parse(readFileSync(own, 'utf8')).version : '0.0.0'}`;
}
mkdirSync(dir, {recursive: true});
const studio = librarySpec();
const versionOf = name => rootPackage.dependencies?.[name] ?? rootPackage.devDependencies?.[name];
const short = tutorial.folder.replace(/^\d{3}-/, '');
const styles = project.architect.build.options.styles.map(style => style.replace(`${TUTORIALS}/${tutorial.folder}/`, ''));
const usesPrimeIcons = styles.some(style => style.includes('primeicons'));

const pick = names => Object.fromEntries(names.filter(name => versionOf(name)).map(name => [name, versionOf(name)]));
const packageJson = {
    name: short,
    version: '0.0.0',
    scripts: {ng: 'ng', start: 'ng serve', build: 'ng build', watch: 'ng build --watch --configuration development'},
    private: true,
    dependencies: {
        ...pick(['@angular/common', '@angular/compiler', '@angular/core', '@angular/forms', '@angular/platform-browser', '@angular/router']),
        '@gridify/studio': studio,
        ...(usesPrimeIcons ? pick(['primeicons']) : {}),
        ...pick(['rxjs', 'tslib']),
    },
    devDependencies: pick(['@angular/build', '@angular/cli', '@angular/compiler-cli', 'typescript']),
};

const build = project.architect.build;
const angularJson = {
    $schema: './node_modules/@angular/cli/lib/config/schema.json',
    version: 1,
    cli: {packageManager: 'npm', analytics: false},
    newProjectRoot: 'projects',
    projects: {
        [short]: {
            projectType: 'application',
            schematics: {'@schematics/angular:component': {style: 'scss'}},
            root: '',
            sourceRoot: 'src',
            prefix: 'app',
            architect: {
                build: {
                    builder: '@angular/build:application',
                    options: {browser: 'src/main.ts', tsConfig: 'tsconfig.app.json', inlineStyleLanguage: 'scss', assets: [{glob: '**/*', input: 'public'}], styles},
                    configurations: {
                        production: {budgets: build.configurations.package?.budgets ?? build.configurations.production?.budgets, outputHashing: 'all'},
                        development: {optimization: false, extractLicenses: false, sourceMap: true},
                    },
                    defaultConfiguration: 'production',
                },
                serve: {
                    builder: '@angular/build:dev-server',
                    configurations: {production: {buildTarget: `${short}:build:production`}, development: {buildTarget: `${short}:build:development`}},
                    defaultConfiguration: 'development',
                },
            },
        },
    },
};

// The compiler options of the tutorials, without the line that leads the library to its source in the repository.
const options = readFileSync(join(root, TUTORIALS, 'tsconfig.json'), 'utf8')
    .replace(/^\/\*.*\*\/\r?\n/m, '')
    .replace(/,\s*"paths":\s*\{[^}]*\}/s, '');
const tsconfig = `/* To learn more about Typescript configuration file: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html. */
/* To learn more about Angular compiler options: https://angular.dev/reference/configs/angular-compiler-options. */
${options.replace(/\n\}\s*$/, ',\n  "files": [],\n  "references": [\n    {\n      "path": "./tsconfig.app.json"\n    }\n  ]\n}\n')}`;
const tsconfigApp = `/* To learn more about Typescript configuration file: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html. */
/* To learn more about Angular compiler options: https://angular.dev/reference/configs/angular-compiler-options. */
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "include": ["src/**/*.ts"]
}
`;
const gitignore = `# Compiled output
/dist
/tmp
/out-tsc

# Node
/node_modules
npm-debug.log
yarn-error.log

# Angular
/.angular/cache
.sass-cache/

# IDEs and editors
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# System files
.DS_Store
Thumbs.db
`;
const editorconfig = `# Editor configuration, see https://editorconfig.org
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.ts]
quote_type = single
ij_typescript_use_double_quotes = false

[*.md]
max_line_length = off
trim_trailing_whitespace = false
`;
const npmrc = `# npm 10.9 stops with "Cannot read properties of null (reading 'edgesOut')" while it resolves the optional peer dependencies of @angular/build (vitest and the test
# environments) in a project without package-lock.json. The project has no tests: npm installs only what package.json names, and every peer dependency of the library is named there.
legacy-peer-deps=true
`;

const tutorialDir = join(root, TUTORIALS, tutorial.folder);
cpSync(join(tutorialDir, 'src'), join(dir, 'src'), {recursive: true});
if (existsSync(join(tutorialDir, 'public'))) cpSync(join(tutorialDir, 'public'), join(dir, 'public'), {recursive: true});
cpSync(join(root, TUTORIALS, '.prettierrc.json'), join(dir, '.prettierrc.json'));
const readme = readFileSync(join(tutorialDir, 'README.md'), 'utf8');
const note = `> Made from the tutorial \`${tutorial.folder}\` of Gridify by \`npm run tutorial:eject\`. Run it here with \`npm i\` and then \`ng serve\` (or \`npm start\`): http://localhost:4200. Where the text below says \`npm run tutorial ${tutorial.number}\` and http://localhost:${tutorial.port}, that is the workspace of the tutorials.\n\n`;
writeFileSync(join(dir, 'README.md'), readme.replace(/^(# .*\r?\n\r?\n)/, `$1${note}`));
writeFileSync(join(dir, 'package.json'), formatJson(packageJson, '  ') + '\n');
writeFileSync(join(dir, 'angular.json'), formatJson(angularJson, '  ') + '\n');
writeFileSync(join(dir, 'tsconfig.json'), tsconfig);
writeFileSync(join(dir, 'tsconfig.app.json'), tsconfigApp);
writeFileSync(join(dir, '.gitignore'), gitignore);
writeFileSync(join(dir, '.editorconfig'), editorconfig);
writeFileSync(join(dir, '.npmrc'), npmrc);
if (existsSync(join(root, 'LICENSE.md'))) cpSync(join(root, 'LICENSE.md'), join(dir, 'LICENSE.md'));

console.log(`tutorial:eject: ${tutorial.folder} -> ${dir}
  @gridify/studio: ${studio}${studio === '^0.0.0' ? '  (this version is not on npm: give the package with --library, e.g. -- --library dist/studio-community after npm run build:studio:community)' : ''}
  Next: cd "${dir}"  then  npm i  and  ng serve  (http://localhost:4200)`);
if (basename(dir) !== short) console.log(`  (the project inside is called ${short})`);
