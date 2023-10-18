const db = require('./db');
const store = require('./store');
const { logSuccess } = require('../lib/logger');


const createNewHistoryInDB = function (properties) {
	console.log('properties', properties)
	
	return new Promise(function (resolve, reject) {
		const query = `insert into histories(name, parent, notionURL, id) values (?, ?, ?, ?)`;
		console.log('query', query)
		db.run(
			query,
			[
				properties.name,
				properties.parent,
				properties.notionURL,
				properties.id
			],
			(err) => {
				if (err) {
					reject(err);
				} else {
					logSuccess(`Updated successful`);
					resolve();
				}
			}
		)
	});
}


module.exports = {
	createNewHistoryInDB
};

// Path: src/databases/data-retriever.js
