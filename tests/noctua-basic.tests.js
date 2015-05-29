////
//// Some unit testing for bbop-graph-noctua.
////

var assert = require('chai').assert;
var model = new require('..');

describe('test annotation', function(){

    it('works on its own', function(){

	var a1 = new model.annotation({'key': 'foo', 'value': 'bar'});
	assert.isString(a1.id(), 'string id');
	assert.isAbove(a1.id().length, 5,'long string id');
	assert.equal(a1.property('foo'), 'bar', 'has prop');
	assert.equal(a1.property('bar'), null, 'does not have prop');
    });
});
