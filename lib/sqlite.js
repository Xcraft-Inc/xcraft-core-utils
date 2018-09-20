'use strict';

const path = require('path');
const xFs = require('xcraft-core-fs');

class SQLite {
  constructor(location) {
    try {
      this.Database = require('better-sqlite3');
      this._stmts = {};
      this._db = {};
    } catch (ex) {
      this.Database = null;
    }

    this._dir = location;
  }

  _path(dbName) {
    return path.join(this._dir, `${dbName}.db`);
  }

  _onError(resp) {
    resp.log.info('sqlite3 is not supported on this platform');
  }

  _prepare(dbName, query) {
    this._stmts[dbName][query] = this._db[dbName].prepare(this._queries[query]);
  }

  stmts(dbName) {
    return this._stmts[dbName];
  }

  /**
   * Check if SQLite is usable.
   *
   * @return {Boolean} true if SQLite is available.
   */
  usable() {
    return !!this.Database;
  }

  /**
   *
   * @param {Object} resp - Response object provided by busClient.
   * @returns {Boolean} true if usable.
   */
  tryToUse(resp) {
    if (!this.usable()) {
      this._onError(resp);
      return false;
    }
    return true;
  }

  /**
   * Open (and create if necessary) a SQLite database.
   *
   * @param {string} dbName - Database name used for the database file.
   * @param {string} tables - Main queries for creating the tables.
   * @param {Object} queries - Raw queries to prepare.
   * @return {Boolean} false if SQLite is not available.
   */
  open(dbName, tables, queries) {
    if (!this.usable()) {
      return false;
    }

    if (this._db[dbName]) {
      return true;
    }

    xFs.mkdir(this._dir);

    const dbPath = this._path(dbName);
    this._db[dbName] = new this.Database(dbPath);
    this._stmts[dbName] = {};

    this._db[dbName].exec(tables);

    for (const query in queries) {
      this._prepare(dbName, query);
    }

    return true;
  }

  close(dbName) {
    if (!this._db[dbName]) {
      return;
    }
    this._db[dbName].close();
    delete this._db[dbName];
  }
}

module.exports = SQLite;
