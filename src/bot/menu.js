
/**
 * This module exports functions used to mobilize the keyboard and display the rows of an data primarily gotten from Notion.
 */
const bot = require('./bot');
const { getKeyboardFromList } = require('./keyboards');
const operations = require('./bot-operation-messages');
const store = require('../databases/store');
const displayNotionRows = async function (chatId, queryResponse) {
	const list = Object.values(queryResponse.results).map((item) => {
		if (item.properties && item.properties.Name && item.properties.Name.title && item.properties.Name.title[0] && item.properties.Name.title[0].plain_text) {
			return {
				name: item.properties.Name.title[0].plain_text,
				callbackData: `row#${item.id}`,
			};
		}
	}).filter(item=>item!==undefined)
	bot.sendMessage(chatId, operations.rows.onClickMessage, {
		parse_mode: 'Markdown',
		reply_markup: getKeyboardFromList(list, 4),
	});
}


module.exports = {
	displayNotionRows
}
