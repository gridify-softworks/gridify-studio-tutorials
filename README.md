# Gridify: the tutorials

Small Angular 21 applications that use Gridify (`@gridify/studio`), from the very basics on, each with a README that explains it step by step (`tutorials/README.md` lists them). They are the projects of one Angular workspace: one `npm i` for all of them. You need Node.js in a version that Angular 21 supports (20.19 or newer, 22.12 or newer, or 24).

```
npm i
npm run tutorials
npm run tutorial 010
```

`npm run tutorial 130` (or `130-languages`) starts the tutorial on a port of its own, 30000 + its number: http://localhost:30130. Several can run at once, and each has a `localStorage` of its own.

`npm run tutorial:eject 130 ../my-app` makes an Angular project of its own from a tutorial (`npm i` and `ng serve` in it), the start of an application of your own.

`npm run build` builds every tutorial (`npm run build 010 130` only those) and tells which failed; the builds go to `dist/tutorials`. The workflow `.github/workflows/build.yml` does the same on GitHub for every push to a branch and every pull request.

## The library

`@gridify/studio` comes from npm (see `package.json`). The code of the tutorials uses only its public API. The reference of all its components (inputs, outputs, defaults, CSS variables) is in the package: `node_modules/@gridify/studio/REFERENCE.md`.
