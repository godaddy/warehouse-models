const through = require('through2');
const ls = require('list-stream');

/**
 * Datastar API compatibility
 * @class
 */
class Compat {
  /**
   * @constructor
   * @param {Object} options Configuration
   *  @param {DynamoModel} options.model The dynamo model being wrapped
   *  @param {String} [options.hashKey] The hashKey of the model
   *  @param {String} [options.rangeKey] The rangeKey for the model
   *  @param {Function} [options.createKey] The function to create the hashKey for certain models
   */
  constructor({ model, hashKey = 'key', rangeKey, createKey }) {
    this.model = model;
    this.hashKey = hashKey;
    this.rangeKey = rangeKey;
    this._createKey = createKey;
  }
  /**
   * @function create
   * @param {Object} data Model data object
   * @param {Function} callback Continuation function when finished
   * @returns {any} whatever the model returns
   */
  create(data, callback) {
    const opts = this._computeKeyOpts(data);
    return this.model.create({ ...opts, ...data }, callback);
  }
  /**
   * @function update
   * @param {Object} data Model data object
   * @param {Function} callback Continuation function when finished
   * @returns {any} whatever the model returns
   */
  update(data, callback) {
    const opts = this._computeKeyOpts(data);
    return this.model.update({ ...opts, ...data }, callback);
  }
  /**
   * @function remove
   * @param {Object} data Model data object
   * @param {Function} callback Continuation function when finished
   * @returns {any} whatever the model returns
   */
  remove(data, callback) {
    const opts = this._computeKeyOpts(data);
    return this.model.destroy(opts, callback);
  }
  /**
   * @function get
   * @param {Object} data Model data object
   * @param {Function} callback Continuation function when finished
   * @returns {any} whatever the model returns
   */
  get(data, callback) {
    const opts = this._computeKeyOpts(data);
    return this.model.get(opts, (err, data) => {
      callback(err, data && data.toJSON());
    });
  }
  /**
   * @function findOne
   * @param {Object} data Model data object
   * @returns {any} whatever get returns
   */
  findOne() {
    return this.get(...arguments);
  }
  /**
   * @function findAll
   * @param {Object} data Datastar find object or model data object
   * @param {Function} [callback] Continuation function when finished
   * @returns {Stream} stream with results
   */
  findAll(data, callback) {
    let conditions, fields;
    if (data.conditions) conditions = data.conditions;
    if (data.fields) fields = data.fields;

    const opts = this._computeKeyOpts(conditions || data);
    const key = opts[this.hashKey];

    const query = this.model.query(key);
    if (fields) query.attributes(fields);
    // These models are weird and dont even have proper getters so we have to
    // just use it as raw json so we can expect the object to have
    // properties
    var stream = query.loadAll().exec().pipe(through.obj(function (data, enc, cb) {
      data = data.Items || data;
      for (const d of data) {
        this.push(d && d.toJSON());
      }
      cb();
    }));
    if (callback) return stream.pipe(ls.obj(callback));
    return stream;

  }
  /**
   *  @function ensureTables
   *  @returns {any} whatever the model returns
   */
  ensureTables() {
    return this.model.createTable(...arguments);
  }
  /**
   * @function dropTables
   * @returns {any} whatever the model returns
   */
  dropTables() {
    return this.model.deleteTable(...arguments);
  }
  /**
   * @function _computeKeyOpts
   * @param {Object} data Parameters for given model
   * @returns {Object} parameters for hashKey and/or rangeKey
   */
  _computeKeyOpts(data) {
    const ret = this._createKey
      ? { key: this._createKey(data) }
      : { [this.hashKey]: data[this.hashKey] };

    if (this.rangeKey && data[this.rangeKey]) {
      ret[this.rangeKey] = data[this.rangeKey];
    }

    return ret;
  }
}


module.exports = Compat;
