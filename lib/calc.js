(function(exports) {

'use strict';

/*
	An empty Calc with the fields that need predefined
*/
var emptyCalc = {
	attrs: {}
};

/*
	Include lodash for some extra functionality
*/
var _ = require('lodash');

/*
	Constructor for Calc

	Automatically calls reset upon creation, and if a build is passed in,
		set the calculator's build to the build provided.
*/
var Calc = exports.Calc = function(build) {
	this.reset();
	if(build) {
		this.setBuild(build).run();
	}
};

/*
	Set the calculators version to the package version
*/
Calc.version = require('../package').version;

/*
	method attr
	returns true || false

	Adds an attributes value to the attrs of this calculator.
*/
Calc.prototype.attr = function(key, value) {
	var result = this.attrs[key] || 0;
	if(arguments.length === 1) {
		return result;
	}
	result += +value || 0;
	return (this.attrs[key] = result);
};

/*
	Primary Attributes for each class

	(TODO - Move this into the gameData js)
*/
var classInfo = {
	barbarian: "strength",
	"demon-hunter": "dexterity",
	monk: "dexterity",
	"witch-doctor": "intelligence",
	wizard: "intelligence"
};

/*
	method calcBase
	returns null

	Calculates base attrs based on:
		- level
		- paragon
		- class
*/
Calc.prototype.calcBase = function() {

	// Base Multipliers for Base Attributes
	var multipliers = {
		"strength": 1, 
		"dexterity": 1, 
		"intelligence": 1, 
		"vitality": 2
	};
	// Get our primary stat
	var primary = this.primary = classInfo[this.build['class']];
	// Get our level, or 1
	var level = this.build.level || 1;
	// Get our paragon, or 0
	var paragon = this.build.paragon || 0;
	var stat;
	
	// Our primary stat's multiplier needs to be set to 3
	multipliers[primary] = 3;

	// For each of our multipliers, let's add it to the stats
	for(stat in multipliers) {
		// Formula is: 7 + Multiplier * (level + paragon)
		this.attr(stat, 7 + multipliers[stat] * (level + paragon));
	}

	// If we have paragon levels, add some gold and magic find
	if(paragon) {
		this.attr("plus-magic-find", 3 * paragon);
		this.attr("plus-gold-find", 3 * paragon);
	}

	// Add in default critical-hit and critical-hit-damage
	this.attr("critical-hit", 5);
	this.attr("critical-hit-damage", 50);
};

/*

*/
Calc.prototype.itemClass = function(type) {
	var types = {
		"generic": ["amulet", "ring", "mojo", "source", "quiver"],
		"armor": ["belt","boots","bracers","chest","cloak","gloves","helm","pants","mighty-belt","shoulders","spirit-stone","voodoo-mask","wizard-hat"],
		"weapon": ["2h-mace","2h-axe","bow","daibo","crossbow","2h-mighty","polearm","staff","2h-sword","axe","ceremonial-knife","hand-crossbow","dagger","fist-weapon","mace","mighty-weapon","spear","sword","wand"],	
		"shield": ["shield"]
	};
	var itemClass = null;
	_.each(types, function(valid, result) {
		if(_.indexOf(valid, type) >= 0) {
			itemClass = result; 
		}
	});
	return itemClass;
};

/*
	method parseItem
	returns this
	
	Loops through a build's items and uses this.attr to accumulate
		all attributes from all items.
*/
Calc.prototype.parseItem = function(slot, item) {
	var attr;


	var displayOnly = ['armor'];

	for(attr in item.stats) {
		this.attr(attr, item.attrs[attr]);
	}
	for(attr in item.attrs) {
		if(_.indexOf(displayOnly, attr) < 0) {
			this.attr(attr, item.attrs[attr]);			
		}
	}
};

/*
	method parseItems
	returns this
	
	Loops through a build's items and uses this.attr to accumulate
		all attributes from all items.
*/
Calc.prototype.parseItems = function() {
	var slot;
	// Loop through and parse all items
	for(slot in this.build.gear) {
		this.parseItem(slot, this.build.gear[slot]);
	}
	return this;
};

/*
	method reset
	returns this
	
	Resets the calculated values for the build.
*/
Calc.prototype.reset = function() {
	this.attrs = _.cloneDeep(emptyCalc.attrs);
	return this;
};

/*
	method run
	returns this
	
	Resets the calculator and then runs the simulation.
*/
Calc.prototype.run = function() {
	this.reset();
	this.calcBase();
	this.parseItems();
	return this;
};

/*
	method setBuild
	returns this
	params
		[0] build - JSON Representation of a build
	
	Sets the build in the calculator to reference character information.
*/
Calc.prototype.setBuild = function(build) {
	this.build = _.cloneDeep(build);
	return this;
};

})(typeof window !== 'undefined' ? window : module.exports);