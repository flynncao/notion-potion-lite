const { parse } = require('../lib/Util');
const { logSuccess } = require('../lib/logger');
const bot = require('./bot');
const { getOperationsKeyboard } = require('./keyboards');
const messagesHistory = require('./messages-history');
const { STATE } = require('./state');
const { handleError } = require('./handlers/error-handlers');

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
	console.log('process sendSuccessMessage');
	console.log('replyMessage',replyMessage);
	
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
		console.log('type in handleOperationSuccess', type)
		if(type === 'create'){
			console.log('util: create');
			const lastMessage = getLastMessage();
			const pageName = lastMessage.properties.Name.title[0].text.content;
			const notionURL = lastMessage.notionURL;
			replyMessage = parse(operation.successMessage, pageName, notionURL);
		}else if(type === 'update'){
			console.log('util: update');
			replyMessage = 'choose an option'
		}
		console.log('util: after process if type is create');
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

module.exports = {
  handleCancel,
  getLastMessage,
  handleOperationSuccess,
};
