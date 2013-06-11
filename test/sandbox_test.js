var mocha  = require('mocha');
var expect = require('chai').expect;
var assert = require("assert");
var sinon = require("sinon");
var _ = require("lodash");

var Calc = require('../main').Calc;
var Sandbox = require('../main').Sandbox;

suite("sandbox.js >", function () {
	test("Sandbox is a function", function() {
		assert.equal(typeof Sandbox, 'function');
	});
	test("Sandbox resets", function() {
		var sandbox = new Sandbox(),
				calc = new Calc(require("./data/character"));
		sandbox.add(calc);
		sandbox.reset();
		assert.deepEqual({}, sandbox.calcs);
	});
	suite("Sandbox accepts builds >", function() {
		setup(function() {
			this.calc = new Calc(require("./data/character"));
			this.sandbox = new Sandbox();
		});
		teardown(function() {
			this.sandbox.reset();
		});
		test("single build", function() {
			this.sandbox.add(this.calc);
			assert.deepEqual(this.sandbox.calcs[this.calc.build.id], this.calc);
		});
		test("doesn't duplicate an unnamed calc", function() {
			this.sandbox.add(this.calc);
			this.sandbox.add(this.calc);
			assert.deepEqual(this.sandbox.calcs[this.calc.build.id], this.calc);
			assert.deepEqual(_.keys(this.sandbox.calcs).length, 1);
		});
		test("multiple calcs work with names", function() {
			this.sandbox.add(this.calc, "1");
			this.sandbox.add(this.calc, "2");
			assert.deepEqual(_.keys(this.sandbox.calcs).length, 2);
		});
		test("can retrieve a calc by name", function() {
			this.sandbox.add(this.calc, "1");
			this.sandbox.add(this.calc, "2");
			assert.deepEqual(this.calc, this.sandbox.get("2"));
		});
		test("compare returns a compare", function() {
			this.sandbox.add(this.calc, "1");
			this.sandbox.add(this.calc, "2");
			assert.deepEqual( { '1_2': { dps: 0, ehp: 0 } }, this.sandbox.compare() );
		});
		test("compare works with an empty object", function() {
			this.sandbox.add({}, "1");
			this.sandbox.add(this.calc, "2");
			assert.deepEqual( { '1_2': { dps: -this.calc.stats.dps.dps, ehp: -this.calc.stats.ehp.ehp } }, this.sandbox.compare() );
		});
	});
});