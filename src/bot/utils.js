const { parse } = require('../lib/Util');
const { logSuccess } = require('../lib/logger');
const bot = require('./bot');
const { getOperationsKeyboard } = require('./keyboards');
const messagesHistory = require('./messages-history');
const { STATE } = require('./state');
const { handleError } = require('./handlers/error-handlers');
const databases = require('../databases/store');
const retrieveData = require('../databases/data-retriever');

/**

Sends a success message to the chat with the given chat ID, using the operations keyboard if specified, update mode will empty the reply message and display different menu options
@param {number} chatId - The ID of the chat to send the message to
@param {string} replyMessage - The message to send
@param {boolean} useOperationsKeyboard - Whether or not to include the operations keyboard for further interaction
@returns {Promise<void>}
*/
const sendSuccessMessage = async function (
  chatId,
  replyMessage,
  useOperationsKeyboard = true,
	type
) {
  if (!useOperationsKeyboard) {
    await bot.sendMessage(chatId, replyMessage);
    return;
  }
  const lastSentKeyboard = await bot.sendMessage(chatId, replyMessage, {
    parse_mode: 'Markdown',
    reply_markup: getOperationsKeyboard(type),
  });
  STATE.current = STATE.selecting;
  STATE.lastKeyboardMessage = lastSentKeyboard;
};

/**

Handles a successful operation by sending a success message to the chat and logging a success message
@param {number} chatId - The ID of the chat to send the message to
@param {Object} operation - The operation that was successful
@param {boolean} useOperationsKeyboard - Whether or not to include the operations keyboard for further interaction
@param {string} type - The type of operation that was successful, either 'create' or 'update'
@returns {Promise<void>}
*/
const handleOperationSuccess = async function (
  chatId,
  operation,
  useOperationsKeyboard = true,
	type = 'create'
) {
	try{
		let replyMessage = ''
		let lastMessage = null
		let pageName = ''
		let notionURL = ''
		const lastHistory = await getLastHistory()
		if(type === 'create'){
			lastMessage = getLastMessage();
			pageName = lastMessage.properties.Name.title[0].text.content;
			notionURL = lastMessage.notionURL;
			replyMessage = parse(operation.successMessage, pageName, notionURL);
		}else if(type === 'update'){
			pageName = lastHistory.name;
			notionURL = lastHistory.notionURL;
			replyMessage = 'Please choose a database to update.'
		}
		await sendSuccessMessage(chatId, replyMessage, useOperationsKeyboard, type);
		logSuccess(operation.logSuccessMessage, pageName, notionURL);
	}catch(e){
		handleError(e, chatId)
	}
		
};

/**

Checks if the incoming text message is '/cancel', and sends the specified reply message along with the operations keyboard
@param {Object} incomingTextMessage - The incoming text message to check
@param {string} replyMessage - The message to send if the incoming message is '/cancel'
@returns {Promise<boolean>} - Whether or not the incoming message was '/cancel'
*/
const handleCancel = async function (incomingTextMessage, replyMessage) {
  if (incomingTextMessage.text === '/cancel') {
    bot.sendMessage(incomingTextMessage.chat.id, replyMessage, {
      parse_mode: 'Markdown',
      reply_markup: getOperationsKeyboard(),
    });
    return true;
  }
  return false;
};

/**

Returns the last message in the messagesHistory array
@returns {Object} - The last message in the messagesHistory array
*/
const getLastMessage = () => messagesHistory[messagesHistory.length - 1];

/**
 * Retrieves Page Creation History data from the SQLITE database
 */
const getLastHistory = async() => {
	await retrieveData();
	const histories = Object.values(databases.histories);
	console.log('histories', histories)
	const lastHistory = histories[histories.length - 1];
	return lastHistory;
}

module.exports = {
  handleCancel,
  getLastMessage,
  handleOperationSuccess,
};
