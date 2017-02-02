#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs-promise');
const glob = require('globby');
const hasha = require('hasha');
const path = require('path');
const memoizee = require('memoizee');

const opt = {
	algorithm: argv.algorithm || argv.a || 'sha1',
	files: argv.files || argv.f,
	manifest: argv.manifest || argv.m,
	output: argv.output || argv.o
};

if (!opt.files) {
	throw new Error('Add some files with --files="example/**/*.js"');
}

if (!opt.manifest) {
	throw new Error('Provide a manifest location with --manifest="example/manifest.json"');
}

if (!opt.output) {
	throw new Error('Specify an output directory with --output="example/"');
}

Object.keys(opt).forEach(x => {
	if (typeof opt[x] !== 'string') {
		throw new TypeError(`Expected "string", but received "${typeof opt[x]}" for ${x}`);
	}
});

const parse = files => {
	return files.map(file => {
		const parsed = path.parse(file);
		const hash = hasha.fromFileSync(file, {
			algorithm: opt.algorithm
		});

		return {
			name: parsed.name,
			path: `${opt.output}${parsed.name}.${hash}${parsed.ext}`,
			contents: fs.readFileSync(file)
		};
	});
};

const cache = memoizee(files => {
	return new Promise((resolve, reject) => {
		glob(files).then(xs => {
			return resolve(parse(xs));
		}).catch(err => {
			return reject(err);
		});
	});
});

Promise.all([
	// Recursively create the directories for output and manifest
	fs.ensureDir(opt.output),
	fs.ensureDir(path.parse(opt.manifest).dir)
]).then(() => {
	// Find our files and then create a cache of the parsed result
	return cache(opt.files);
}).then(files => {
	// Write all of our files with the hash added to the filename
	return Promise.all(files.map(x => {
		return fs.writeFile(x.path, x.contents);
	}));
}).then(() => {
	// Get a cached copy of our parsed files
	return cache(opt.files);
}).then(files => {
	// Create a manifest JSON using the name of the parsed files
	return fs.writeJson(opt.manifest, files.reduce((acc, x) => {
		acc[x.name] = x.path;
		return acc;
	}, {}));
}).then(() => {
	// OK
}).catch(err => {
	console.error(err);
});
