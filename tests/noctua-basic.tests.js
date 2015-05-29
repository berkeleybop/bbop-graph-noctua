////
//// Some unit testing for bbop-graph-noctua.
////

var assert = require('chai').assert;
var model = new require('..');

describe('test annotation', function(){

    it('works on its own', function(){

	var a1 = new model.annotation({'key': 'foo', 'value': 'bar'});

	// Id
	assert.isString(a1.id(), 'string id');
	assert.isAbove(a1.id().length, 5,'long string id');

	// Current.
	assert.equal(a1.key(), 'foo', 'has key');
	assert.equal(a1.value(), 'bar', 'has value');
	assert.equal(a1.value_type(), null, 'does not have value-type');

	// Write-over simple.
	assert.equal(a1.value('bib'), 'bib', 'has set value');
	assert.equal(a1.value(), 'bib', 'still has set value');
	
	// Write-over full.
	assert.deepEqual(a1.annotation('1', '2', '3'),
			 {'key': '1', 'value': '2', 'value-type': '3'}, 'redo');
	assert.equal(a1.value_type(), '3', 'now has value-type');
    });

});

describe('annotation bulk ops', function(){

    it('graph context extant', function(){
	var g = new model.graph();
	assert.isFunction(g.get_annotation_by_id, 'annotation attached to');
    });

    it('works in graph context', function(){

	var g = new model.graph();

	var a1 = new model.annotation({'key': 'foo', 'value': 'bar'});
	var a2 = new model.annotation({'key': 'bib', 'value': 'bab'});

	var a1_id = a1.id()
	var a2_id = a2.id()

	g.add_annotation(a1);
	g.add_annotation(a2);

	assert.equal(a1_id, g.get_annotation_by_id(a1_id).id(),
		     'get annotation by id');
	assert.equal(g.annotations().length, 2,
		     'two annotations in');

	function filter(ann){
	    var ret = false;
	    if( ann.key() == 'foo' ){
		ret = true;
	    }
	    return ret;
	}
	assert.equal(g.get_annotations_by_filter(filter).length, 1,
		     'one annotation by filter');
    });

});
