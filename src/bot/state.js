/**
 *  The STATE object provides a way to keep track of the current state of the conversation, as a way to direct the text messages to the appropriate handler
 */
const STATE = {
  waiting: 'waiting',
  rename: 'rename',
  details: 'details',
  selecting: 'selecting',
  current: 'waiting',
	update:'updating',
  lastKeyboardMessage: null,
	databaseId: null,
};

module.exports = { STATE };
