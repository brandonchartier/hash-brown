#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs-promise');
const glob = require('globby');
const minimist = require('minimist');
const path = require('path');

const argv = minimist(process.argv.slice(2));

const opt = {
	algorithm: argv.algorithm || argv.a || 'sha1',
	files: argv.files || argv.f || '',
	filenameOnly: argv.filenameOnly || argv.fo || false,
	manifest: argv.manifest || argv.m || 'manifest.json',
	output: argv.output || argv.o || ''
};

// Parse files, create hash
const parse = files => {
	return files.map(file => {
		const { name, ext } = path.parse(file);
		const contents = fs.readFileSync(file);
		const hash = crypto.createHash(opt.algorithm).update(contents).digest('hex');
		const filename = `${name}.${hash}${ext}`;

		return {
			contents,
			name,
			path: path.join(opt.output, filename),
			filename
		};
	});
};

// Find our files and then create a cache of the parsed result
const cache = new Promise((resolve, reject) => {
	return glob(opt.files).then(xs => {
		return resolve(parse(xs));
	}).catch(err => {
		return reject(err);
	});
});

Promise.all([
	// Recursively create the directories for output and manifest
	fs.ensureDir(opt.output),
	fs.ensureDir(path.parse(opt.manifest).dir)
]).then(() => cache).then(files => {
	// Write all of our files with the hash added to the filename
	return Promise.all(files.map(x => {
		return fs.writeFile(x.path, x.contents);
	}));
}).then(() => cache).then(files => {
	// Create a manifest JSON using the name of the parsed files
	return fs.writeJson(opt.manifest, files.reduce((acc, x) => {
		acc[x.name] = opt.filenameOnly ? x.filename : x.path;
		return acc;
	}, {}));
}).catch(err => {
	throw new Error(err);
});
