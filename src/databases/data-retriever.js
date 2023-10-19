const { logSuccess } = require('../lib/logger');
const NotionDatabase = require('../classes/notion/NotionDatabase');
const Website = require('../classes/notion/Website');
const History = require('../classes/History');
const store = require('./store');
const db = require('./db');


/**
 * Retrieves specific table from the database
 * Give additional to each row in website table
 * @returns {Promise<object>} - Resolves with an object of database objects.
 */
const getTable = function (dbName, classObject, isWebsite = false, bases = null) {
  return new Promise(function (resolve, reject) {
    const DATABASES = {};
    const query = `SELECT * FROM ${dbName}`;
    db.each(
      query,

      (err, row) => {
        if (err) {
          reject(err);
        } else {
          DATABASES[row.name] = new classObject(row, isWebsite ? bases : null);
        }
      },
      (err, n) => {
        if (err) {
          reject(err);
        } else {
          resolve(DATABASES);
        }
      }
    );
  });
};


/**
 * Retrieves "Notion databases" data from the database
 * @returns {Promise<object>} - Resolves with an object of database objects.
 */
const getDatabase = function () {
  return new Promise(function (resolve, reject) {
    const DATABASES = {};
    const query = `SELECT * FROM bases`;
    db.each(
      query,

      (err, row) => {
        if (err) {
          reject(err);
        } else {
          DATABASES[row.name] = new NotionDatabase(row);
        }
      },
      (err, n) => {
        if (err) {
          reject(err);
        } else {
          resolve(DATABASES);
        }
      }
    );
  });
};



module.exports = async function () {
	const databases = await getDatabase();
	store.databases = databases;
	logSuccess('Loaded meta database!');
	// const websites = await getWebsites(databases);
	// store.websites = websites;
	const list = [
		{ name: 'websites', classObject: Website },
		{name: 'histories', classObject: History }
	]
	let tableNames = '';
	for (const item of list) {
		const table = await getTable(item.name, item.classObject, true, databases);
		store[item.name] = table;
		tableNames += `${item.name},`;
	}
	logSuccess(`Loaded tables: ${tableNames.slice(0, -1)}`);
};
