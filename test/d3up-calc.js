var mocha  = require('mocha');
var expect = require('chai').expect;

describe("D3Up", function () {
  it("should know its version", function () {
    var myProject = require('../main');
    expect(myProject.version).to.not.equal(undefined);
    expect(myProject.version).to.equal('0.0.0');
  });
});