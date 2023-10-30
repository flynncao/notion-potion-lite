/**
 * This file exports a function that registers event handlers for the bot.
 * The handlers respond to messages, and more to come
 *
 */

const bot = require('../bot');
const {
  handleNewMessage,
  handleRenameMessage,
  handleDetailsMessage,
	handleUpdateMessage,
} = require('./message-handlers');

const {
	handleUpdate,
  handleRename,
  handleMove,
  handleDetails,
  handleAddTopic,
  handleAddProject,
  handleOutbox,
  handleDelete,
  handleDone,
  handleSelectedNewDatabase,
	handleSelectedDatabase,
	handleSelectedRow,
	handleSelectedProperty,
  handleSelectedTopic,
  handleSelectedProject,
  handleBack,
	handleGetAllRecord
} = require('./callback-query-handlers');
const { checkAuthorization } = require('../middleware');
const { STATE } = require('../state');
const { handleCancel } = require('../utils');
const store = require('../../databases/store');

const clearUpOldKeyboard = async function (incomingTextMessage) {
  bot.editMessageReplyMarkup(null, {
    chat_id: incomingTextMessage.chat.id,
    message_id: STATE.lastKeyboardMessage.message_id,
  });

  STATE.current = STATE.waiting;
  handlers.messageHandlers.waiting(incomingTextMessage);
};

const handlers = {
  callbackQueryHandlers: {
    operation: {
      //Multiple Action buttons: Clicking these button require either clicking other buttons or typing more text to finish the action
			update: handleUpdate,
      rename: handleRename,
      move: handleMove,
      details: handleDetails,
      addTopic: handleAddTopic,
      addProject: handleAddProject,
			allRecord: handleGetAllRecord,
      //Single Action buttons: These actions are done once the button is clicked
      outbox: handleOutbox,
      delete: handleDelete,
      done: handleDone,
      back: handleBack,
    },
    dataSelection: {
      database: handleSelectedNewDatabase,
			row: handleSelectedRow,
			property: handleSelectedProperty, 
			table: handleSelectedDatabase,
      topic: handleSelectedTopic,
      project: handleSelectedProject,
    },
  },
  messageHandlers: {
		updating: handleUpdateMessage,
    waiting: handleNewMessage,
    rename: handleRenameMessage,
    details: handleDetailsMessage,
    selecting: clearUpOldKeyboard,
  },
};

/**
 * Read action commands from user selection and call the appropriate query handler
 * @param {*} callbackQuery 
 */
const handleCallBackQuery = async function (callbackQuery) {
  const action = callbackQuery.data.split('#');
  const actionId = action[0];
  const actionData = action[1];
	const additionalData = action[2];
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  //Clear the previous keyboard
  bot.deleteMessage(chatId, messageId);
  if (actionId === 'operation') {
		// DOING: handle callback query via actions
		if(additionalData && actionData === 'update'){
			store.activePropertyName = additionalData
		}
    handlers.callbackQueryHandlers.operation[actionData](chatId);
  } else {
		const fn = handlers.callbackQueryHandlers.dataSelection[actionId]
		if(fn instanceof Function){
			fn(chatId, actionData)
		}else{
			handleCancel(msg, 'Operation error, auto canceling')
		}
  }

  bot.answerCallbackQuery(callbackQuery.id).catch((err) => {
    logError(`Failed to answer callback query: ${err}`);
  });
};

/**
 * Read the current state and call the appropriate message handler
 * @param {*} incomingTextMessage 
 */
const handleMessage = async function (incomingTextMessage) {
	console.log('STATE.current', STATE.current)
  handlers.messageHandlers[STATE.current](incomingTextMessage);
};

const authorizedHandelCallBackQuery = checkAuthorization(handleCallBackQuery);
const authorizedHandleMessage = checkAuthorization(handleMessage);

const registerBotEventHandlers = function () {
  //TODO
  bot.onText(/\/shopping/, (incomingTextMessage) => {
    // bot.sendMessage(msg.chat.id, 'Okay, Will keep that title');
  });

  // Respond to text messages
  bot.on('message', (incomingTextMessage) => {
    authorizedHandleMessage(incomingTextMessage);
  });
  bot.on('callback_query', (query) => {
    authorizedHandelCallBackQuery(query);
  });
};
module.exports = { registerBotEventHandlers };
