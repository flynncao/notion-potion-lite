/**
 * This file exports a function that handles incoming messages to the Telegram bot.
 * The function uses middleware to check the authorization
 * of the sender and process the message to a Notion page.
 */
const { Client } = require('@notionhq/client');

const notionClient = new Client({ auth: process.env.NOTION_TOKEN });

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
const { handleSelectedDatabase } = require('./callback-query-handlers');
const { createNewHistoryInDB } = require('../../databases/crud');
const store = require('../../databases/store');
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
		console.log('m-h:processed message', message)
		if(message.text === '/help'){
			handleOperationSuccess(incomingTextMessage.chat.id, operations.help, true, 'help');
		}else{
			console.log('message.text', message.text);
	
			if(message.text === ''){
				// TODO: refactor: use callback function
				handleSelectedDatabase(incomingTextMessage.chat.id, message.database.id)			
			}else{
				const notionPage = new NotionPage(message);
				const notionResponse = await notionPage.createNewPage();
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


const handleUpdateMessage = async function (incomingTextMessage) {
  const operation = operations.rename;
  STATE.current = STATE.waiting;

  if (await handleCancel(incomingTextMessage, operation.onCancelMessage))
    return;

  logInput(operation.logInputMessage, incomingTextMessage.text);

  try {
		// urgent refactor: do not call notion API directly
		const {activePage, activePropertyName} = store
		console.log('activePropertyName', activePropertyName)
		const pageId = activePage.id
		const key = activePage.properties[activePropertyName].type
		console.log('key', key)
		const value = incomingTextMessage.text
		console.log('value', value)
		const payload = {
			page_id: pageId,
			properties: {
			},
		}
		console.log('payload', payload)
		payload.properties[activePropertyName] = 	{rich_text: [
			{
				text: {
					content: incomingTextMessage.text,
				},
			},
		]}
		notionClient.pages.update(payload);
		// console.log('store.activePage', store.activePage)
    // await store.activePage.updateProperty(incomingTextMessage.text);
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
	handleUpdateMessage,
  handleDetailsMessage,
};
