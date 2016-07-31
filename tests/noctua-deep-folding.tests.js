////
//// Some unit testing for bbop-graph-noctua.
////
//// Keep in mind that we regularly import the tests from upstream
//// bbop-graph.
////
//// Issues found here:
////  geneontology/noctua#325
////

var assert = require('chai').assert;
var model = new require('..');

var us = require('underscore');
var each = us.each;

///
/// Helpers.
///

// function _get_graph_for_x325(){
//     var raw_resp = require('./minerva-09.json');
//     var g = new model.graph();
//     g.load_data_basic(raw_resp['data']);
//     return g;
// }

///
/// Tests.
///

describe("subgraph folding; new issues in geneontology/noctua#325", function(){

    it('model is folded and subgraphs should be absorbed, direct', function(){

    	var raw_resp = require('./minerva-09.json');
    	var g = new model.graph();
    	g.load_data_basic(raw_resp['data']);

	// As used in noctua-obo at that time. 
    	var rellist = [
	    'RO:0002233',
	    'RO:0002234',
	    'RO:0002333',
	    'RO:0002488',
	    'BFO:0000066',
	    'BFO:0000051',
	    'RO:0000053'
	];

    	// To start, make sure we're starting at a sane point...
    	assert.equal(g.all_nodes().length, 8,
		     "pre: all nodes accounted for (8)");
    	assert.equal(g.all_edges().length, 7,
		     "pre: all edges accounted for (7)");
	
	// See what happens when we fold and unfold a bunch of times.
	//g.report_state(); console.log('');
	us(100).times(function(n){
	    // console.log('pre (n): ' + g.all_nodes().length);
	    // console.log('pre (e): ' + g.all_edges().length);
	    assert.equal(g.all_nodes().length, 8, "in (n): (" + n + ")");
	    assert.equal(g.all_edges().length, 7, "in (e): (" + n + ")");
    	    //g.fold_evidence();
    	    g.fold_go_noctua(rellist);
	    //g.report_state(); console.log('');	    
	    // console.log('in (n): ' + g.all_nodes().length);
	    // console.log('in (e): ' + g.all_edges().length);
	    // g.report_state(); console.log('');
    	    g.unfold();
	    assert.equal(g.all_nodes().length, 8, "out (n): (" + n + ")");
	    assert.equal(g.all_edges().length, 7, "out (e): (" + n + ")");
	    // console.log('post (n): ' + g.all_nodes().length);
	    // console.log('post (e): ' + g.all_edges().length);
	});
	//g.report_state(); console.log('');

    	// Make sure bad things didn't happen. In the expected failing
    	// case, we're down to /five/ edges.
    	assert.equal(g.all_nodes().length, 8,
		     "post: all nodes accounted for (8)");
    	assert.equal(g.all_edges().length, 7,
		     "post: all edges accounted for (7)");
	
    });
    
});
    
// var assert = require('chai').assert;
// var model = new require('..');
// var us = require('underscore');
// var each = us.each;
// var keys = us.keys;
// var raw_resp = require('./minerva-09.json');
// var g = new model.graph();
// g.load_data_basic(raw_resp['data']);
// g.fold_go_noctua();
// var p = us.map(g.all_edges(), function(x){ return x.get_referenced_subgraph_profiles(); })[0][0];
