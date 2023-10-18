/**
 * This file exports a function that handles incoming messages to the Telegram bot.
 * The function uses middleware to check the authorization
 * of the sender and process the message to a Notion page.
 */
const { logInput } = require('../../lib/logger');
const bot = require('../bot');
const MessageProcessor = require('../../classes/MessageProcessor');
const Message = require('../../classes/Message');
const URLMessage = require('../../classes/URLMessage');
const NotionPage = require('../../classes/notion/NotionPage');
const messagesHistory = require('../messages-history');
let { STATE } = require('../state');
const operations = require('../bot-operation-messages');
const { handleError } = require('./error-handlers');
const {
  handleCancel,
  getLastMessage,
  handleOperationSuccess,
} = require('../utils');
const {createNewHistoryInDB} = require('../../databases/crud');
/**

Handles incoming messages by processing them to Notion and sending the result back to the user.
@param {Object<Message>} incomingTextMessage The incoming message from the chat to the bot.
*/

const handleNewMessage = async function (incomingTextMessage) {
  const operation = operations.save;

  logInput(operation.logInputMessage, incomingTextMessage.text);

  try {
    const processedMessage = new MessageProcessor(incomingTextMessage.text);
    const message = processedMessage.url
      ? new URLMessage(processedMessage)
      : new Message(processedMessage);

    await message.process();
		console.log('message', message)
		if(message.text === '/update'){
			console.log('message-hanlder: update');
			handleOperationSuccess(incomingTextMessage.chat.id, operations.update, true, 'update');
		}else{
			console.log('message-hanlder: create');
			const notionPage = new NotionPage(message);
			const notionResponse = await notionPage.createNewPage();
			console.log('message-handler:notionResponse', notionResponse)
			notionPage.id = notionResponse.id;
			notionPage.notionURL = notionResponse.url;
			// TODO: push notionPage to messagesHistory(only exists in the memory)
			messagesHistory.push(notionPage);
			// TODO: test message with URL and with @pagename
			await createNewHistoryInDB({
				name: message.text, 
				id: notionPage.id,
				notionURL: notionPage.notionURL,
				parent: notionPage.database.name,
			});
			handleOperationSuccess(incomingTextMessage.chat.id, operations.save, true);
		}
  
  } catch (error) {
    handleError(error, incomingTextMessage.chat.id);
  }
};

const handleRenameMessage = async function (incomingTextMessage) {
  const operation = operations.rename;
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
};

const handleDetailsMessage = async function (incomingTextMessage) {
  const operation = operations.details;
  STATE.current = STATE.waiting;

  if (await handleCancel(incomingTextMessage, operation.onCancelMessage))
    return;
  logInput(operation.logInputMessage, incomingTextMessage.text);

  try {
    await getLastMessage().addTextBlock(incomingTextMessage.text);
    handleOperationSuccess(incomingTextMessage.chat.id, operation);
  } catch (error) {
    handleError(error, incomingTextMessage.chat.id);
  }
};

module.exports = {
  handleNewMessage,
  handleRenameMessage,
  handleDetailsMessage,
};
