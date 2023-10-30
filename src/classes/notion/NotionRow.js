require('dotenv').config();
const { Client } = require('@notionhq/client');
const notionClient = new Client({ auth: process.env.NOTION_TOKEN });
const {STATE} = require('../../bot/state');
const {getPropertyRawValue} = require('../../lib/ORM');
module.exports = class NotionRow {

  constructor(pageId) {
		this.id = pageId;
		this._setParent(STATE.databaseId ? STATE.databaseId : process.env.NOTION_DEFAULT_DATABASE_ID);
	}

	_setParent = (id) => {
    this.parent = {
      type: 'database_id',
      database_id: id,
    };
  };

	_setProperties = (properties) => {
		this.properties = properties; 
	}

	init = async () => {
		const response = await notionClient.pages.retrieve({
			page_id: this.id,
		});
		this._setProperties(response.properties);
		return response;
	}

	getPropertyPlainTextList = () => {
		const list = []
		for (const [k, v] of Object.entries(this.properties)) {
			list.push({
				id: v.id, 
				type: v.type,
				name: k,
			  value: getPropertyRawValue(v),
			})
		}

		return list
	}

}
