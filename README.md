# Hash Brown

Tasty hashes made out of whatever.

## Install
`npm install --save-dev hash-brown`

## CLI Usage

- `hashbrown [options]` - Run hash-brown using your options
- `-a --algorithm` - Set the algorithm used for hashing, defaults to "sha1"
- `-f --files` - Set the files to be hashed
- `-o --output` - Set the destination path
- `-m --manifest` - Set the JSON manifest path, defaults to "manifest.json"

## Example
`hashbrown --files=src/**/*.js --output=path/to/dest`
