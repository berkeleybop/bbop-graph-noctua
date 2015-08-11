////
//// Some unit testing for bbop-graph-noctua.
////
//// Keep in mind that we regularly import the tests from upstream
//// bbop-graph.
////
//// The file we're using is a JSONified version of 5525a0fc00000001
//// (Consistency Paper March dph)
////

var assert = require('chai').assert;
var model = new require('..');

var us = require('underscore');
var each = us.each;

///
/// Helpers.
///

function _get_standard_graph(){
    var raw_resp = require('./minerva-03.json');
    var g = new model.graph();
    g.load_data_basic(raw_resp['data']);
    return g;
}

// Should lead to "physical interaction evidence"
var model_a = 'gomodel:5525a0fc00000001';
var seed_a = "obo:#5525a0fc00000001%2F5595c4cb00000425";
// The one leaf in the graph ("protein binding").
var leaf_a = 'gomodel:5525a0fc00000001\/5525a0fc0000023';
// Bub2.
var node_a = 'obo:#5525a0fc00000001%2F5595c4cb00000431';

///
/// Tests.
///

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
	    if( ann.key() === 'foo' ){
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

describe('looking for edges', function(){

    it('by id', function(){	

	var g = new model.graph();
	var n1 = new model.node('a');
	var n2 = new model.node('b');
	var e1 = new model.edge('a', 'b');
	g.add_node(n1);
	g.add_node(n2);
	g.add_edge(e1);

	assert.equal(g.get_edge_by_id(e1.id()).id(), e1.id(), 'same edge id');
	assert.deepEqual(g.get_edge_by_id(e1.id()), e1, 'same edge');
	assert.isNull(g.get_edge_by_id('foo'), 'no edge');
    });
});


describe('do referenced subgraphs work as expected', function(){

    it("add a subgraph", function(){	

	// Setup.
	var g = _get_standard_graph();
	
    	var n = g.get_node(leaf_a);
	assert.equal(n.referenced_subgraphs().length, 0, 'no subgraphs');

	// Add referenced subgraph.
	var sub = new model.graph();
	sub.add_node(new model.node('sub_node_a'));
	assert.equal(sub.all_nodes().length, 1, 'add a node to the subgraph');
	n.add_referenced_subgraph(sub);

	assert.equal(n.referenced_subgraphs().length, 1, 'a subgraph');
    	var m = g.get_node(leaf_a); // check again
	assert.equal(m.referenced_subgraphs().length, 0, 'still not a subgraph');

	// Clobber with clone with reference.
	g.add_node(n);

    	var o = g.get_node(leaf_a); // check again
	assert.equal(o.referenced_subgraphs().length, 1, 'got a subgraph');
    });
});

describe('flex new framework', function(){

    it('can we eat a minerva response?', function(){	

	// Setup.
	var g = _get_standard_graph();
	var raw_resp = require('./minerva-01.json');

	// Right?
	assert.isDefined(raw_resp['data']['individuals'],
			      'pulled in right example');
    });

    it('basic graph checks', function(){

	// Setup.
	var g = _get_standard_graph();

	assert.equal(g.id(),model_a, 'graph id');
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
	var g = _get_standard_graph();
	
	// Head up from our one leaf
	var nid = leaf_a;
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
	assert.equal(t.class_id(), 'SGD:S000004659', 'IDed with SGD');
	assert.equal(t.class_label(), 'BUB2', 'labeled with BUB2');

	// Take a look at the annotations of e closely.
	var all_anns = e.annotations();
	assert.equal(all_anns.length, 2, 'two associated annotations');
	var anns = e.get_annotations_by_key('date');
	assert.equal(anns.length, 1, 'one date annotation');
	assert.equal(anns[0].value(), '2015-04-14', 'correct date annotation');
	
    });

    it("evidence that evidence works", function(){

    	// Setup.
    	var g = _get_standard_graph();
    	g.fold_evidence();
	
    	// Okay, we should have a lot less nodes now.
    	assert.equal(g.all_nodes().length, 14, '22 - 8 ev nodes = 14');
	
    	// Let's track down the evidence for one node.
    	var n = g.get_node(leaf_a);
    	assert.equal(n.id(), leaf_a, 'some weirdness here at one point');

    	// The hard way.
    	var ri = n.referenced_subgraphs();
    	assert.equal(ri.length, 1, 'one ev subgraph');
    	var ev_sub = ri[0];
    	assert.equal(ev_sub.all_nodes().length, 1, 'one piece of ev');
	var ev_ind = ev_sub.all_nodes()[0];
    	var types = ev_ind.types();
    	assert.equal(types.length, 1, 'one class exp');
    	var t = types[0];
    	assert.equal(t.class_id(), 'ECO:0000021', 'say hi');

    	// The easy way.
    	var profs = n.get_referenced_subgraph_profiles();
    	assert.equal(profs.length, 1, 'one profile using this method');
    	var first_prof = profs[0];
    	assert.isNotNull(first_prof.id, 'has id using this method');
    	assert.equal(first_prof.class_expressions.length, 1,
    		     'one ce using this method');
    	assert.equal(first_prof.annotations.length, 1,
    		     'one ann using this method');

    	// The overly easy super-simple (GO) way.
    	var evs = n.get_basic_evidence(['source']);
    	//console.log(evs);
    	assert.equal(evs.length, 1, 'one evs');
    	var ev = evs[0];
    	assert.isString(ev['id'], 'got RI id');
    	// From class_expression.to_string()
    	//assert.equal(ev['cls'], 'ECO:0000021', 'got ev class');
    	assert.equal(ev['cls'], 'physical interaction evidence', 'got ev class');
    	assert.equal(ev['source'], 'PMID:12048186', 'got source ref');
    });
});

describe('merging works as expected', function(){

    it("we've got to merge it merge it", function(){	

	// Setup.
	var g_base = new model.graph();
	var g_new = _get_standard_graph();
	g_new.fold_evidence();

	// Empty g_base should now essentially be g_new.
	g_base.merge_in(g_new);

	// Check it, make sure that bbop-graph-noctua structures are
	// all present.
	assert.equal(g_base.all_nodes().length, 14, 'right num nodes');
	assert.equal(g_base.all_edges().length, 14, 'right num edges');	
	var a_node = g_base.all_nodes()[0];
	assert.isString(g_base.get_node_elt_id(a_node.id()),
			'generated elt_id');
	assert.equal(g_base.annotations().length, 4, 'four annotations');
    });
    
});

describe('abbreviate graph as expected in go noctua loader', function(){

    it('pull in many subgraphs', function(){	

	// Example node.
	var ex_nid = leaf_a;

	// Setup.
	var g = _get_standard_graph();
	var rellist = ['RO:0002333', 'BFO:0000066'];

	// Check type label.
	var ex_n = g.get_node(ex_nid);
	var ex_types = ex_n.types();
	assert.equal(ex_types.length, 1, 'has one type');
	var ex_type = ex_types[0];
	assert.equal(ex_type.type(), 'class', 'is a class');
	assert.equal(ex_type.class_id(), 'GO:0005515', 'has good id');
	assert.equal(ex_type.class_label(), 'protein binding', 'has good label');
	
	// Fold and continue.
	g.fold_go_noctua(rellist);

	// Basic structure count.
	assert.equal(g.all_nodes().length, 7, 'only seven nodes left');
	assert.equal(g.all_edges().length, 7, 'only seven edges left');

	// Five subragphs, all containing the embedding individual as
	// part of this loader's process.
	var num_sub = 0;
	var self_contained_sub = 0;
	each(g.all_nodes(), function(n){
	    if( n.subgraph() ){
		num_sub++;
		var s = n.subgraph();
		//console.log('sub in: ' + n.id());
		//console.log('sub is: ' + typeof(s.get_node));
		if( s.get_node(n.id()) ){
		    self_contained_sub++;
		}
	    }
	});
	assert.equal(num_sub, 5, 'five embedded subgraphs');
	assert.equal(self_contained_sub, 5, 'five self-containing subgraphs');

	// Close examination of a single subgraph.
	var n = g.get_node(ex_nid);
	assert.equal(n._is_a, 'bbop-graph-noctua.node', 'node is a node');
	var s = n.subgraph();
	assert.equal(s._is_a, 'bbop-graph-noctua.graph', 'graph is a graph');
	assert.equal(s.all_nodes().length, 2, 'subgraph has two nodes');
	assert.equal(s.all_edges().length, 1, 'subgraph has one edges');
	assert.equal(s.all_edges()[0].predicate_id(), 'RO:0002333',
		     'correct subraph edge');

	// Unfold and retest labels.
	(function(){
	    g.unfold();
	    var ex_n = g.get_node(ex_nid);
	    var ex_types = ex_n.types();
	    assert.equal(ex_types.length, 1, 'has one type');
	    var ex_type = ex_types[0];
	    assert.equal(ex_type.type(), 'class', 'is a class');
	    assert.equal(ex_type.class_id(), 'GO:0005515', 'has good id');
	    assert.equal(ex_type.class_label(), 'protein binding',
			 'has good label');
	})();
    });
});

describe("let's take a close look at types and inferred types", function(){

    it('are they working as expected?', function(){	

	// Setup.
	var g = _get_standard_graph();
	var rellist = ['RO:0002333', 'BFO:0000066'];
	g.fold_go_noctua(rellist);

	var nid = leaf_a;
	var n = g.get_node(nid);	

	//console.log('type:', n.types());
	//console.log('inferred type:', n.inferred_types());

	assert.equal(n.types().length, 1, 'one std');
	assert.equal(n.inferred_types().length, 2, 'two inferred');
	assert.equal(n.get_unique_inferred_types().length, 1,
		     'one unique inferred');
	assert.equal(n.types()[0].class_id(), 'GO:0005515',
		     'std class id');
	assert.equal(n.get_unique_inferred_types()[0].class_id(), 'GO:0098772',
		     'one unique inferred class id');

    });
});

describe("clobbering updating", function(){

    it('updating with a subgraph is not the same as a merge', function(){	

	// Setup.
	var g = _get_standard_graph();
	var rellist = ['RO:0002333', 'BFO:0000066'];
	g.fold_go_noctua(rellist);

	// Make a new graph to operate on.
	var update_g = new model.graph();
	// Adding graph annotations.
	var an1 = new model.annotation({"key": "title",	"value": "meow"});
	update_g.add_annotation(an1);
	// Adding graph parts.
	var un1 = new model.node(leaf_a); // already there
	var un2 = new model.node(node_a); // already there
	var un3 = new model.node('blahblah'); // new node
	var ue1 = new model.edge(un1.id(), un2.id(), 'RO:1234567');
	update_g.add_node(un1);
	update_g.add_node(un2);
	update_g.add_node(un3);
	update_g.add_edge(ue1);

	// Double check.
	assert.equal(update_g.all_nodes().length, 3, 'subgraph has 3 nodes');
	assert.equal(update_g.all_edges().length, 1, 'subgraph has 1 edge');
	assert.equal(update_g.annotations().length, 1, 'subgraph has 1 ann');

	// Update our graph with new graph.
	//console.log('pre', g.all_nodes().length);
	g.update_with(update_g);
	//console.log('post', g.all_nodes().length);

	// Graph annotations clobbered to one.
	assert.equal(g.annotations().length, 1, 'updated graph has 1 ann');
	assert.equal(g.annotations()[0].key(), 'title', 'has title');
	assert.equal(g.annotations()[0].value(), 'meow', 'title "meow"');

	// We have one new node, a duplicate of something that was
	// folded, and the same edges.
	assert.equal(g.all_nodes().length, 9,
		     'updated graph has nine nodes (7 + 2 = 9)');
	assert.equal(g.all_edges().length, 4, 'updated graph has four edges');

    });
});

describe("special/dumb merge updating", function(){

    it('updating with a subgraph to make it like a rebuild', function(){	

	// Setup.
	var g = _get_standard_graph();
	var rellist = ['RO:0002333', 'BFO:0000066'];
	g.fold_go_noctua(rellist);

	// Make a new graph to operate on.
	var update_g = new model.graph();
	// Graph annotations.
	var an1 = new model.annotation({"key": "title",	"value": "meow"});
	update_g.add_annotation(an1);
	// Graph parts.
	var un1 = new model.node(leaf_a); // already there
	var un2 = new model.node(node_a); // already there
	var un3 = new model.node('blahblah');
	var ue1 = new model.edge(un1.id(), un2.id(), 'RO:1234567');
	update_g.add_node(un1);
	update_g.add_node(un2);
	update_g.add_node(un3);
	update_g.add_edge(ue1);

	// Double check.
	assert.equal(update_g.all_nodes().length, 3, 'subgraph has 3 nodes');
	assert.equal(update_g.all_edges().length, 1, 'subgraph has 1 edge');
	assert.equal(update_g.annotations().length, 1, 'subgraph has 1 ann');

	// Update our graph with new graph.
	g.merge_special(update_g);

	// Graph annotations clobbered.
	assert.equal(g.annotations().length, 1, 'rebuild merge graph has 1 ann');
	assert.equal(g.annotations()[0].key(), 'title', 'has title');
	assert.equal(g.annotations()[0].value(), 'meow', 'title "meow"');

	// We have one new node, a duplicate of something that was
	// folded, and one additional edge.
	assert.equal(g.all_nodes().length, 9,
		     'updated graph has nine nodes (7 + 2 = 9)');
	assert.equal(g.all_edges().length, 8, 'updated graph has eight edges');

    });
});

describe("unfolding works", function(){

    it('basic unfolded graph checks', function(){

	// Setup.
	var g = _get_standard_graph();

	// Double-check fold.
	var rellist = ['RO:0002333', 'BFO:0000066'];
	g.fold_go_noctua(rellist);
	assert.equal(g.all_nodes().length, 7, 'only seven nodes left');
	assert.equal(g.all_edges().length, 7, 'only seven edges left');

	// Unfold and check.
	g.unfold();
	assert.equal(g.all_nodes().length, 22, 'return to right num nodes');
	assert.equal(g.all_edges().length, 14, 'return to right num edges');

	///
	/// The next three examples are from various tests
	/// above--copied to ensure.
	///

	// Deeper check.
	assert.equal(g.id(),model_a, 'graph id');
	assert.equal(g.annotations().length, 4, '4 graph annotation');
	var anns = g.get_annotations_by_key('date');
	assert.equal(anns.length, 1, 'one date annotation');
	assert.equal(anns[0].value(), '2015-04-10', 'correct date annotation');

	// More exploring.
	assert.equal(g.get_singleton_nodes().length, 8, 'ev makes singletons');
	assert.equal(g.get_root_nodes().length, 17, 'technically lots of roots');
	assert.equal(g.get_leaf_nodes().length, 9, 'leaves are ev + 1 here');
	
	// S'more.
	var nid = leaf_a;

	var n = g.get_node(nid);	
	assert.equal(n.types().length, 1, 'one std');
	// Currently dealing with possibly bad data in minerva-02.json
	assert.equal(n.inferred_types().length, 2, 'two inferred');

	// Ditto
	assert.equal(n.get_unique_inferred_types().length, 1,
		     'one unique inferred');
	assert.equal(n.types()[0].class_id(), 'GO:0005515',
		     'std class id');
	// Ditto.
	assert.equal(n.get_unique_inferred_types()[0].class_id(), 'GO:0098772',
		     'one unique inferred class id');
    });
});

describe("does graph comparison work? (loaded data edition)", function(){

    it('identity', function(){

	// Setup.
	var a = _get_standard_graph();

	assert.isTrue(a.is_topologically_equal(a), "ident: a is same as a");
    });

    it('same loaded graph', function(){

	// Setup.
	var a = _get_standard_graph();
	var b = _get_standard_graph();

	assert.isTrue(a.is_topologically_equal(b), "loaded: a is same as b");
	assert.isTrue(b.is_topologically_equal(a), "loaded: b is same as a");
    });

    it('loaded graph versus empty', function(){

	// Setup.
	var a = _get_standard_graph();
	var b = new model.graph();

	assert.isFalse(a.is_topologically_equal(b), "l/e: a is not same as b");
	assert.isFalse(b.is_topologically_equal(a), "l/e: b is not same as a");
    });

    it('manipulate graph', function(){

	// Setup.
	var a = _get_standard_graph();
	var b = a.clone();

	// Clones are the same.
	assert.isTrue(a.is_topologically_equal(b), "man: a is same as b");

	// eliminate a node.
	b.remove_node(seed_a);

	// Should no longer be the same.
	assert.isFalse(a.is_topologically_equal(b), "man: a is now not same as b");
    });
});


describe("new evidence operations", function(){

    it('evidence seeds', function(){

	// Setup.
	var g = _get_standard_graph();

	//
	assert.equal(us.keys(g.extract_evidence_seeds()).length, 8,
		     "eight seeds, right?");
    });

    it('evidence cliques - GO edition', function(){

	// Setup.
	var g = _get_standard_graph();

	assert.isNotNull(g.get_node(seed_a), "seed is a node");

	var cliq = g.get_evidence_clique(seed_a);
	//console.log("<<<>>>", cliq._is_a);
	assert.equal(cliq._is_a, 'bbop-graph-noctua.graph', "cliq is a graph");
	assert.equal(cliq.id(), seed_a, "model takes seed id");

	//
	assert.equal(cliq.all_nodes().length, 1, "cliq with 1 node");
	assert.equal(cliq.all_edges().length, 0, "cliq with 0 edges");
    });

    it('evidence subcliques - GO edition', function(){

	// Setup.
	var g = _get_standard_graph();

	// Should lead to "physical interaction evidence"
	var esub = g.get_evidence_subclique(seed_a);
	assert.isNotNull(esub, "seed is a node in esub");
	assert.equal(esub._is_a, 'bbop-graph-noctua.graph', "esub is a graph");
	assert.equal(esub.id(), seed_a, "esub model takes seed id");

	// Not much in there.
	assert.equal(esub.all_nodes().length, 1, "ev sub with 1 node");
	assert.equal(esub.all_edges().length, 0, "ev sub with 0 edges");
    });
});

describe("inconsistent_p and modified_p", function(){

    it('would expect them not to usually be defined', function(){

	// Setup.
	var g = _get_standard_graph();

	//
	assert.equal(g.inconsistent_p(), null, "consistency unknown");
	assert.equal(g.modified_p(), null, "modification unknown");
    });

    it('goose setup so they are false', function(){

	// Setup.
	var raw_resp = require('./minerva-03.json');
	raw_resp['data']['inconsistent-p'] = false;
	raw_resp['data']['modified-p'] = false;
	var g = new model.graph();
	g.load_data_basic(raw_resp['data']);

	//
	assert.equal(g.inconsistent_p(), false, "consistency false");
	assert.equal(g.modified_p(), false, "modification false");
    });

    it('goose setup so they are true', function(){

	// Setup.
	var raw_resp = require('./minerva-03.json');
	raw_resp['data']['inconsistent-p'] = true;
	raw_resp['data']['modified-p'] = true;
	var g = new model.graph();
	g.load_data_basic(raw_resp['data']);

	//
	assert.equal(g.inconsistent_p(), true, "consistency true");
	assert.equal(g.modified_p(), true, "modification true");
    });

    it('make sure truth survives a cloning', function(){

	// Setup.
	var raw_resp = require('./minerva-03.json');
	raw_resp['data']['inconsistent-p'] = true;
	raw_resp['data']['modified-p'] = true;
	var g = new model.graph();
	g.load_data_basic(raw_resp['data']);

	var c = g.clone()

	//
	assert.equal(c.inconsistent_p(), true, "clone consistency true");
	assert.equal(c.modified_p(), true, "clone modification true");
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
