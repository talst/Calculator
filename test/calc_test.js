var mocha  = require('mocha');
var expect = require('chai').expect;
var assert = require("assert");
var sinon = require("sinon");
var _ = require("lodash");

var Calc = require('../main').Calc;

suite("calc.js >", function () {

	function caseDataSuite(suiteName, setupMethod) {
		var cases = require('./data/' + suiteName);
		suite(suiteName + ' >', function() {
			_.each(cases, function(testCase) {
				suite(testCase.name + " >", function() {
					setup(function() {
						this.calc = new Calc();
						setupMethod.call(this, testCase.given);
					});
					_.each(testCase.expected, function(expected, attr) {
						test(attr + " is correct (" + expected + ")", function() {
							assert.deepEqual(expected, this.calc.attr(attr));
						});         
					});
				});
			});
		});
	}
	
  test("should know its version", function() {
    expect(Calc.version).to.not.equal(undefined);
    expect(Calc.version).to.equal(require('../package').version);
  });
	test("Calc is a function", function() {
		assert.equal(typeof Calc, 'function');
	});
	
	suite("constructor >", function() {
		setup(function() { 
			sinon.stub(Calc.prototype, 'setBuild');
			sinon.stub(Calc.prototype, 'run');
			this.calc = new Calc();
		});
		teardown(function() {
			Calc.prototype.setBuild.restore();
			Calc.prototype.run.restore();
		});
		test("did not call run", function() {
			assert.ok(!Calc.prototype.run.called);
		});
		test("did not call setBuild", function() {
			assert.ok(!Calc.prototype.setBuild.called);
		});
		test("attrs empty", function() {
			assert.deepEqual(this.calc.attrs, {});
		});
	});
	
	suite("constructor with data >", function() {
		setup(function() { 
			this.testData = require('./data/character');
			sinon.stub(Calc.prototype, 'setBuild', function() {
				return this;
			});
			sinon.stub(Calc.prototype, 'run');
			this.calc = new Calc(this.testData);
		});
		teardown(function() {
			Calc.prototype.setBuild.restore();
			Calc.prototype.run.restore();
		});
		test("called run", function() {
			assert.ok(Calc.prototype.run.called);
		});
		test("called setBuild", function() {
			assert.ok(Calc.prototype.setBuild.called);
			assert.deepEqual(Calc.prototype.setBuild.args[0], 
				[this.testData]);
		});
	});
	
	suite("attr >", function() {
		setup(function() {
			this.calc = new Calc();
		});
		test("get empty attribute", function() {
			assert.equal(this.calc.attr('test'), 0);
		});
		test("set attribute", function() {
			this.calc.attr("test", 1);
			assert.equal(this.calc.attr("test"), 1);
		});
		test("set attribute adds", function() {
			this.calc.attr("test", 1);
			this.calc.attr("test", 2);
			assert.equal(this.calc.attr("test"), 3);
		});
		test("set attribute string", function() {
			this.calc.attr("test", "2");
			assert.strictEqual(this.calc.attr("test"), 2);
		});
		test("set attribute null", function() {
			this.calc.attr("test", "2");
			this.calc.attr("test", null);
			assert.strictEqual(this.calc.attr("test"), 2);
		});
		test("set attribute NaN",  function() {
			this.calc.attr("test", "2");
			this.calc.attr("test", NaN);
			assert.strictEqual(this.calc.attr("test"), 2);
		});
	});
	
	caseDataSuite("calcBase", function(given) {
		this.calc.setBuild(given);
		this.calc.calcBase();
	});
	
	suite("getItem >", function() {
		var testData = require('./data/character');
		var calc = new Calc(testData);			
		test("returns false on bad slot", function() {
			assert.equal(false, calc.getItem('badslot'));
		});
		suite("returns items >", function() {
			_.each(calc.build.gear, function(item, slot) {
				test("returns " + slot, function() {
					assert.deepEqual(item, calc.getItem(slot));
				});							
			});
		});
	});

	suite("getStats >", function() {
		_.each(require('./data/getStats'), function(data) {
			console.log(data.name);
			suite(data.name + " stats test >", function() {
				setup(function() {
					this.calc = new Calc(data.hero);
				});
				teardown(function() {
					this.calc.reset();
				});
				_.each(data.expected, function(values, name) {
					if(_.isObject(values)) {
						suite(name + " >", function() {
							_.each(values, function(value, attr) {
								test(attr + ": ", function() {
									assert.deepEqual(value, this.calc.stats[name][attr]);								
								});
							}, this);
						});						
					} else {
						test(name, function() {
							assert.deepEqual(values, this.calc.stats[name]);
						});
					}
				});
			});
		});
	});
	
	suite("itemClass >", function() {
		var types = {
			"generic": ["amulet", "ring", "mojo", "source", "quiver"],
			"armor": ["belt","boots","bracers","chest","cloak","gloves","helm","pants","mighty-belt","shoulders","spirit-stone","voodoo-mask","wizard-hat"],
			"weapon": ["2h-mace","2h-axe","bow","daibo","crossbow","2h-mighty","polearm","staff","2h-sword","axe","ceremonial-knife","hand-crossbow","dagger","fist-weapon","mace","mighty-weapon","spear","sword","wand"],	
			"shield": ["shield"]
		};
		setup(function() {
			this.calc = new Calc();
		});
		_.each(types, function(items, type) {
			_.each(items, function(item) {
				test("Correct Item Class: " + item, function() {
					assert.equal(type, this.calc.itemClass(item));
				});
			});
		});
	});
	
	suite("itemRules >", function() {
		setup(function() {
			this.calc = new Calc();
		});
		_.each(['generic', 'weapon', 'shield', 'armor'], function(type) {
			test("Retrieved Item Rule: " + type, function() {
				assert.equal('object', typeof this.calc.itemRules(type));
			});
		});
	});
	
	caseDataSuite("parseItem", function(given) {
		this.calc.setBuild(given);
		_.each(given.gear, function(item, type) {
			this.calc.parseItem(type, given.gear[type]);			
		}, this);
	});
	
	suite("parseSkills >", function() {
		var data = false;
		var testData = require('./data/character');
		var calc = new Calc(testData);
		var gamedata = require("../data/gamedata.json");

		test("has gamedata", function() {
			assert.equal('object', typeof gamedata);
		});
		suite("active skills >", function() {
			_.each(calc.actives, function(data, skill) {
				test(skill + " is object", function() {
					assert.equal('object', typeof data);
				});
			});			
		});
		suite("passive skills >", function() {
			_.each(calc.passives, function(data, skill) {
				test(skill + " is object", function() {
					assert.equal('object', typeof data);
				});
			});			
		});
	});
	
	suite("testing skill data", function() {
		var expects = require("./data/skills/passives"),
			gamedata = require("../data/gamedata.json");
		_.each(['barbarian', 'demon-hunter', 'monk', 'witch-doctor', 'wizard'], function(heroClass) {
			suite("skill math for " + heroClass, function() {
				_.each(expects[heroClass], function(expects, skill) {
					suite("passive: " + skill, function() {
						_.each(expects, function(value, attr) {
							test("Checking: " + attr, function() {
								var hero = require("./data/class/" + heroClass);
								var calc = new Calc(hero);
								calc.passives[skill] = gamedata.passives[heroClass][skill];
								calc.activateSkills();
								assert.equal(value, calc.attr(attr));
							});	
						}, this);
					});
				}, this);
			}, this);
		});
	});

	caseDataSuite("parseItems", function(given) {
		this.calc.setBuild(given);
		this.calc.parseItems();
	});

	suite("processEffect >", function() {
		setup(function() {
			this.sampleSwitch = {
				"lookup": "type",
				"against": "test",
				"cases": [
					{
						"caseOf": "helm",
						"effect": {
							"critical-hit": 25
						}
					},
					{
						"caseOf": "chest",
						"effect": {
							"critical-hit-damage": 50
						}
					}
				]
			};
			testData = require('./data/character');
			this.calc = new Calc();
			this.calc.setBuild(testData);
			this.calc.calcBase();
		});
		teardown(function() {
			this.calc.reset();
		});
		test("activate", function() {
			this.calc.processEffect("activate", {
				'strength': 10
			});
			assert(377, this.calc.attr("strength"));
		});
		suite("percent", function() {
			test("increases strength and vitality", function() {
				this.calc.processEffect("percent", {
					'strength': 10,
					'vitality': 10
				});
				assert.equal(403.7, this.calc.attr("strength"));
				assert.equal(271.7, this.calc.attr("vitality"));
			});
			test("doesn't cause a stat to set to zero", function() {
				this.calc.processEffect("percent", {
					'strength': 0
				});
				assert.notEqual(0, this.calc.attr("strength"));
			});
			test("is fine when that stat doesn't exist", function() {
				this.calc.reset();
				this.calc.processEffect("percent", {
					'strength': 0
				});
			});
		});
		suite("convert", function() {
			var effect = {
				"from": "strength",
				"to": "vitality",
				"ratio": 0.5
			};
			test("empty objects won't create 'undefined' stats", function() {
				this.calc.processEffect("convert", {});
				assert.equal('undefined', typeof this.calc.attrs['undefined']);
			});
			test("works if 'to' isn't present", function() {
				delete this.calc.attrs.vitality;
				this.calc.processEffect("convert", effect);
				assert.equal(183.5, this.calc.attr("vitality"));
			});
			test("doesn't add if 'from' isn't present", function() {
				delete this.calc.attrs.strength;
				this.calc.processEffect("convert", effect);
				assert.equal(247, this.calc.attr("vitality"));
			});
			test("converts strength to vitality", function() {
				this.calc.processEffect("convert", effect);
				assert.equal(430.5, this.calc.attr("vitality"));
			});
		});
		suite("switching", function() {
			test("doesn't crash when item doesn't exist", function() {
				delete this.calc.build.gear['test'];
				this.calc.processEffect("switch", this.sampleSwitch);
				assert.equal(5, this.calc.attr("critical-hit"));
				assert.equal(50, this.calc.attr("critical-hit-damage"));			
			});
			test("doesn't apply when item type isn't matched", function() {
				this.calc.build.gear['test'] = {
					type: "not matching"
				};
				this.calc.processEffect("switch", this.sampleSwitch);
				assert.equal(5, this.calc.attr("critical-hit"));
				assert.equal(50, this.calc.attr("critical-hit-damage"));			

			});
			test("switch [case 1]", function() {
				this.calc.build.gear['test'] = {
					type: "helm"
				};
				this.calc.processEffect("switch", this.sampleSwitch);
				assert.equal(30, this.calc.attr("critical-hit"));
				assert.equal(50, this.calc.attr("critical-hit-damage"));			
			});
			test("switch [case 2]", function() {
				this.calc.build.gear['test'] = {
					type: "chest"
				};
				this.calc.processEffect("switch", this.sampleSwitch);
				assert.equal(5, this.calc.attr("critical-hit"));			
				assert.equal(100, this.calc.attr("critical-hit-damage"));			
			});

		});
	});
	
	suite("reset >", function() {
		setup(function() {
			this.calc = new Calc();
			this.chainable = this.calc.reset();
		});
		test("chainable", function() {
			assert.strictEqual(this.chainable, this.calc);
		});
		test("creates attrs", function() {
			assert.ok(this.calc.attrs);
			assert.deepEqual({}, this.calc.attrs);
		});
		test("creates actives", function() {
			assert.ok(this.calc.actives);
			assert.deepEqual({}, this.calc.actives);
		});
		test("creates passives", function() {
			assert.ok(this.calc.passives);
			assert.deepEqual({}, this.calc.passives);
		});
		test("creates sets", function() {
			assert.ok(this.calc.sets);
			assert.deepEqual({}, this.calc.sets);
		});
		test("overwrites attrs", function() {
			var attrs = this.calc.attrs;
			this.calc.reset();
			assert.notStrictEqual(this.calc.attrs, attrs);
			assert.ok(this.calc.attrs);
		});
	});
	
	suite("run >", function() {
		setup(function() { 
			this.testData = require('./data/character');
			this.calc = new Calc();
			sinon.stub(this.calc, 'activateSkills');
			sinon.stub(this.calc, 'calcBase');
			sinon.stub(this.calc, 'parseItems');
			sinon.stub(this.calc, 'parseSkills');
			sinon.stub(this.calc, 'parseSetBonuses');
			sinon.stub(this.calc, 'reset');
			this.calc.setBuild(this.testData);
			this.calc.run();
		});
		teardown(function() {
			this.calc.calcBase.restore();
			this.calc.parseItems.restore();
			this.calc.parseSkills.restore();
			this.calc.parseSetBonuses.restore();
			this.calc.activateSkills.restore();
			this.calc.reset.restore();
		});
		test("calls activateSkills", function() {
			assert.ok(this.calc.activateSkills.called);
		});
		test("calls calcBase", function() {
			assert.ok(this.calc.calcBase.called);
		});
		test("calls parseItems", function() {
			assert.ok(this.calc.parseItems.called);
		});
		test("calls parseSkills", function() {
			assert.ok(this.calc.parseSkills.called);
		});
		test("calls parseSetBonuses", function() {
			assert.ok(this.calc.parseSetBonuses.called);
		});
		test("calls reset", function() {
			assert.ok(this.calc.reset.called);
		});
		test("calls reset before calcBase", function() {
			assert.ok(this.calc.reset.calledBefore(this.calc.calcBase));
		});
	});
	
	suite("setBuild >", function() {
		setup(function() { 
			this.testData = require('./data/character');
			this.calc = new Calc();
			this.chainable = this.calc.setBuild(this.testData);
		});
		test("chainable", function() {
			assert.strictEqual(this.chainable, this.calc);
		});
		test("build was cloned", function() {
			assert.notStrictEqual(this.calc.build, this.testData);
		});
		test("build was deep cloned", function() {
			assert.notStrictEqual(this.calc.build.gear, this.testData.gear);
		});
		test("build data matches", function() {
			assert.deepEqual(this.calc.build, this.testData);
		});
	});
	
});