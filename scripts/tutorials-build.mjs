// Builds every tutorial (or the ones named) with the Angular CLI of the workspace, one after another, and tells which failed: `npm run tutorials:build` here, `npm run build` in the
// download of the tutorials (`npm run export:tutorials`), and the step of a CI that checks them all. The builds go to dist/tutorials/<folder> (the outputPath of each project).
//
// Usage: node scripts/tutorials-build.mjs [numbers or names of tutorials, e.g. 010 130-languages] [--configuration development]

import {spawnSync} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {findTutorials, listTutorials, printFailures, requireInstalled} from './tutorials-workspace.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const configurationAt = args.indexOf('--configuration');
const configuration = configurationAt >= 0 ? args[configurationAt + 1] : 'production';
const names = args.filter((arg, at) => !arg.startsWith('--') && (configurationAt < 0 || at !== configurationAt + 1));

const ng = requireInstalled(root, 'tutorials:build');

const all = listTutorials(root);
let tutorials = all;
if (names.length) {
    tutorials = [];
    for (const name of names) {
        const found = findTutorials(all, name);
        if (found.length !== 1) {
            console.error(`tutorials:build: "${name}" names ${found.length ? `${found.length} tutorials (${found.map(tutorial => tutorial.folder).join(', ')})` : 'no tutorial'}.`);
            process.exit(1);
        }
        if (!tutorials.includes(found[0])) tutorials.push(found[0]);
    }
}

const results = [];
for (const tutorial of tutorials) {
    process.stdout.write(`  ${tutorial.folder} ... `);
    const started = Date.now();
    const run = spawnSync(process.execPath, [ng, 'build', tutorial.project, '--configuration', configuration], {cwd: root, encoding: 'utf8'});
    const ok = run.status === 0;
    const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;
    const warnings = (output.match(/▲ \[WARNING\]|WARNING/g) ?? []).length;
    console.log(`${ok ? 'built' : 'FAILED'} (${((Date.now() - started) / 1000).toFixed(0)} s${warnings ? `, ${warnings} warnings` : ''})`);
    results.push({tutorial, ok, output});
}

const failed = results.filter(result => !result.ok);
printFailures(failed);
console.log(`\ntutorials:build: ${results.length - failed.length} of ${results.length} tutorials built${failed.length ? `, ${failed.length} failed: ${failed.map(result => result.tutorial.number).join(', ')}` : ''}.`);
process.exit(failed.length ? 1 : 0);
