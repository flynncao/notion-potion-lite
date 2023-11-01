/**
 * Object-Relation-Mapping of Notion API
 */
const R = require('remeda')
/**
 * Get property using label to infer id
 * https://github.com/makenotion/notion-sdk-js/issues/391#issuecomment-1474119103
 * https://developers.notion.com/reference/retrieve-a-page-property
 * @param {*} properties Properties of an Notion Page Response Object
 * @param {*} value Notion Property Response Object 
 * @param {*} label Property Display Name, Example: Name, Tags, Inbox, 'Total Episodes', etc
 * @returns 
 */
function getPropertyUsingLabelToInferId(properties, value, label) {
  const name_to_id_mappings = Object.fromEntries(
    Object.entries(properties).map(([k, v]) => [k, v.id])
  );
  const key = name_to_id_mappings[label]; // %3CQ%3FE
  const fields = Object.values(value); // ['property_item', '%3CQ%3FE', ' "number", 2 ]
  const field = fields.find((field) => field.id === key);
  if (!field) {
    throw new Error(`Field ${label.toString()}`);
  }
  return field;
};




function getPropertyRawValue(property) {
	const type = property.type
	if(type === 'rich_text' || type === 'title'){
		return R.isEmpty(property[property.type]) ? '' : property[property.type][0].plain_text
	}else if(type === 'text'){
		return property.text.content
	}
	else if(type === 'formula'){
		const formula_type = property[type].type
		return property.formula[formula_type]
	}else if(type === 'multi_select'){
		return R.isEmpty(property[type]) ? '' : property[type].map(item=>item.name).join(', ')
	}else if(type === 'select'){
		return property.select.name
	}else if(type === 'date'){
		// TODO: feat: handle date range
		return property.date.start
	}else if(type === 'relation'){
		// TODO: feat: handle display of relation property
		//return property.relation.map(item=>item.id).join(', ')
		return ' - '
	}else if(type === 'url'){
		// return property.url
		// TODO: feat: handle display of url property 
		return '-'
	}
	else {
		return property[type]
	}
};



module.exports = {
	getPropertyUsingLabelToInferId,
	getPropertyRawValue
}
