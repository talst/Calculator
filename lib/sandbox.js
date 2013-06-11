(function(exports) {

'use strict';

/*
	Constructor for Sandbox

	Automatically calls reset upon creation.
*/
var Sandbox = exports.Sandbox = function() {
	this.reset();
};

/*
	Scope underscore and gamedata
*/
var _;

/*
	Detect whether we're in a browser or in node.js
*/
if (typeof module !== 'undefined' && module.exports) {
	/*
		Include lodash for some extra functionality via RequireJS
	*/
	_ = require('lodash');
} else {
	/*
		Include lodash for some extra functionality via window._
	*/
	_ = window._;
}

Sandbox.prototype.reset = function() {
	this.calcs = {};
	return this;
};

Sandbox.prototype.add = function(calc, name) {
	if(!name) {
		name = calc.build.id;
	}
	this.calcs[name] = calc;		
	return this;
};

Sandbox.prototype.get = function(name) {
	return this.calcs[name];
};

Sandbox.prototype.compare = function() {
	var diff = {};
	_.each(this.calcs, function(p1, id1) {
		_.each(this.calcs, function(p2, id2) {
			// Building an array to keep names unique... if anyone has a better way!
			var players = [];
			players.push(id1);
			players.push(id2);
			players.sort();
			var title = players.join("_");
			if(!diff[title] && id1 !== id2) {
				diff[title] = {};
				_.each(['dps', 'ehp'], function(stat) {
					var value1 = 0;
					if(p1.stats && p1.stats[stat]) {
						if(p1.stats[stat][stat]) {
							value1 = p1.stats[stat][stat];							
						}
					}
					var value2 = 0;
					if(p2.stats && p2.stats[stat]) {
						if(p2.stats[stat][stat]) {
							value2 = p2.stats[stat][stat];							
						}
					}
					diff[title][stat] = value1 - value2;
				});
			}
		});
	}, this);
	return diff;
};

})(typeof exports === 'undefined'? this['d3up'] || (this['d3up'] = {}) : exports);