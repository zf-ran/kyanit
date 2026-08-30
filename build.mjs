import fs from 'node:fs';
import { build } from 'esbuild';
import { glob } from 'glob';

//* MATHJAX
fs.cpSync(
	'node_modules/mathjax',
	'public/dist/mathjax',
	{ recursive: true }
);

fs.cpSync(
	'node_modules/@mathjax',
	'public/dist/@mathjax',
	{ recursive: true }
);

const mathjaxTypescripts = await glob('public/dist/@mathjax/**/*.ts');

for (const mathjaxTypescript of mathjaxTypescripts) {
	fs.rmSync(mathjaxTypescript);
}

//* PRISM.JS
fs.cpSync(
	'node_modules/prismjs',
	'public/dist/prismjs',
	{ recursive: true }
);

//* ESBUILD
const jsEntries = await glob('src/js/**/*.entry.{js,mjs}');
const cssEntries = await glob('src/css/**/*.entry.css');

await build({
	entryPoints: jsEntries,
	outdir: 'public/dist/js',
	outbase: 'src/js',
	bundle: true,
	minify: true,
	sourcemap: false,
	format: 'esm',
	logLevel: 'info'
});

await build({
	entryPoints: cssEntries,
	outdir: 'public/dist/css',
	outbase: 'src/css',
	bundle: true,
	minify: true,
	sourcemap: false,
	external: ['/vendor/*'],
	logLevel: 'info',
	loader: {
		'.woff': 'file',
		'.woff2': 'file',
	},
});