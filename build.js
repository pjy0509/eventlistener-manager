import esbuild from 'esbuild';
import { exec } from 'child_process';

const tsConfig = 'tsconfig.json';

const baseConfig = {
	entryPoints: ['src/index.ts'],
	bundle: true,
	sourcemap: true,
	minify: true,
	outdir: 'dist'
};

Promise.all([
	esbuild.build({
		...baseConfig,
		format: 'esm',
		outExtension: { '.js': '.mjs' }
	}),
	esbuild.build({
		...baseConfig,
		format: 'cjs',
		outExtension: { '.js': '.cjs' }
	})
]).then(() => {
	exec(`tsc --project ${tsConfig} --emitDeclarationOnly --declaration --outDir dist`, (err, stdout, stderr) => {
		if (err) {
			console.error(`Error: ${stderr}`);
			process.exit(1);
		}
		console.log(stdout);
	});
}).catch(() => process.exit(1));
