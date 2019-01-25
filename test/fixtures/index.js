/* jscs: disable */
exports.packageStrip = {
  before: { '_id': 'my-package',
    'name': 'my-package',
    'description': 'A kind of package',
    'dist-tags': { latest: '1.0.0' },
    'versions':
   { '1.0.0':
      { name: 'my-package',
        config: { locales: ['en-US'] },
        description: 'A kind of package',
        dependencies: { 'are-only-in-version': '*' },
        webpack: {},
        main: 'index.js' }},
    'readme': 'ERROR: No README data found!',
    'maintainers': [{ name: 'indexzero', email: 'charlie.robbins@gmail.com' }],
    '_attachments': {}},
  after: { name: 'my-package',
    config: { locales: '["en-US"]' },
    description: 'A kind of package',
    dependencies: { 'are-only-in-version': '*' },
    main: 'index.js',
    distTags: { latest: '1.0.0' },
    extended: JSON.parse('{"webpack": {}, "maintainers":[{"name":"indexzero","email":"charlie.robbins@gmail.com"}]}') }
};

exports.buildFile = {
  array: [{ source: Buffer.from('function() { return what }', 'utf8') }],
  object: {
    source: Buffer.from('module.exports = function (options, callback) {}', 'utf8'),
    sourcemap: Buffer.from('function foo() { var bar = false; return bar; }', 'utf8')
  }
};

