var mocha  = require('mocha');
var expect = require('chai').expect;
var assert = require("assert");
var sinon = require("sinon");
var _ = require("underscore");

var Calc = require('../main').Calc;

suite("calc.js >", function () {
  test("should know its version", function() {
    expect(Calc.version).to.not.equal(undefined);
    expect(Calc.version).to.equal('0.0.0');
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
			this.testData = require('./data/jesta');
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
	suite("calcBase >", function() {
		var testData = require('./data/calcBase');
		setup(function() {
			this.calc = new Calc();
		});
		_.each(testData, function(testCase) {
			test(testCase.name, function() {
				this.calc.reset();
				this.calc.setBuild(testCase.given);
				this.calc.calcBase();
				assert.deepEqual(this.calc.attrs, testCase.expected);
			});
		});
	});
	suite("setBuild >", function() {
		setup(function() { 
			this.testData = require('./data/jesta');
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
			this.testData = require('./data/jesta');
			this.calc = new Calc();
			sinon.stub(this.calc, 'calcBase');
			sinon.stub(this.calc, 'parseItems');
			sinon.stub(this.calc, 'reset');
			this.calc.setBuild(this.testData);
			this.calc.run();
		});
		test("calls parseItems", function() {
			assert.ok(this.calc.parseItems.called);
		});
		test("calls reset", function() {
			assert.ok(this.calc.reset.called);
		});
		test("calls calcBase", function() {
			assert.ok(this.calc.calcBase.called);
		});
		test("calls reset before calcBase", function() {
			assert.ok(this.calc.reset.calledBefore(this.calc.calcBase));
		});
	});
	suite("parseItems >", function() {
		setup(function() { 
			this.testData = require('./data/jesta');
			this.calc = new Calc(this.testData);
		});
		test("", function() {
			
		});
	});
});