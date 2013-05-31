(function(exports) {

'use strict';

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
	Scope underscore and gamedata
*/
var _, gamedata;

/*
	Detect whether we're in a browser or in node.js
*/
if (typeof module !== 'undefined' && module.exports) {
	/*
		Include lodash for some extra functionality via RequireJS
	*/
	_ = require('lodash');

	/*
		Add the Gamedata into scope
	*/
	gamedata = require("../data/gamedata.json");

	/*
		Set the calculators version to the package version
	*/
	Calc.version = require('../package').version;
} else {
	/*
		Include lodash for some extra functionality via window._
	*/
	_ = window._;

	/*
		Add the Gamedata into scope
	*/
	gamedata = window.d3up.gamedata;
}

/*
	method attr
	returns true || false

	Adds an attributes value to the attrs of this calculator.
*/
Calc.prototype.attr = function(key, value) {
	// If we're passed an object, just set it
	if(value && typeof value === 'object') {
		return (this.attrs[key] = value);
	}
	var result = this.attrs[key] || 0;
	if(arguments.length === 1) {
		return result;
	}
	result += +value || 0;
	return (this.attrs[key] = result);
};

/*
	method rattr
	returns true || false

	Calls this.attr, but reverses the input ordering
		Used for underscore's _.each implementation, as it's value -> key
*/
Calc.prototype.rattr = function(value, key) {
	return this.attr(key, value);
};

/*
	Primary Attributes for each class

	(TODO - Move this into the gameData js)
*/
var classInfo = {
	"barbarian": {
		"primary": "strength",
		"baseAttrs": {
			"max-fury": 100
		}
	},
	"demon-hunter": {
		"primary": "dexterity"
	},
	"monk": {
		"primary": "dexterity"
	},
	"witch-doctor": {
		"primary": "intelligence"
	},
	"wizard": {
		"primary": "intelligence"
	}
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
	var primary = this.primary = classInfo[this.build['class']].primary;
	// Get our base attributes
	var baseAttrs = classInfo[this.build['class']].baseAttrs || {};
	// Get our level, or 1
	var level = this.build.level || 1;
	// Get our paragon, or 0
	var paragon = this.build.paragon || 0;
	var stat;
	
	// Our primary stat's multiplier needs to be set to 3
	multipliers[primary] = 3;

	// Apply our baseAttrs
	_.each(baseAttrs, this.rattr, this);

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
	Effects Library

	A collection of methods that skills can use to modify attributes and
		add bonuses.
*/
Calc.prototype.effects = {
	/*
		method effects.activate
		returns null

		The effects are only applied if the skill is "activated"
	*/
	activate: function(calc, data) {
		_.each(data, this.rattr, calc);
	},
	/*
		method effects.convert		
		returns null

		Converts one attribute into another by a percent.

		Example

		"convert": {
			"from": "strength",
			"to": "vitality",
			"ratio": 0.5
		}

		Converts 50% of strength into vitality
	*/
	convert: function(calc, data) {
		if(!data.to || !data.from) {
			return false;
		}
		calc.attr(data.to, calc.attr(data.from) * data.ratio);
	},
	/*
		method effects.percent
		returns null

		Applies a percentage increase to the specified stat(s)

		Example

		"percent": {
			"armor": 25 
		}

		Provides a 25% increase to armor
	*/
	"percent": function(calc, data) {
		_.each(data, function(value, attr) {
			this.attr(attr, this.attr(attr) * (value * 0.01));
		}, calc);
	},
	/*
		method effects.switch
		returns null

		Allows switching mechanisms for different bonuses based on
			an item lookup/match.

		Example

		"switch": {
			"lookup": "type",
			"against": "mainhand",
			"cases": [
				{
					"caseOf": "sword",
					"effect": {
						"plus-damage": 10
					}
				}, 
				{
					"caseOf": "mace",
					"effect": {
						"critical-hit": 10
					}
				}
			]
		}

		This will evaluate the 'type' (lookup) field on the 'mainhand' (against)
			and then loop through to see if 'type' on 'mainhand' matches any of
			the 'caseOf' fields. If a match is found, the 'effect' is applied.
	*/
	"switch": function(calc, data) {
		if(!calc.build || !calc.build.gear || !calc.build.gear[data.against]) {
			return false;
		}
		var lookup = data.lookup,
			against = data.against,
			thisCase = calc.build.gear[against][lookup];
		_.each(data.cases, function(cCase) {
			if(_.indexOf(cCase.caseOf.split("|"), thisCase) >= 0) {
				_.each(cCase.effect, this.rattr, this);
			}
		}, calc);
	}
};

/*
	method getGemEffect
	returns object

		gem = (string) the name of the gem, slugged
		item = (object) the item

	Returns an object containing the attr (key) and value (value) to 
		for what this gem should do in this item.
*/
Calc.prototype.getGemEffect = function(gem, item) {
	var itemClass = this.itemClass(item.type),
		gemData = gamedata.gemEffects[gem];
	if(_.indexOf(["helm", "spirit-stone","voodoo-mask","wizard-hat"], item.type) >= 0) {
		return gemData[1];
	} else if(itemClass === 'weapon') {
		return gemData[2];
	} else {
		return gemData[3];
	}
};

/*
	method getStats
	returns object


*/
Calc.prototype.getStats = function() {
	var test = {
		dps: Calc.math.dps(this),
		ehp: {},
		skills: {},
		stats: {
			"life": Calc.math.life(this)
		}
	};
	return test;
};

/*
	method itemClass
	returns string
	
	Pass in a type of item and it will return the itemClass associated with it.
	Used to determine which attributes are ignored and observed on items.
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
	method itemRules
	returns object

	Returns a set of rules that these items obey when parsing attributes and stats
*/
Calc.prototype.itemRules = function(itemClass) {
	var rules = {
		ignores: ["arcane-damage", "fire-damage", "lightning-damage", "poison-damage", "cold-damage", "holy-damage"],
		array: ["elite-damage", "demon-damage", "cold-reduce", "melee-reduce", "elite-reduce", "range-reduce"],
		maps: {
			"plus-block": "block-chance"
		}
	};
	var extraRules = {
		"generic": {
			ignores: []
		},
		"armor": {
			ignores: ["armor"]
		},
		"weapon": {
			ignores: ["armor", "attack-speed", "max-damage", "min-damage", "plus-damage", "minmax-damage"]			
		},                          
		"shield": {
			ignores: ["armor", "plus-block", "block-chance"]
		}
	};
	_.forOwn(extraRules[itemClass], function(extra, itemType) {
		if(_.isArray(rules[itemType])) {
			rules[itemType] = rules[itemType].concat(extra);			
		}
	});
	return rules;
};

/*
	method itemSet
	returns this

	Increments this.sets based on which set you've passed in. These are 
		later looped through in parseSetBonuses()
*/
Calc.prototype.itemSet = function(set) {
	if(!this.sets[set]) {
		this.sets[set] = 0;
	}
	this.sets[set]++;
	return this;
};

/*
	Math Library
*/
Calc.math = {
	armor: function(calc) {
		// ----------------------------------
		// Armor
		// Formula: ( Armor + Strength ) * ( Bonus Armor Percentage )
		// ----------------------------------
		return (calc.attr('armor') + calc.attr('strength'));
	},
	life: function(calc) {
		// Placeholder for Stat
		var result = 0;
		// ----------------------------------
		// Life (Different for Above/Below level 35)
		// ----------------------------------
		if(calc.build.level < 35) {
			// Formula : (36 + 4 × Level + 10 × Vitality)
			result = 36 + 4 * calc.build.level + 10 * calc.attr('vitality');			
		} else {
			// Formula : (36 + 4 * Level + (Level - 25) * Vitality)
			result = 36 + 4 * calc.build.level + (calc.build.level - 25) * calc.attr('vitality');			
		}
		// ----------------------------------
		// +% Life Addition
		// Formula : Life + ( Life * ( Plus Life / 100 ) )
		// ----------------------------------		
		result += (result * ((calc.attr('plus-life') * 100) / 100));
		return result;
	},
	// dps: require("./math/dps")
	dps: function(calc) {
		
	}
};

/*
	method parseItem
	returns this
	
	Loops through a build's items and uses this.attr to accumulate
		all attributes from all items.
*/
Calc.prototype.parseItem = function(slot, item) {
	var attr, socket;
	var itemClass = this.itemClass(item.type);
	var itemRules = this.itemRules(itemClass);

	for(attr in item.stats) {
		this.attr(attr, item.stats[attr]);
	}

	for(attr in item.attrs) {
		// Set the name so we can possibly overwrite it
		var attrName = attr;
		// Are we mapping this value to a different attribute?
		if(itemRules.maps[attr]) {
			attrName = itemRules.maps[attr];
		}
		// Ensure we aren't ignoring this stat
		if(_.indexOf(itemRules.ignores, attrName) < 0) {
			this.attr(attrName, item.attrs[attr]);			
		}
	}

	for(socket in item.sockets) {
		// Get the Gem's Effect
		attr = this.getGemEffect(item.sockets[socket], item);
		// Apply the attributes
		this.attr(attr[0], attr[1]);
	}

	if(typeof item.set === 'string') {
		this.itemSet(item.set);
	}

};

/*
	method parseItems
	returns this
	
	Loops through a build's items and uses this.attr to accumulate
		all attributes from all items.
*/
Calc.prototype.parseItems = function() {
	var slot, set;
	// Loop through and parse all items
	for(slot in this.build.gear) {
		this.parseItem(slot, this.build.gear[slot]);
	}
	return this;
};

/*
	method parseSetBonuses
	returns this

	Loops through each set that exists after parseItems, and applies
		any bonuses that should be applied.
*/
Calc.prototype.parseSetBonuses = function() {
	var set;
	// Now that all items are parsed, apply set bonuses
	for(set in this.sets) {
		// Get the count of how many items we're wearing (count) in 
		//	this set and retreive the bonus values (bonuses).
		var count = this.sets[set],
			bonuses = gamedata.sets[set];
		while(count > 0) {
			// Get the set bonus for the current count
			var effect = bonuses.effect[count];
			// If a set bonus exists (as an object)
			if(typeof effect === 'object') {
				// Iterate over the bonuses and apply the attributes
				_.each(effect, this.rattr, this);
			}
			// Decrease count by 1
			count--;
		}
	}
	return this;
};

/*
	method parseSkills
	returns this

	Takes the string representations stored on builds and converts them into 
		the gamedata objects containing all of the data.
*/
Calc.prototype.parseSkills = function() {
	if(!this.build || !gamedata) {
		return this;
	}
	var heroClass = this.build['class'];
	var active, passive, skill;
	for(active in this.build.actives) {
		skill = this.build.actives[active],
		this.actives[skill] = _.cloneDeep(gamedata.actives[heroClass][skill]);
	}
	for(passive in this.build.passives) {
		skill = this.build.passives[passive],
		this.passives[skill] = _.cloneDeep(gamedata.passives[heroClass][skill]);
	}
	return this;
};

/*
	method activateSkills
	returns this

	Iterates over the build's skills and applies the benefits they provide.
*/
Calc.prototype.activateSkills = function() {
	_.each(this.passives, function(data, skill) {
		// Do we have effects to apply?
		if(data && typeof data.effect === 'object') {
			_.each(data.effect, function(value, attr) {
				// Do we have an object to act upon or a value to add?
				if(value && typeof value === 'object') {
					this.processEffect(attr, value);
				} else {
					this.attr(attr, value);					
				}
			}, this);			
		}
	}, this);
	return this;
};

/*
	method processEffect
	returns null

	If an effect on a skill is not a attr/value, it's passed through processEffect,
		which uses Calc.effects to call the appropriate function and apply the
		proper effect for the skill.
*/
Calc.prototype.processEffect = function(type, data) {
	var fname = type;
	Calc.prototype.effects[fname](this, data);
};

/*
	method reset
	returns this
	
	Resets the calculated values for the build.
*/
Calc.prototype.reset = function() {
	this.attrs = {};
	this.actives = {};
	this.passives = {};
	this.sets = {};
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
	this.parseSetBonuses();
	this.parseSkills();
	this.activateSkills();
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

})(typeof exports === 'undefined'? this['d3up'] || (this['d3up'] = {}) : exports);