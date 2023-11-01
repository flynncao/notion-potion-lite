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
const {displayNotionRows} = require('../menu');
const NotionDatabase = require('../../classes/notion/NotionDatabase');
const store = require('../../databases/store');
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

const handleUpdate = function (chatId) {
  STATE.current = STATE.update;
  bot.sendMessage(chatId, operations.rename.onClickMessage);
};

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



/**
 * Callback handler for selecting a row
 * @param {string} chatId 
 * @param {string} databaseId 
 */
const handleSelectedProperty = async function (chatId, propertyId) {
	try {
		const operation = operations.update;
		STATE.current = STATE.waiting;

		if (await handleCancel(incomingTextMessage, operation.onCancelMessage))
			return;
	
		logInput(operation.logInputMessage, incomingTextMessage.text);
	
		try {
			await getLastMessage().renamePage(incomingTextMessage.text);
			handleOperationSuccess(incomingTextMessage.chat.id, operation);
		} catch (error) {
			handleError(error, incomingTextMessage.chat.id);
		}
  } catch (error) {
    handleError(error, chatId);
  }
}


/**
 * Callback handler for selecting a row
 * @param {string} chatId 
 * @param {string} databaseId 
 */
const handleSelectedRow = async function (chatId, databaseId) {
	try {
		const notionRow = new NotionRow(databaseId);
		await notionRow.init()
		store.activePage =  JSON.parse(JSON.stringify(notionRow))
		const list = notionRow.getPropertyPlainTextList().map((item) => {
			return {
				name: `${item.name} : ${item.value ? item.value : ''}`,
				callbackData: `operation#update#${item.name}`,
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
 * After selecting the database or receive a new message with `@databasename` only 
 * @param {string} chatId 
 * @param {string} databaseId 
 */
const handleSelectedDatabase = async function (chatId, databaseInfo) {
	try {
		console.log('databaseInfo', databaseInfo)
		const isNotionDatabaseInstance = databaseInfo instanceof NotionDatabase
		STATE.databaseId = isNotionDatabaseInstance ? databaseInfo.id : databaseInfo 
		let queryResponse = {}
		if(isNotionDatabaseInstance){
			queryResponse = await databaseInfo.query()
		}else{
			const { databases } = data;
			function getDatabaseNameById(Id){
				const databaseIds = {}
					for(const [k, v] of Object.entries(databases)){
						databaseIds[v.id] = k
					}
					return databaseIds[Id]
			}
			const databaseName = getDatabaseNameById(databaseInfo)
			queryResponse = await databases[databaseName].query();
		}
		displayNotionRows(chatId, queryResponse)
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
	handleUpdate,
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
	handleSelectedRow,
	handleSelectedProperty
};
