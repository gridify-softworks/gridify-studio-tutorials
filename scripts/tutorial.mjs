// Runs a tutorial: `npm run tutorial 130` (or `130-languages`, `tutorial-130`; the start of a number or a name is enough when only one tutorial has it). It starts `ng serve tutorial-130 --open`
// with the Angular CLI of the workspace, and the tutorial is on http://localhost:30130 (every tutorial has a port of its own: 30000 + its number). More options go to `ng serve` as they are:
// `npm run tutorial 130 -- --port 4300`.
//
// `npm run tutorials` (this script with `--list`) lists them all: number, folder, address and what each one shows.
// `--dry-run` prints the command instead of running it.

import {spawn} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {findTutorials, formatList, listTutorials, requireInstalled} from './tutorials-workspace.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const rest = args.filter(arg => arg !== '--dry-run' && arg !== '--list');
const tutorials = listTutorials(root);

if (args.includes('--list') || rest.length === 0) {
    console.log(`The tutorials (npm run tutorial <number>):\n${formatList(tutorials)}`);
    process.exit(0);
}

const [name, ...more] = rest;
// `npm run tutorial 130 -- --port 4300`: npm takes the `--` away; when the script is run by hand it may still be there.
const ngArgs = more[0] === '--' ? more.slice(1) : more;
const found = findTutorials(tutorials, name);
if (found.length !== 1) {
    console.log(found.length === 0 ? `No tutorial is "${name}". The tutorials:` : `"${name}" fits ${found.length} tutorials; name one of them:`);
    console.log(formatList(found.length ? found : tutorials));
    process.exit(1);
}

const [tutorial] = found;
const command = ['serve', tutorial.project, '--open', ...ngArgs];
// `-- --port 4300` serves it elsewhere: the address says so.
const portAt = ngArgs.findIndex(arg => arg === '--port' || arg.startsWith('--port='));
const port = portAt < 0 ? tutorial.port : ngArgs[portAt].includes('=') ? ngArgs[portAt].split('=')[1] : ngArgs[portAt + 1];
console.log(`Tutorial ${tutorial.folder}: http://localhost:${port}  (ng ${command.join(' ')})`);
if (dryRun) process.exit(0);

const ng = requireInstalled(root, 'npm run tutorial');
const child = spawn(process.execPath, [ng, ...command], {cwd: root, stdio: 'inherit'});
child.on('exit', code => process.exit(code ?? 0));
