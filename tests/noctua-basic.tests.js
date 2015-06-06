////
//// Some unit testing for bbop-graph-noctua.
////
//// Keep in mind that we regularly import the tests from upstream
//// bbop-graph.
////

var assert = require('chai').assert;
var model = new require('..');

var us = require('underscore');
var each = us.each;

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

	var a1_id = a1.id();
	var a2_id = a2.id();

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

describe('trivial isolated graph ops', function(){
    it('subclassing works', function(){	

	var g = new model.graph();
	assert.isNull(g.id(), 'no default id');
	assert.equal(g.add_id('foo'), 'foo', 'new id');
	assert.equal(g.id(), 'foo', 'also new id');
	assert.equal(g.get_id(), 'foo', 'and also new id');
    });
});

describe('flex new framework', function(){

    it('can we eat a minerva response?', function(){	

	// Setup.
	var raw_resp = require('./minerva-01.json');
	var g = new model.graph();
	g.load_data_base(raw_resp['data']);

	// Right?
	assert.isDefined(raw_resp['data']['individuals'],
			      'pulled in right example');
    });

    it('basic graph checks', function(){

	// Setup.
	var raw_resp = require('./minerva-01.json');
	var g = new model.graph();
	g.load_data_base(raw_resp['data']);

	assert.equal(g.id(),'gomodel:taxon_559292-5525a0fc0000001_all_indivdual',
		     'graph id');
	assert.equal(g.annotations().length, 4, '4 graph annotation');
	var anns = g.get_annotations_by_key('date');
	assert.equal(anns.length, 1, 'one date annotation');
	assert.equal(anns[0].value(), '2015-04-10', 'correct date annotation');

	// Wee tests.
	assert.equal(g.all_nodes().length, 22, 'right num nodes');
	assert.equal(g.all_edges().length, 14, 'right num edges');
	
	// More exploring.
	assert.equal(g.get_singleton_nodes().length, 8, 'ev makes singletons');
	assert.equal(g.get_root_nodes().length, 17, 'technically lots of roots');
	assert.equal(g.get_leaf_nodes().length, 9, 'leaves are ev + 1 here');
    });
	
    it("let's go for a walk in the neighborhood", function(){
	
	// Setup.
	var raw_resp = require('./minerva-01.json');
	var g = new model.graph();
	g.load_data_base(raw_resp['data']);
	
	// Head up from our one leaf
	var nid = 'gomodel:taxon_559292-5525a0fc0000001-GO-0005515-5525a0fc0000023';
	var n = g.get_node(nid);
	assert.equal(n.id(), nid, 'got the node');

	// Step around.
	var all_pnodes = g.get_parent_nodes(n.id());
	var enb_pnodes = g.get_parent_nodes(n.id(),'RO:0002333');
	assert.equal(all_pnodes.length, 5, '5 parents');
	assert.equal(enb_pnodes.length, 1, 'but 1 enabled_by parent');

	var e = enb_pnodes[0]; 

	// Take a look at the types of e closely.
	var ts = e.types();
	assert.equal(ts.length, 1, 'one associated type');
	var t = ts[0];
	assert.equal(t.class_label(), 'SGD:S000004659', 'labeled with SGD');

	// Take a look at the annotations of e closely.
	var all_anns = e.annotations();
	assert.equal(all_anns.length, 2, 'two associated annotations');
	var anns = e.get_annotations_by_key('date');
	assert.equal(anns.length, 1, 'one date annotation');
	assert.equal(anns[0].value(), '2015-04-14', 'correct date annotation');
	
    });

    it("evidence that evidence works", function(){

	// Setup.
	var raw_resp = require('./minerva-01.json');
	var g = new model.graph();
	g.load_data_fold_evidence(raw_resp['data']);
	
	// Okay, we should have a lot less nodes now.
	assert.equal(g.all_nodes().length, 14, '22 - 8 ev nodes = 14');
	
	// Let's track down the evidence for one node.
	var nid = 'gomodel:taxon_559292-5525a0fc0000001-GO-0005515-5525a0fc0000023';
	var n = g.get_node(nid);
	assert.equal(n.id(), nid, 'some weirdness here at one point');

	// The hard way.
	var ri = n.referenced_individuals();
	assert.equal(ri.length, 1, 'one piece of ev');
	var ev_ind = ri[0];
	var types = ev_ind.types();
	assert.equal(types.length, 1, 'one class exp');
	var t = types[0];
	assert.equal(t.class_id(), 'ECO:0000021', 'say hi');

	// The easy way.
	// TODO: profile
    });
});


// var assert = require('chai').assert;
// var model = new require('..');
// var us = require('underscore');
// var each = us.each;
// var keys = us.keys;
// var raw_resp = require('./minerva-01.json');
// var g = new model.graph();
// g.load_data_fold_evidence(raw_resp['data']);
