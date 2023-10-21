const data = require('../../databases/store');
const NotionRow = require('../../classes/notion/NotionRow');
const { logInput } = require('../../lib/logger');
const bot = require('../bot');
const { getKeyboardFromList } = require('../keyboards');
const messagesHistory = require('../messages-history');
let { STATE } = require('../state');
const operations = require('../bot-operation-messages');
const { handleError } = require('./error-handlers');
const { getLastMessage, handleOperationSuccess } = require('../utils');

/*****************************************************************************************************************
 *                                                                                                                *
 *  Operations handlers                                                                                           *
 *  These Handel clicking any of the 8 basic operations buttons like : rename, move, delete ..etc                 *                                                                                    *
 *                                                                                                                *
 *****************************************************************************************************************/
const handleOutbox = async function (chatId) {
  STATE.current = STATE.waiting;

  logInput(operations.outbox.logInputMessage);
  try {
    await getLastMessage().outbox();
    handleOperationSuccess(chatId, operations.outbox);
  } catch (error) {
    handleError(error, chatId);
  }
};

const handleDelete = async function (chatId) {
  STATE.current = STATE.waiting;
  const operation = operations.delete;
  STATE.current = STATE.waiting;
  logInput(operation.logInputMessage);
  try {
    await getLastMessage().delete();
    handleOperationSuccess(chatId, operation, false);
    messagesHistory.pop();
  } catch (error) {
    handleError(error, chatId);
  }
};

const handleDone = function () {
  STATE.current = STATE.waiting;
  logInput(operations.done.logInputMessage);
};

const handleBack = function (chatId) {
  handleOperationSuccess(chatId, operations.back);
};

// The following  handlers require changing the state
// because the user will be sending a follow up message

const handleRename = function (chatId) {
  STATE.current = STATE.rename;
  bot.sendMessage(chatId, operations.rename.onClickMessage);
};

const handleDetails = function (chatId) {
  STATE.current = STATE.details;
  bot.sendMessage(chatId, operations.details.onClickMessage);
};

/////////////

const handleMove = async function (chatId) {
  const { databases } = data;
  const list = Object.values(databases).map((notionDb) => {
    return {
      name: `${notionDb.icon}  ${notionDb.name}`,
      callbackData: `database#${notionDb.name}`,
    };
  });

  bot.sendMessage(chatId, operations.move.onClickMessage, {
    parse_mode: 'Markdown',
    reply_markup: getKeyboardFromList(list, 4),
  });
};

const handleAddTopic = async function (chatId) {
  const { databases } = data;
  const topicsList = await databases.Topics.query();
  const list = Object.values(topicsList.results).map((topic) => {
    return {
      name: topic.properties.Name.title[0].plain_text,
      callbackData: `topic#${topic.id}`,
    };
  });
  bot.sendMessage(chatId, operations.addTopic.onClickMessage, {
    parse_mode: 'Markdown',
    reply_markup: getKeyboardFromList(list, 4),
  });
};

const handleAddProject = async function (chatId) {
  const { databases } = data;
  const topicsList = await databases.Projects.query();
  const list = Object.values(topicsList.results).map((Project) => {
    return {
      name: Project.properties.Name.title[0].plain_text,
      callbackData: `project#${Project.id}`,
    };
  });
  bot.sendMessage(chatId, operations.addProject.onClickMessage, {
    parse_mode: 'Markdown',
    reply_markup: getKeyboardFromList(list, 1),
  });
};

/**
 * Display all database pages in a list
 * @param {} chatId 
 */
const handleGetAllRecord = async function (chatId) {
	const { databases } = data;
	const list = Object.values(databases).map((notionDB) => {
		return {
			name: `${notionDB.icon}  ${notionDB.name}`,
			callbackData: `table#${notionDB.id}`,
		}
	})

  bot.sendMessage(chatId, operations.allRecord.onClickMessage, {
    parse_mode: 'Markdown',
    reply_markup: getKeyboardFromList(list, 4),
  });
}

/*****************************************************************************************************************
 *                                                                                                                *
 *  Data selectors Handlers:                                                                                      *
 *  These handles selecting a button after clicking an operation button to select some data like a new database   *
 *  a topic or a project                                                                                          *
 *                                                                                                                *
 *****************************************************************************************************************/

const handleSelectedRow = async function (chatId, databaseId) {
	// Use Anime database as an example
	try {
		const notionRow = new NotionRow(databaseId);
		await notionRow.init()
		const list = notionRow.getPropertyPlainTextList().map((item) => {
			return {
				name: `${item.name} : ${item.value ? item.value : ''}`,
				callbackData: `property#${item.id}`,
			};
		})
		bot.sendMessage(chatId, operations.property.onClickMessage, {
			parse_mode: 'Markdown',
			reply_markup: getKeyboardFromList(list, 1),
		});
  } catch (error) {
    handleError(error, chatId);
  }
}



/**
 * After selecting the database 
 * @param {string} chatId 
 * @param {string} databaseId 
 */
const handleSelectedDatabase = async function (chatId, databaseId) {
	// Use Anime database as an example
	try {
		STATE.databaseId = databaseId;
		const databaseName = 'Anime'
		const { databases } = data;
		const queryResponse = await databases[databaseName].query();
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
  } catch (error) {
    handleError(error, chatId);
  }
}

const handleSelectedNewDatabase = async function (chatId, newDatabaseName) {
  const { databases } = data;

  try {
    await getLastMessage().move(databases[newDatabaseName]);
    handleOperationSuccess(chatId, operations.move);
  } catch (error) {
    handleError(error, chatId);
  }
};

const handleSelectedTopic = async function (chatId, topicId) {
  try {
    await getLastMessage().addRelation('Topic', topicId);
    handleOperationSuccess(chatId, operations.addTopic);
  } catch (error) {
    handleError(error, chatId);
  }
};
const handleSelectedProject = async function (chatId, projectId) {
  try {
    await getLastMessage().addRelation('Project', projectId);
    handleOperationSuccess(chatId, operations.addProject);
  } catch (error) {
    handleError(error, chatId);
  }
};

module.exports = {
	handleGetAllRecord,
  handleRename,
  handleMove,
  handleDetails,
  handleAddTopic,
  handleAddProject,
  handleOutbox,
  handleDelete,
  handleDone,
  handleSelectedNewDatabase,
  handleSelectedTopic,
  handleSelectedProject,
  handleBack,
	handleSelectedDatabase,
	handleSelectedRow
};
