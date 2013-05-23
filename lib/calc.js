(function(exports) {
'use strict';

var emptyCalc = {
	attrs: {}
};

var _ = require('lodash');
var Calc = exports.Calc = function(build) {
	this.reset();
	if(build) this.setBuild(build).run();
};

Calc.version = require('../package').version;

Calc.prototype.attr = function(key, value) {
	var result = this.attrs[key] || 0;
	if(arguments.length === 1) {
		return result;
	}
	result += +value || 0;
	return (this.attrs[key] = result);
};

var classInfo = {
	barbarian: "strength",
	"demon-hunter": "dexterity",
	monk: "dexterity",
	"witch-doctor": "intelligence",
	wizard: "intelligence"
};

Calc.prototype.calcBase = function() {
	var multipliers = {
		"strength": 1, 
		"dexterity": 1, 
		"intelligence": 1, 
		"vitality": 2
	};
	var primary = this.primary = classInfo[this.build['class']];
	var level = this.build.level || 1;
	var paragon = this.build.paragon || 0;
	var stat;

	multipliers[primary] = 3;

	for(stat in multipliers) {
		this.attr(stat, 7 + multipliers[stat] * (level + paragon));
	}
	
	if(paragon) {
		this.attr("plus-magic-find", 3 * paragon);
		this.attr("plus-gold-find", 3 * paragon);
	}

};

Calc.prototype.parseItems = function() {
	console.log("called me");
};

Calc.prototype.reset = function() {
	this.attrs = _.cloneDeep(emptyCalc.attrs);
	return this;
};

Calc.prototype.run = function() {
	this.reset();
	this.calcBase();
	this.parseItems();
	return this;
};

Calc.prototype.setBuild = function(build) {
	this.build = _.cloneDeep(build);
	return this;
};

// file wide scope
})(typeof window !== 'undefined' ? window : module.exports);