const NotionProperties = require('./NotionProperties')

module.exports = class NotionPageProperties extends NotionProperties{
  constructor(title, options) {
		super(title, options);
    this._addProperty('Name', this._createTitleProperty(title));
    this._addProperty('Inbox', this._createCheckboxProperty(true));
    this._buildOptionalProperties(options);
  }
};
