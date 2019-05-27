# `warehouse-models`

[![Version npm](https://img.shields.io/npm/v/warehouse-models.svg?style=flat-square)](https://www.npmjs.com/package/warehouse-models)
[![License](https://img.shields.io/npm/l/warehouse-models.svg?style=flat-square)](https://github.com/warehouseai/warehouse-models/blob/master/LICENSE)
[![npm Downloads](https://img.shields.io/npm/dm/warehouse-models.svg?style=flat-square)](https://npmcharts.com/compare/warehouse-models?minimal=true)
[![Build Status](https://travis-ci.org/warehouseai/warehouse-models.svg?branch=master)](https://travis-ci.org/warehouseai/warehouse-models)
[![Dependencies](https://img.shields.io/david/warehouseai/warehouse-models.svg?style=flat-square)](https://github.com/warehouseai/warehouse-models/blob/master/package.json)

Data models for [Warehouse.ai]. Built on top of [Cassandra] and
[datastar].

## Install

```bash
npm install --save warehouse-models
```

## Usage

All of the objects returned from this module have the same api as
[`datastar`][datastar] with the schemas as mentioned later.

```js
const datastar = require('datastar')({ /* connection config */ }).connect();
const models = require('warehouse-models')(datastar);

...
// from datastar.define we get...
const Build = models.Build;
const Version = models.Version;
...

Build.findFirst({ ... }, function (err, data) { .... });

```

## API

All schemas for the API documentation are written using
[`datastar`'s][datastar] notation.

### Build (`build`)

Represent an individual build of a package.

Column             | Type             | Summary
------------------ | ---------------- | ------------
build_id (pk)      |  text            | A build's unique id
previous_build_id  |  text            | Hold a reference to the previous build id
rollback_build_ids |  map<text, text> | timestamp string mapped to the rollback id
env                |  text            | What enviroment is this build made for (dev, test, etc.)
name               |  text            | What package has been built
version            |  text            | What version of a package does this build represent
fingerprints       |  set<text>       | Primary keys for `build_files`, represents the unique contents of the file
artifacts          |  set<text>       | fingerprint/file-name
recommended        |  set<text>       | Possible reduced set of artifacts based
a build's configuration

### Build File (`build_file`)

Represent an individual file (unit) that is built during the build of an
entire package.

Column            | Type        | Summary
----------------- | ----------- | ------------
fingerprint (pk)  |   text      | The actual fingerprint of a file, like a md5 hash etc.
build_id          |   text      | The build_id associated with the build file
url               |   text      | CDN URL for the build_file
create_date       |   timestamp | Time of creation
env               |   text      | What enviroment is this file built for
locale            |   text      | What locale was this file built for
name              |   text      | Name of a built file
version           |   text      | Version of the package the file is built for
extension         |   text      | .js, .css. resource type extension
source            |   blob      | Entire source of a built file
sourcemap         |   blob      | Sourcemap of a built file
shrinkwrap        |   json      | JSON of package requirements
filename          |   text      | given filename for the build-file


### Build Head (`build_head`)

Represent the head build version of an entire package.
On an `npm install`, the env will have to be passed in.

Column             | Type             | Summary
------------------ | ---------------- | ------------
build_id (pk)      |  text            | A build's unique id
previous_build_id  |  text            | Hold a reference to the previous build id
rollback_build_ids |  map<text, text> | timestamp string mapped to the rollback id
env                |  text            | What enviroment is this build made for (dev, test, etc.)
name               |  text            | What package has been build
version            |  text            | What version of a package does this build represent
fingerprints       |  set<text>       | Primary keys for `build_files`, represents the unique contents of the file
artifacts          |  set<text>       | fingerprint/file-name
recommended        |  set<text>       | Possible reduced set of artifacts based
a build's configuration

### Dependent (`dependent`)

A dependency graph where every packaged publish can ensure that any package
that depends on it can be updated. This should constantly be **updated on
every publish.**

Column           | Type          | Summary
---------------- | ------------- | ------------
name (pk)        | text          | Name of a package
dependents       | set(text)     | Name of packages are **dependent on me**

### Dependent Of (`dependent_of`)

An inverse of `dependent` in order for a dependent package to see what its
parent is.

Column           | Type          | Summary
---------------- | ------------- | ------------
pkg (pk)         | text          | Name of a package
dependent_of     | text          | Name of the parent package

### Release Line (`release_line`)

Represent all the necessary information for a given package/version to know
what needs to be deployed, considering all its dependents as well.
(When combined with `Release Line Dependents`)

Column            | Type        | Summary
----------------- | ----------- | ------------
pkg (pk)          |   text      | Name of a package
previousVersion   |   text      | The previous version number
version           |   text      | The current version number or `latest`

### Release Line Dependents (`release_line_dep`)

Represent all the necessary information for a given package/version to know
what needs to be deployed, considering all its dependents as well.
(When combined with `Release Line`)

Column            | Type        | Summary
----------------- | ----------- | ------------
pkg (pk)          |   text      | Name of a package
previousVersion   |   text      | The previous version number
version           |   text      | The current version number
dependent         |   text      | The dependent package
dependentVersion  |   text      | The dependent package version

### Version (`version`)

Records of every npm publish of a package to the registry. Mostly needed for
npm install from the builder, as it will npm install a specific tag. That tag
will be tied to a specific version (look at the package table). A lookup will
occur against the version table afterwards to send down the `package.json`.

Column           | Type        | Summary
---------------- | ----------- | ------------
version_id (pk)  | text        | name@version (`email@2.1`)
name             | text        | Name of a package
version          | text        | Version of a package
value            | text        | Full json sent of an npm publish

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
name                 | text            | Name of a package (Primary Key)
version              | text            | Version of a package
description          | text            | Package description
main                 | text            | Export file of a package
git_head             | text            | HEAD git sha of package
extended             | json            | object of any other properties we have
keywords             | set<text>       | package.json keywords array
bundled_dependencies | set<text>       | any bundled dependencies of a package
dist_tags            | map<text, text> | Mapping of tag to version e.g. `{ "production": "1.1.0" }`
envs                 | map<text, text> | ?
metadata             | map<text, text> | ?
config               | map<text, text> | Specific configuration for package
repository           | map<text, text> | Repo config of package.json
dependencies         | map<text, text> | Deps of package
dev_dependencies     | map<text, text> | DevDeps of package
peer_dependencies    | map<text, text> | peerDeps of package
optional_dependencies| map<text, text> | any optional dependencies

## Test

Ensure you have [Cassandra] running local.

```sh
npm test
```

[wrhs]: https://registry.npmjs.org/warehouse.ai/latest
[Express]: https://registry.npmjs.org/express/latest
[npm]: https://docs.npmjs.com/files/package.json
[warehouse.ai]: https://github.com/godaddy/warehouse.ai
[datastar]: https://github.com/godaddy/datastar
[Cassandra]: https://cassandra.apache.org/
