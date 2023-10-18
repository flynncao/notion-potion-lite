module.exports = class History {

	/**
	 * @param {*} options Column values of each row in this table
	 * @param {*} databases Meta data about all table
	 */
  constructor(options, databases) {

    this.setParentDB(options.parent, databases);
    this.setName(options.name);
		this.setNotionURL(options.notionURL);
  }

  setName(name) {
    this.name = name;
  }

	setNotionURL(notionURL) {
		this.notionURL = notionURL;
	}

	/**
	 * Add a reference to the parent database
	 * @param {*} parent 
	 * @param {*} databases 
	 */
  setParentDB(parent, databases) {
    this.parent = databases[parent]; 
  }

}
