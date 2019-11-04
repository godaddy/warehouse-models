# `warehouse-models`

[![Version npm](https://img.shields.io/npm/v/warehouse-models.svg?style=flat-square)](https://www.npmjs.com/package/warehouse-models)
[![License](https://img.shields.io/npm/l/warehouse-models.svg?style=flat-square)](https://github.com/warehouseai/warehouse-models/blob/master/LICENSE)
[![npm Downloads](https://img.shields.io/npm/dm/warehouse-models.svg?style=flat-square)](https://npmcharts.com/compare/warehouse-models?minimal=true)
[![Build Status](https://travis-ci.org/warehouseai/warehouse-models.svg?branch=master)](https://travis-ci.org/warehouseai/warehouse-models)
[![Dependencies](https://img.shields.io/david/warehouseai/warehouse-models.svg?style=flat-square)](https://github.com/warehouseai/warehouse-models/blob/master/package.json)

Data models for [Warehouse.ai]. Built on top of [dynamodb] and
[dynastar].

## Install

```bash
npm install --save warehouse-models
```

## Usage

All of the objects returned from this module have the same api as
[`dynastar`][dynastar] with the schemas as mentioned later.

```js
const dynamo = require('dynamodb')
const models = require('warehouse-models')(dynamo);

...
// from passing dynamodb.define to the constructor of dynastar we get...
const Build = models.Build;
const Version = models.Version;
...

Build.findFirst({ ... }, function (err, data) { .... });

```

*** Note that with the new dynamo release of `warehouse-models` (V.6.0.0), you will to need to provide a value for `locale` as part of the argument to `findOne`. 

```js
Build.findOne({ name: 'email', env: 'prod'}, function (err, data) { .... }); // pre 6.0.0
Build.findOne({ name: 'email', env: 'prod', locale: 'en-US' }, function (err, data) { .... }); // post 6.0.0
```


## API

All schemas for the API documentation are written using
[`dynamodb`'s][dynamodb] notation.

The following sections contain the column/attribute mappings for each table.

Legend:

(pk) - partition-key
(sk) - sort/range key

### Build (`build`)

Represent an individual build of a package.

Column             | Type             | Summary
------------------ | ---------------- | ------------
key (pk)           | string           | `${name}!${env}!${version}`
env                | string           | What environment is this build made for (dev, test, etc.)
name               | string           | What package has been built
version            | string           | What version of a package does this build represent
buildId            | string           | A build's unique id
previousBuildId    | string           | Hold a reference to the previous build id
rollbackBuildIds   | map              | timestamp string mapped to the rollback id
locale (sk)        | string           | What locale this was built for
createDate         | string           | `dynamodb`'s createdAt
cdnUrl             | string           | URL of CDN to be used as a base for all the artifacts
fingerprints       | stringSet        | Primary keys for `build_files`, represents the unique contents of the file
artifacts          | stringSet        | fingerprint/file-name
recommended        | stringSet        | Possible reduced set of artifacts based on a build's configuration

### Build File (`build_file`)

Represent an individual file (unit) that is built during the build of an
entire package.

Column            | Type        | Summary
----------------- | ----------- | ------------
fingerprint (pk)  | string      | The actual fingerprint of a file, like a md5 hash etc.
buildId           | string      | The build_id associated with the build file
url               | string      | CDN URL for the build_file
createDate        | string      | `dynamodb`'s createdAt
env               | string      | What environment is this file built for
locale            | string      | What locale was this file built for
name              | string      | Name of a built file
version           | string      | Version of the package the file is built for
extension         | string      | .js, .css. resource type extension
filename          | string      | given filename for the build-file

### Build Head (`build_head`)

Represent the head build version of an entire package.
On an `npm install`, the env will have to be passed in.

Column             | Type             | Summary
------------------ | ---------------- | ------------
key (pk)           | string           | `${name}!${env}!${version}`
name               | string           | What package has been build
env                | string           | What environment is this build made for (dev, test, etc.)
buildId            | string           | A build's unique id
previousBuildId    | string           | Hold a reference to the previous build id
rollbackBuildIds   | map              | timestamp string mapped to the rollback id
createDate         | string           | `dynamodb`'s createdAt
udpateDate         | string           | `dynamodb`'s updatedAt
version            | string           | What version of a package does this build represent
locale (sk)        | string           | What locale this was built for
cdnUrl             | string           | URL of CDN to be used as a base for all the artifacts
fingerprints       | stringSet        | Primary keys for `build_files`, represents the unique contents of the file
artifacts          | stringSet        | fingerprint/file-name
recommended        | stringSet        | Possible reduced set of artifacts based on a build's configuration

### Dependent (`dependent`)

A dependency graph where every packaged publish can ensure that any package
that depends on it can be updated. This should constantly be **updated on
every publish.**

Column           | Type          | Summary
---------------- | ------------- | ------------
name (pk)        | string        | Name of a package
dependents       | stringSet     | Name of packages are **dependent on me**

### Dependent Of (`dependent_of`)

An inverse of `dependent` in order for a dependent package to see what its
parent is.

Column           | Type          | Summary
---------------- | ------------- | ------------
pkg (pk)         | string        | Name of a package
dependentOf      | string        | Name of the parent package

### Release Line (`release_line`)

Represent all the necessary information for a given package/version to know
what needs to be deployed, considering all its dependents as well.
(When combined with `Release Line Dependents`)

Column            | Type        | Summary
----------------- | ----------- | ------------
key (pk)          | string      | `${pkg}!${version}`
pkg               | string      | Name of a package
version           | string      | The current version number or `latest`
previousVersion   | string      | The previous version number

### Release Line Dependents (`release_line_dep`)

Represent all the necessary information for a given package/version to know
what needs to be deployed, considering all its dependents as well.
(When combined with `Release Line`)

Column            | Type        | Summary
----------------- | ----------- | ------------
key (pk)          | string      | `${pkg}!${version}`
pkg               | string      | Name of a package
version           | string      | The current version number
previousVersion   | string      | The previous version number
dependent (sk)    | string      | The dependent package
dependentVersion  | string      | The dependent package version

### Release Line Head (`release_line_head`)

Represents the head release-line for a given package.

Column            | Type        | Summary
----------------- | ----------- | ------------
pkg (pk)          | string      | Name of a package
previousVersion   | string      | The previous version number
version           | string      | The current version number

### Version (`version`)

Records of every npm publish of a package to the registry. Mostly needed for
npm install from the builder, as it will npm install a specific tag. That tag
will be tied to a specific version (look at the package table). A lookup will
occur against the version table afterwards to send down the `package.json`.

Column           | Type        | Summary
---------------- | ----------- | ------------
name (pk)        | string      | Name of a package
version (sk)     | string      | Version of a package
value            | string      | Full json sent of an npm publish

### Package (`package`)

Represent an entire published packaged (`package.json`) to the registry.
Because the number of properties in `package.json` could be infinite,
only relevant columns are described.

Examples of `package.json`

* [Warehouse.ai][wrhs]
* [Express]
* [npm]

Column               | Type            | Summary
-------------------- | --------------- | ------------
name (pk)            | string          | Name of a package
version              | string          | Version of a package
description          | string          | Package description
main                 | string          | Export file of a package
gitHead              | string          | HEAD git sha of package
extended             | map             | object of any other properties we have
keywords             | stringSet       | package.json keywords array
bundledDependencies  | stringSet       | any bundled dependencies of a package
distTags             | map             | Mapping of tag to version e.g. `{ "production": "1.1.0" }`
envs                 | map             | ?
metadata             | map             | ?
config               | map             | Specific configuration for package
repository           | map             | Repo config of package.json
dependencies         | map             | Deps of package
devDependencies      | map             | DevDeps of package
peerDependencies     | map             | peerDeps of package
optionalDependencies | map             | any optional dependencies

## Test 

Ensure you have [localstack] running local.

```sh
npm test
```

[wrhs]: https://registry.npmjs.org/warehouse.ai/latest
[Express]: https://registry.npmjs.org/express/latest
[npm]: https://docs.npmjs.com/files/package.json
[warehouse.ai]: https://github.com/godaddy/warehouse.ai
[dynamodb]: https://www.npmjs.com/package/dynamodb
[dynastar]: https://github.com/godaddy/dynastar
[localstack]: https://github.com/localstack/localstack.git