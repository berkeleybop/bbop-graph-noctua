/** 
 * Purpose: Noctua editing operations ove a bbop-graph base.
 * 
 * The base pieces are just subclasses of their analogs in bbop-graph.
 * 
 * @see module:bbop-graph
 * @module bbop-graph-noctua
 */

var us = require('underscore');
var each = us.each;
var keys = us.keys;
var bbop = require('bbop-core');
var bbop_model = require('bbop-graph');
var class_expression = require('class-expression');

///
/// New stuff: annotations.
///

/**
 * Edit annotations.
 * Everything can take annotations.
 * 
 * This structure of the raw key-value set has been updated in the
 * wire protocol. It now looks like:
 * 
 * : {"key": "contributor", "value": "GOC:kltm" }
 * 
 * or:
 * 
 * : {"key": "contributor", "value": "GOC:kltm", "value-type":"foo"}
 * 
 * @constructor
 * @param {Object} [kv_set] - optional a set of keys and values; a simple object
 * @returns {this} new instance
 */
function annotation(kv_set){
    this._id = bbop.uuid();
    
    this._properties = {};
    
    if( kv_set && bbop.what_is(kv_set) == 'object' ){
	
	// Attempt to convert
	if( kv_set['key'] && kv_set['value'] ){
	    // var key = kv_set['key'];
	    // var val = kv_set['value'];
	    // var adj_set = {};
	    // adj_set[key] = val;
	    // Silently pass in value-type if there.
	    this._properties = bbop.clone(kv_set);
	}else{
	    // TODO: Replace this at some point with the logger.
	    console.log('bad annotation k/v set: ', kv_set);
	}
    }
}

/**
 * The unique id of this annotation.
 *
 * @returns {String} string
 */
annotation.prototype.id = function(){
    return this._id;
};

/**
 * Add/modify a property by key and value (and maybe value_type).
 *
 * @param {String} key - string
 * @param {String} [value] - string
 * @param {String} [value_type] - string
 * @returns {String|null} returns property is key
 */
annotation.prototype.annotation = function(key, value, value_type){

    var anchor = this;
    var ret = null;

    // Set if the key and value are there.
    if( key ){
	if( typeof(value) !== 'undefined' ){
	    anchor._properties['key'] = key;
	    anchor._properties['value'] = value;

	    // Add or get rid of value type depending.
	    if( typeof(value_type) == 'undefined' ){
		delete anchor._properties['value-type'];
	    }else{
		anchor._properties['value-type'] = value_type;
	    }
	}
    }
    ret = anchor._properties;

    return ret;
};

/**
 * Get/set annotation's key.
 *
 * @param {String} [key] - string
 * @returns {String|null} returns string of annotation
 */
annotation.prototype.key = function(key){
    var anchor = this;
    if( key ){ anchor._properties['key'] = key; }
    return anchor._properties['key'];
};

/**
 * Get/set annotation's value.
 *
 * @param {String} [value] - string
 * @returns {String|null} returns string of annotation
 */
annotation.prototype.value = function(value){
    var anchor = this;
    if( value ){ anchor._properties['value'] = value; }
    return anchor._properties['value'];
};

/**
 * Get/set annotation's value-type.
 *
 * @param {String} [value_type] - string
 * @returns {String|null} returns string of annotation
 */
annotation.prototype.value_type = function(value_type){
    var anchor = this;
    if( value_type ){ anchor._properties['value-type'] = value_type; }
    return anchor._properties['value-type'];
};

/**
 * Delete a property by key.
 *
 * @param {String} key - string
 * @returns {Boolean} true if not empty
 */
annotation.prototype.delete = function(){

    var anchor = this;
    var ret = false;

    if( ! us.isEmpty(anchor._properties) ){
	anchor._properties = {}; // nuke
	ret = true;
    }

    return ret;
};

/**
 * Clone an annotation.
 *
 * @returns {annotation} a fresh annotation for no shared structure
 */
annotation.prototype.clone = function(){
    var anchor = this;

    // Copy most of the data structure.
    var a = {};
    if( anchor.key() ){ a['key'] = anchor.key(); }
    if( anchor.value() ){ a['value'] = anchor.value(); }
    if( anchor.value_type() ){ a['value-type'] = anchor.value_type(); }

    var new_ann = new annotation(a);

    // Copy ID as well.
    new_ann._id = anchor._id;
    
    return new_ann;
};

///
/// Generic internal annotation operations; dynamically attached to
/// graph, node, and edge.
///

/**
 * Get/set annotation list.
 *
 * @name annotations
 * @function
 * @param {Array} [in_anns] - list of annotations to clobber current list
 * @returns {Array} list of all annotations
 */
function _annotations(in_anns){
    if( us.isArray(in_anns) ){
	this._annotations = in_anns;
    }
    return this._annotations;
}

/**
 * Add annotation.
 *
 * @name add_annotation
 * @function
 * @param {annotation} in_ann - annotation to add
 * @returns {Array} list of all annotations
 */
function _add_annotation(in_ann){
    if( ! us.isArray(in_ann) ){
	this._annotations.push(in_ann);
    }
    return this._annotations;
}

/**
 * Get a sublist of annotation using the filter function. The filter
 * function take a single annotation as an argument, and adds to the
 * return list if it evaluates to true.
 *
 * @name get_annotations_by_filter
 * @function
 * @param {Function} filter - function described above
 * @returns {Array} list of passing annotations
 */
function _get_annotations_by_filter(filter){

    var anchor = this;
    var ret = [];
    each(anchor._annotations, function(ann){
	var res = filter(ann);
	if( res && res == true ){
	    ret.push(ann);
	}
    });
    return ret;
}

/**
 * Get sublist of annotations with a certain key.
 *
 * @name get_annotations_by_key
 * @function
 * @param {String} key - key to look for.
 * @returns {Array} list of list of annotations with that key
 */
function _get_annotations_by_key(key){
    var anchor = this;

    var ret = [];
    each(anchor._annotations, function(ann){
	if( ann.key() == key ){
	    ret.push(ann);
	}
    });

    return ret;
}

/**
 * Get sublist of annotations with a certain ID.
 *
 * @name get_annotations_by_id
 * @function
 * @param {String} aid - annotation ID to look for
 * @returns {Array} list of list of annotations with that ID
 */
function _get_annotation_by_id(aid){

    var anchor = this;
    var ret = null;
    each(anchor._annotations, function(ann){
	if( ann.id() == aid ){
	    ret = ann;
	}
    });
    return ret;
}

///
/// Generic internal evidence (reference individuals) operations;
/// dynamically attached to node and edge.
///

/**
 * Get/set referenced individual list.
 *
 * Also, changes type to "referenced" from (probably) node.
 *
 * @name referenced_individuals
 * @function
 * @param {Array} [indivs] - list of {node} to clobber current list
 * @returns {Array} list of all referenced individuals
 */
function _referenced_individuals(indivs){

    if( us.isArray(indivs) ){

	// Convert type.
	each(indivs, function(ind){
	    ind.type('referenced');
	});

	// Not copies, so add by replacement.
	this._referenced_individuals = indivs;
    }
    return this._referenced_individuals;
}

/**
 * Add referenced individual.
 *
 * Also, changes type to "referenced" from (probably) node.
 *
 * @name add_referenced_individual
 * @function
 * @param {annotation} indiv - individual to add
 * @returns {Array} list of all individuals
 */
function _add_referenced_individual(indiv){
    if( ! us.isArray(indiv) ){	
	indiv.type('referenced');
	this._referenced_individuals.push(indiv);
    }
    return this._referenced_individuals;
}

/**
 * Get a sublist of referenced individuals using the filter
 * function. The filter function take a single individual as an
 * argument, and adds to the return list if it evaluates to true.
 *
 * @name get_referenced_individuals_by_filter
 * @function
 * @param {Function} filter - function described above
 * @returns {Array} list of passing individuals
 */
function _get_referenced_individuals_by_filter(filter){
    var anchor = this;

    var ret = [];
    each(anchor._referenced_individuals, function(ind){
	var res = filter(ind);
	if( res && res == true ){
	    ret.push(ind);
	}
    });

    return ret;
}

/**
 * Get sublist of referenced_individuals with a certain ID.
 *
 * @name get_referenced_individual_by_id
 * @function
 * @param {String} iid - referenced_individual ID to look for
 * @returns {Array} list of referenced_individuals with that ID
 */
function _get_referenced_individual_by_id(iid){
    var anchor = this;

    var ret = null;
    each(anchor._referenced_individuals, function(ind){
	if( ind.id() == iid ){
	    ret = ind;
	}
    });

    return ret;
}

/**
 * Returns a list with the following structure:
 *
 * : [ { id: <ID>,
 * :     class_expressions: [{class_expression}, ...],
 * :     anntations: [{annotation}, ...] },
 * :   ...
 * : ]
 *
 * Each top-level element in the list represents the core information
 * of a single referenced individual for a node or edge in this model.
 *
 * Keep in mind that this may be most useful in the GO Noctua use case
 * where evidence is uniformly modeled as (a) referenced
 * individual(s), where the class(es) are evidence and the annotations
 * keep things such as source (e.g. PMID), etc.
 *
 * @name get_referenced_individual_profiles
 * @function
 * @returns {Array} list of referenced_individual information.
 */
function _get_referenced_individual_profiles(){
    var anchor = this;

    var ret = [];
    each(anchor.referenced_individuals(), function(ind){

	// Base.
	var prof = {
	    id: null,
	    class_expressions: [],
	    annotations: []
	};

	// Referenced instance ID.
	prof.id = ind.id();

	// Collect class expressions and annotations.
	each(ind.types(), function(ce){
	    prof.class_expressions.push(ce);
	});
	each(ind.annotations(), function(ann){
	    prof.annotations.push(ann);
	});

	//
	ret.push(prof);
    });

    return ret;
}

/**
 * Returns a list with the following structure:
 *
 * : [ { id: <ID>,
 * :     cls: <ID>,
 * :     source: <STRING>,
 * :     date: <STRING>,
 * :     etc
 * :   },
 * :   ...
 * : ]
 *
 * Each top-level element in the list represents the core information
 * in a simple (GO-style) element. This is essentially a distilled
 * version of get_referenced_individual_profiles for cases where that
 * is modelling simple piece of evidence (single non-nested class
 * expression and a set know list of annotations).
 *
 * @name get_basic_evidence
 * @function
 * @param {Array} annotation_ids - list of strings that identify the annotation keys that will be captured--
 * @returns {Array} list of referenced_individual simple evidence information.
 */
function _get_basic_evidence(annotation_ids){
    var anchor = this;

    var ret = [];

    // Get hash of the annotation keys present.
    var test = us.object(us.map(annotation_ids,
				function(e){ return [e, true]}));

    each(anchor.get_referenced_individual_profiles(), function(cmplx_prof){
	//console.log(cmplx_prof);

	// Only add conformant referenced individuals.
	if( cmplx_prof.id && ! us.isEmpty(cmplx_prof.class_expressions) ){

	    // Base.
	    //console.log(cmplx_prof.class_expressions);
	    var basic_prof = {
		id: cmplx_prof.id,
		cls: cmplx_prof.class_expressions[0].to_string()
	    };
	    
	    // Match and clobber.
	    each(cmplx_prof.annotations, function(ann){
		//console.log(ann);
		if( test[ann.key()] ){
		    basic_prof[ann.key()] = ann.value();
		}
	    });

	    //console.log(basic_prof);
	    ret.push(basic_prof);
	}
	
    });

    return ret;
}

///
/// Next, get some subclasses working for the core triumvirate: graph,
/// node, edge. Start with graph.
///

var bbop_graph = bbop_model.graph;

/**
 * Sublcass of bbop-graph for use with Noctua ideas and concepts.
 *
 * @constructor
 * @see module:bbop-graph
 * @alias graph
 * @param {String} [new_id] - new id; otherwise new unique generated
 * @returns {this}
 */
function noctua_graph(new_id){
    bbop_graph.call(this);
    this._is_a = 'bbop-graph-noctua.graph';

    // Deal with id.
    if( new_id ){ bbop_graph.id(new_id); }

    // The old edit core.
    this.core = {
	'edges': {}, // map of id to edit_edge - edges not completely anonymous
	'node_order': [], // initial table order on redraws
	'node2elt': {}, // map of id to physical object id
	'elt2node': {},  // map of physical object id to id
	// Remeber that edge ids and elts ids are the same, so no map
	// is needed.
	'edge2connector': {}, // map of edge id to virtual connector id
	'connector2edge': {}  // map of virtual connector id to edge id 
    };

    this._annotations = [];
    //this._referenced_individuals = []; // not for graph yet, or maybe ever
};
bbop.extend(noctua_graph, bbop_graph);

/**
 * Create an edge for use in internal operations.
 *
 * @param {string} subject - node id string or node
 * @param {string} object - node id string or node
 * @param {string} [predicate] - a user-friendly description of the node
 * @returns {edge} bbop model edge
 */
noctua_graph.prototype.create_edge = function(subject, object, predicate){
    return new noctua_edge(subject, object, predicate);
};

/**
 * Create a node for use in internal operations.
 *
 * @param {string} id - a unique id for the node
 * @param {string} [label] - a user-friendly description of the node
 * @param {Array} [types] - list of types to pre-load
 * @param {Array} [inferred_types] - list of inferred types to pre-load
 * @returns {node} new bbop model node
 */
noctua_graph.prototype.create_node = function(id, label, types, inferred_types){
    return new noctua_node(id, label, types, inferred_types);
};

/**
 * Create a clone of the graph.
 *
 * @returns {graph} bbop model graph
 */
noctua_graph.prototype.clone = function(){
    var anchor = this;

    var new_graph = anchor.create_graph();

    // Collect the nodes and edges.
    each(anchor.all_nodes(), function(node){
	new_graph.add_node(node.clone());
    });
    each(anchor.all_edges(), function(edge){
	new_graph.add_edge(edge.clone());
    });

    // Collect other information.
    new_graph.default_predicate = anchor.default_predicate;
    new_graph._id = anchor._id;

    // Copy new things: annotations.
    each(anchor._annotations, function(annotation){
	new_graph._annotations.push(annotation.clone());
    });
    
    return new_graph;
};

/**
 * Create a graph for use in internal operations.
 *
 * @returns {graph} bbop model graph
 */
noctua_graph.prototype.create_graph = function(){
    return new noctua_graph();
};

/**
 * Add an ID to the graph.
 *
 * Use .id() instead.
 *
 * @deprecated
 * @see module:bbop-graph#id
 * @param {String} id - string
 * @returns {String} string
 */
noctua_graph.prototype.add_id = function(id){
    return this.id(id);
};

/**
 * Get the ID from the graph.
 *
 * Use .id() instead.
 *
 * @deprecated
 * @see module:bbop-graph#id
 * @returns {String} string
 */
noctua_graph.prototype.get_id = function(){
    return this.id();
};

/**
 * Get the ID from the graph.
 *
 * @param {node} enode - noctua node
 * @returns {Boolean} true on new node
 */
noctua_graph.prototype.add_node = function(enode){
    // Super call: add it to the general graph.
    bbop_graph.prototype.add_node.call(this, enode);

    var ret = false;
    
    // Add/update node.
    var enid = enode.id();
    //this.core['nodes'][enid] = enode; // add to nodes

    // Only create a new elt ID and order if one isn't already in
    // there (or reuse things to keep GUI working smoothly).
    var elt_id = this.core['node2elt'][enid];
    if( ! elt_id ){ // first time
	this.core['node_order'].unshift(enid); // add to default order
	elt_id = bbop.uuid(); // generate the elt id we'll use from now on
	this.core['node2elt'][enid] = elt_id; // map it
	this.core['elt2node'][elt_id] = enid; // map it	
	ret = true;
    }

    return ret;
};

/**
 * Add a node into the graph modeled from the the JSON-LD lite model.
 * Creates or adds types and annotations as necessary.
 *
 * @param {Object} indv - hash rep of graph individual from Minerva response?
 * @returns {node|null} 
 */
noctua_graph.prototype.add_node_from_individual = function(indv){
    var anchor = this;

    var new_node = null;

    // Add individual to edit core if properly structured.
    var iid = indv['id'];
    if( iid ){
	//var nn = new bbop.model.node(indv['id']);
	//var meta = {};
	//ll('indv');
	
	// See if there is type info that we want to add.
	// Create the node.
	var itypes = indv['type'] || [];
	var inf_itypes = indv['inferred-type'] || [];
	new_node = anchor.create_node(iid, null, itypes, inf_itypes);

	// See if there is type info that we want to add.
	var ianns = indv['annotations'] || [];
	if( us.isArray(ianns) ){
	    // Add the annotations individually.
	    each(ianns, function(ann_kv_set){
		var na = new annotation(ann_kv_set);
		new_node.add_annotation(na);
	    });
	}
	
	anchor.add_node(new_node);
    }
    
    return new_node;
};

/**
 * Return the "table" order of the nodes.
 *
 * @returns {Array} node order by id?
 */
noctua_graph.prototype.edit_node_order = function(){
    return this.core['node_order'] || [];
};

/**
 * Return a node's element id.
 *
 * @returns {String|null} node element id
 */
noctua_graph.prototype.get_node_elt_id = function(enid){
    return this.core['node2elt'][enid] || null;
};

/**
 * Return a copy of a {node} by its element id.
 *
 * @returns {node|null} node
 */
noctua_graph.prototype.get_node_by_elt_id = function(elt_id){
    var ret = null;
    var enid = this.core['elt2node'][elt_id] || null;
    if( enid ){
	ret = this.get_node(enid) || null;
    }
    return ret;
};

/**
 * Return a copy of a {node} by its corresponding Minerva JSON rep
 * individual.
 *
 * @returns {node|null} node
 */
noctua_graph.prototype.get_node_by_individual = function(indv){
    var anchor = this;

    var ret = null;

    // Get node from graph if individual rep is properly structured.
    var iid = indv['id'];
    if( iid ){	
	ret = this.get_node(iid) || null;
    }
    
    return ret;
};

/**
 * Return a hash of node ids to nodes.
 * Real, not a copy.
 *
 * @see module:bbop-graph#all_nodes
 * @returns {Object} node ids to nodes
 */
noctua_graph.prototype.get_nodes = function(){
    return this._nodes || {};
};

/**
 * Remove a node from the graph.
 *
 * @param {String} node_id - the id for a node
 * @param {Boolean} [clean_p] - remove all edges connects to node (default false)
 * @returns {Boolean} true if node found and destroyed
 */
noctua_graph.prototype.remove_node = function(node_id, clean_p){
    var anchor = this;

    var ret = false;
    var enode = anchor.get_node(node_id);
    if( enode ){
	ret = true;

	///
	/// First, remove all subclass decorations.
	///

	// Also remove the node from the order list.
	// TODO: Is this a dumb scan?
	var ni = this.core['node_order'].indexOf(node_id);
	if( ni != -1 ){
	    this.core['node_order'].splice(ni, 1);
	}

	// Clean the maps.
	var elt_id = this.core['node2elt'][node_id];
	delete this.core['node2elt'][node_id];
	delete this.core['elt2node'][elt_id];

	///
	/// We want to maintain superclass compatibility.
	/// 

	// Finally, remove the node itself.
	bbop_graph.prototype.remove_node.call(this, node_id, clean_p);
    }

    return ret;
};

/**
 * Add an edge to the graph. Remember that edges are no anonymous
 * edges here.
 *
 * @param {edge} eedge - a bbop-graph-noctua#edge
 */
noctua_graph.prototype.add_edge = function(eedge){

    // Super.
    bbop_graph.prototype.add_edge.call(this, eedge);

    // Sub.
   var eeid = eedge.id();
   if( ! eeid ){ throw new Error('edge not of bbop-graph-noctua'); }
   this.core['edges'][eeid] = eedge;
};

/**
 * Add an edge to the graph using a "fact" as the seed.
 * Creates and adds annotations as necessary.
 *
 * @param {} fact - JSON structure representing a fact
 * @returns {edge} newly created edge
 */
noctua_graph.prototype.add_edge_from_fact = function(fact){
    var anchor = this;

    var new_edge = null;
    
    // Add individual to edit core if properly structured.
    var sid = fact['subject'];
    var oid = fact['object'];
    var pid = fact['property'];
    var anns = fact['annotations'] || [];
    if( sid && oid && pid ){

	new_edge = anchor.create_edge(sid, oid, pid);
	if( ! us.isArray(anns) ){
	    throw new Error('annotations is wrong');
	}else{
	    // Add the annotations individually.
	    each(anns, function(ann_kv_set){
		var na = new annotation(ann_kv_set);
		new_edge.add_annotation(na);
	    });
	}

	// Add and ready to return edge.
	anchor.add_edge(new_edge);
    }
    
    return new_edge;
};

/**
 * Return an edge by is ID.
 *
 * @param {String} edge_id - the ID of the {edge}
 * @returns {edge|null} - the {edge}
 */
noctua_graph.prototype.get_edge_by_id = function(edge_id){
    var ret = null;
    var ep = this.core['edges'][edge_id];
    if( ep ){ ret = ep; }
    return ret;
};

/**
 * Return an edge ID by it's associated connector ID if extant.
 *
 * @param {String} cid - the ID of the connector.
 * @returns {String} - the ID of the associated edge
 */
noctua_graph.prototype.get_edge_id_by_connector_id = function(cid){
    return this.core['connector2edge'][cid] || null;
};

/**
 * Return a connector by it's associated edge ID if extant.
 *
 * @param {String} eid - the ID of the edge
 * @returns {String} - the connector ID
 */
noctua_graph.prototype.get_connector_id_by_edge_id = function(eid){
    return this.core['edge2connector'][eid] || null;
};

/**
 * Remove an edge to the graph.
 * The edge as referenced.
 *
 * @param {String} subject_id - subject by ID
 * @param {String} object_id - object by ID
 * @param {String} [predicate_id] - predicate ID or default
 * @returns {Boolean} true if such an edge was found and deleted, false otherwise
 */
// noctua_graph.prototype.remove_edge = function(subject_id, object_id, predicate_id){
//     var ret = false;

//     var eedge = this.get_edge(subject_id, object_id, predicate_id);
//     if( eedge ){
// 	ret = this.remove_edge_by_id(eedge.id());
//     }

//     return ret;
// };

/**
 * Remove an edge to the graph.
 * The edge as IDed.
 *
 * @param {String} edge_id - edge by ID
 * @returns {Boolean} true if such an edge was found and deleted, false otherwise
 */
noctua_graph.prototype.remove_edge_by_id = function(eeid){
    var ret = false;

    if( this.core['edges'][eeid] ){

	// Summon up the edge to properly remove it from the model.
	var eedge = this.core['edges'][eeid];

	// Remove the node itself from super.
	ret = bbop_graph.prototype.remove_edge.call(this,
						    eedge.subject_id(),
						    eedge.object_id(),
						    eedge.predicate_id());
	
	// Main bit out.
	delete this.core['edges'][eeid];

	// And clean the maps.
	var cid = this.core['edge2connector'][eeid];
	delete this.core['edge2connector'][eeid];
	delete this.core['connector2edge'][cid];
    }

    return ret;
};

/**
 * Internally connect an edge to a connector ID
 *
 * TODO/BUG: Should use generic ID mapping rather than depending on
 * jsPlumb thingamajunk.
 *
 * @deprecated
 * @param {edge} eedge - edge
 * @param {connector} connector - jsPlumb connector
 */
noctua_graph.prototype.create_edge_mapping = function(eedge, connector){
    var eid = eedge.id();
    var cid = connector.id;
    this.core['edge2connector'][eid] = cid;
    this.core['connector2edge'][cid] = eid;
};

/**
 * Debugging text output function.
 *
 * Not sure what this is for anymore honestly...
 *
 * @deprecated
 * @returns {String} a graph rep as a string
 */
noctua_graph.prototype.dump = function(){

    //
    var dcache = [];
    
    each(this.get_nodes(), function(node, node_id){	
	var ncache = ['node'];
	ncache.push(node.id());
	dcache.push(ncache.join("\t"));
    });
    
    each(this.core['edges'], function(edge, edge_id){
	var ecache = ['edge'];
	ecache.push(edge.subject_id());
	ecache.push(edge.predicate_id());
	ecache.push(edge.object_id());
	dcache.push(ecache.join("\t"));
    });
    
    return dcache.join("\n");
};

/**
 * Merge another graph (addition) into the current graph. Includes the
 * copying of annotations for the graph. This is an /additive/
 * operation (e.g. annotations and other non-unique entities
 * accumulate). Graph ID is /not/ copied.
 *
 * @param {graph} in_graph - the graph to merge in
 * @returns {Boolean} if graph was loaded 
 */
noctua_graph.prototype.merge_in = function(in_graph){
    var anchor = this;

    var ret = bbop_graph.prototype.merge_in.call(anchor, in_graph);

    // Function to check if two annotations are the same.
    function _is_same_ann(a1, a2){
    	var ret = false;
    	if( a1.key() == a2.key() &&
    	    a1.value() == a2.value() &&
    	    a1.value_type() == a2.value_type() ){
    	    ret = true;
    	}
    	return ret;
    }

    // Merge in graph annotations.
    var in_graph_anns = in_graph.annotations();
    each(in_graph_anns, function(ann){
    	// If there are no annotations that have the same KVT triple,
    	// add a clone.
    	if( anchor.get_annotations_by_filter( function(a){ return _is_same_ann(ann, a); } ).length == 0 ){
    	    anchor.add_annotation(ann.clone());
    	}
    });

    return ret;
};

/**
 * This uses a subgraph to update the contents of the current
 * graph. The update graph is considered to be an updated complete
 * self-contained subsection of the graph, clobbering nodes, edges,
 * and the graph annotations. In the case of edges, all edges for the
 * incoming nodes are deleted, and the ones described in the incoming
 * graph are added (again, update).
 *
 * For example: you can think of it like this: if we have a graph:
 *  A, B, C, and A.1, where A, B, and C are nodes and A.1 is an annotation for A.
 * And we have an argument subgraph:
 *  A, B, and edge (A,B), and A.2, B.1.
 * The final graph would be:
 *  A, B, C and edge (A,B), and A.2, B.1.
 *
 * Essentially, any entity in the new graph clobbers the "old"
 * version; nodes not mentioned are left alone, the subgraph edges are
 * assumed to be complete with reference to the contained nodes. This
 * can express removal of things like annotations and sometimes edges,
 * but not of nodes and edges not contained in within the subgraph.
 *
 * See the unit tests for examples.
 *
 * Be careful of what happens when using with the various loaders as
 * the contents of top-level entities can be very different--you
 * probably want to apply the right loader first.
 *
 * @param {graph} in_graph - the graph to update with
 * @returns {Boolean} if graph was loaded 
 */
noctua_graph.prototype.update_with = function(update_graph){
    var anchor = this;

    // Prefer the new graph annotations by nuking the old.
    anchor._annotations = [];
    var update_graph_anns = update_graph.annotations();
    each(update_graph_anns, function(ann){
    	anchor.add_annotation(ann.clone());
    });

    // Next, look at individuals/nodes for addition or updating.
    var updatable_nodes = {};
    each(update_graph.all_nodes(), function(ind){
	// Update node by clobbering. This is preferred since deleting
	// it would mean that all the connections would have to be
	// reconstructed as well.
	var update_node = anchor.get_node(ind.id());
	if( update_node ){
	    //console.log('update node: ' + ind.id());
	}else{
	    //console.log('add new node' + ind.id());	    
	}
	// Mark as a modified node.
	updatable_nodes[ind.id()] = true;
	// Add new node to edit core.
	anchor.add_node(ind.clone());	    
    });
    
    // Now look at edges (by individual) for purging and
    // reinstating--no going to try and update edges, just clobber.
    each(update_graph.all_nodes(), function(source_node){
    	//console.log('looking at node: ' + source_node.id());
	
    	// Look up what edges it has in /core/, as they will be the
    	// ones to update.
    	var snid = source_node.id();
    	var src_edges = anchor.get_edges_by_subject(snid);
	
    	// Delete all edges for said node in model. We cannot
    	// (apparently?) go from connection ID to connection easily,
    	// so removing from UI is a separate step.
    	each(src_edges, function(src_edge){
    	    // Remove from model.
    	    var removed_p = anchor.remove_edge_by_id(src_edge.id());
    	    //console.log('remove edge (' + removed_p + '): ' + src_edge.id());
    	});
    });

    // All edges should have IDs, so get them out of the graph if they
    // are incoming.
    each(update_graph.all_edges(), function(edge){
	var in_id = edge.id();
	anchor.remove_edge_by_id(in_id);
	anchor.add_edge(edge.clone());
    });
    
    return true;
};

/**
 * Load minerva data response.
 *
 * TODO: inferred individuals
 *
 * @param {Object} the "data" portion of a Minerva graph-related response.
 * @returns {Boolean} if data was loaded 
 */
noctua_graph.prototype.load_data_base = function(data){
    var anchor = this;

    var ret = false;

    if( data ){
	
	// Add the graph metadata.
	var graph_id = data['id'] || null;
	var graph_anns = data['annotations'] || [];
	if( graph_id ){ anchor.id(graph_id); }
	if( ! us.isEmpty(graph_anns) ){
	    each(graph_anns, function(ann_kv_set){
		var na = new annotation(ann_kv_set);
		anchor.add_annotation(na);
	    });
	}
	
	// Easy facts.
	var facts = data['facts'];
	each(facts, function(fact){
	    anchor.add_edge_from_fact(fact);
	});

	// Build the structure of the graph in the most obvious way.
	var inds = data['individuals'];
	each(inds, function(ind){
	    anchor.add_node_from_individual(ind);
	});

	ret = true;
    }	

    return ret;
};

/**
 * Load minerva data response. However, this time, we're going to fold
 * the evidence individuals into the edges and nodes that reference
 * them under the referenced_individual functions.
 *
 * Currently, a single pass is run to fold evidence individuals into
 * other nodes as referenced individuals. However, additional passes
 * can very easily be added to fold away references to references as
 * long as a matching function is provided.
 *
 * @param {Object} the "data" portion of a Minerva graph-related response.
 * @returns {Boolean} if data was loaded 
 */
noctua_graph.prototype.load_data_fold_evidence = function(data){
    var anchor = this;

    var ret = false;

    if( data ){
	
	// Load the graph parts as usual.
	var graph_id = data['id'] || null;
	var graph_anns = data['annotations'] || [];
	if( graph_id ){ anchor.id(graph_id); }
	if( ! us.isEmpty(graph_anns) ){
	    each(graph_anns, function(ann_kv_set){
		var na = new annotation(ann_kv_set);
		anchor.add_annotation(na);
	    });
	}

	// Currently, evidence does not have edges, and if they did,
	// we wouldn't want to handle them here. All edges in.
	var facts = data['facts'];
	each(facts, function(fact){
	    anchor.add_edge_from_fact(fact);
	});

	// Start by adding all of the individuals to the graph.
	var inds = data['individuals'];
	each(inds, function(ind){
	    anchor.add_node_from_individual(ind);
	});

	// Find the evidence singletons for future lookup.
	var singletons = {};
	each(anchor.get_singleton_nodes(), function(singleton){
	    var sid = singleton.id();
	    singletons[sid] = singleton;
	});

	//console.log('singletons');
	//console.log(us.keys(singletons).length);

	// Take and, and see if it is an evidence reference.
	function is_iri_ev_p(ann){
	    var ret = false;
	    if( ann.key() == 'evidence' && ann.value_type() == 'IRI' ){
		ret = true;
	    }
	    return ret;
	}

	// For any node, look at all of the annotations, and fold in
	// ones that 1) pass the test and 2) reference a singleton
	// node.
	function fold_in_reference(node, test_p){
	    each(node.annotations(), function(ann){

		//console.log(ann.key(), ann.value_type(), ann.value());
		
		// Is it an evidence annotation.
		//if( ann.key() == 'evidence' && ann.value_type() == 'IRI' ){
		if( test_p(ann) ){
		    // If so, and the individual in question is a
		    // singleton (if not, we don't fold it).
		    var ref_node_id = ann.value();
		    if( singletons[ref_node_id] ){
			
			// Remove node from the graph.
			anchor.remove_node(ref_node_id);

			// Add as referenced individual.
			var ev_indiv = singletons[ref_node_id];
			var c1 = node.add_referenced_individual(ev_indiv);
			//console.log('<<' + node.id() + '>1>', c1.length);
			//var c2 = node.referenced_individuals();
			//console.log('<<' + node.id() + '>2>', c2.length);
			//			console.log(node)
		    }
		}
	    });
	}

	// Add the evidence singletons into the structure by
	// scanning through the nodes and adding them as referenced
	// individuals.
	each(anchor.all_nodes(), function(node){
	    fold_in_reference(node, is_iri_ev_p);
	});

	// We also need to do the same thing with the edges, adding
	// back in the evidence as referenced individuals.
	each(anchor.all_edges(), function(edge){
	    fold_in_reference(edge, is_iri_ev_p);
	});

	ret = true;
    }	

    //    console.log(anchor);

    return ret;
};

/**
 * Load minerva data response. However, this time, in addition to
 * everything we did for {load_data_evidence_fold}, we're going to
 * search for nodes that have enabled_by and/or occurs_in targets
 * (that are themselves leaves) fold them in to the contained subgraph
 * item, and remove them from the top-level graph.
 *
 * TODO: inferred individuals
 *
 * @param {Object} the "data" portion of a Minerva graph-related response.
 * @param {Array} list of relations (as strings) to scan for for collapsing
 * @returns {Boolean} if data was loaded 
 */
noctua_graph.prototype.load_data_go_noctua = function(data, relation_list){
    var anchor = this;

    // Start out with the evidence folded graph.
    var ret = anchor.load_data_fold_evidence(data);
    if( ! ret ){ return false; } // Early bail on bad upstream.
    
    // It is foldable if it is a root node (re: opposite of leaf--only
    // target) and if it only has the one child (no way out--re: collapsible ).
    function _foldable_p(node){
	var ret = false;
	if( anchor.is_root_node(node.id()) &&
	    anchor.get_child_nodes(node.id()).length == 1 ){
		//console.log("foldable: " + node.id());
		ret = true;
	    }
	return ret;
    }

    // Okay, first scan all nodes for our pattern.
    each(anchor.all_nodes(), function(ind){

	// The possible base subgraph (seeding with current node--note
	// the clone so we don't have infinite recursion) we might
	// capture.
	var subgraph = anchor.create_graph();
	subgraph.add_node(ind.clone());

	// Check a set of relations for completeness: enabled_by and
	// occurs_in (location).
	//var collapsable_relations = ['RO:0002333', 'BFO:0000066'];
	var collapsable_relations = relation_list || [];
	each(collapsable_relations, function(relation){
	    
	    var kids = anchor.get_parent_nodes(ind.id(), relation);
	    each(kids, function(kid){
		if( _foldable_p(kid) ){

		    // Preserve it and its edge in the new subgraph.
		    subgraph.add_node(kid.clone());
		    subgraph.add_edge(
			anchor.get_parent_edges(ind.id(), relation)[0].clone());

		    // Remove same from the original graph, edge will be
		    // destroyed in the halo.
		    anchor.remove_node(kid.id(), true);
		}
	    });
	});

	// A usable folding subgraph only occurred when the are more
	// than 1 node in it; i.e. we actually actually added things
	// to our local subgraph and removed them from the master
	// graph.
	if( subgraph.all_nodes().length > 1 ){
	    //console.log('slurpable subgraph for: ' + ind.id());
	    ind.subgraph(subgraph);
	}

    });

    return ret;
};

///
/// Node subclass and overrides.
///

var bbop_node = bbop_model.node;
/**
 * Sublcass of bbop-graph.node for use with Noctua ideas and concepts.
 *
 * @constructor
 * @see module:bbop-graph
 * @alias node
 * @param {String} [in_id] - new id; otherwise new unique generated
 * @param {String} [in_label] - node "label"
 * @param {Array} [in_types] - list of Objects or strings--anything that can be parsed by class_expression
 * @param {Array} [in_inferred_types] - list of Objects or strings--anything that can be parsed by class_expression
 * @returns {this}
 */
function noctua_node(in_id, in_label, in_types, in_inferred_types){
    bbop_node.call(this, in_id, in_label);
    this._is_a = 'bbop-graph-noctua.node';
    var anchor = this;

    // Let's make this an OWL-like world.
    this._types = [];
    this._inferred_types = [];
    this._id2type = {}; // contains map to both types and inferred types
    this._annotations = [];
    this._referenced_individuals = [];
    this._embedded_subgraph = null;

    // Incoming ID or generate ourselves.
    if( typeof(in_id) === 'undefined' ){
	this._id = bbop.uuid();
    }else{
	this._id = in_id;
    }

    // Roll in any types that we may have coming in.
    if( us.isArray(in_types) ){
	each(in_types, function(in_type){
	    var new_type = new class_expression(in_type);
	    anchor._id2type[new_type.id()] = new_type;
	    anchor._types.push(new class_expression(in_type));
	});
    }    
    // Same with inferred types.
    if( us.isArray(in_inferred_types) ){
	each(in_inferred_types, function(in_inferred_type){
	    var new_type = new class_expression(in_inferred_type);
	    anchor._id2type[new_type.id()] = new_type;
	    anchor._inferred_types.push(new class_expression(in_inferred_type));
	});
    }
    
    // Optional layout hints.
    this._x_init = null; // initial layout hint
    this._y_init = null;
    // this.xlast = null; // last known location
    // this.ylast = null;
};
bbop.extend(noctua_node, bbop_node);

/**
 * Get a fresh new copy of the current node (using bbop.clone for
 * metadata object).
 *
 * @returns {node} node
 */
noctua_node.prototype.clone = function(){
    var anchor = this;

    // Fresh.
    var new_clone = new noctua_node(anchor.id(), anchor.label(),
				    anchor.types(), anchor.inferred_types());

    // Base class stuff.
    new_clone.type(this.type());
    new_clone.metadata(bbop.clone(this.metadata()));

    // Transfer over the new goodies, starting with annotations and
    // referenced individuals.
    each(anchor._annotations, function(annotation){
	new_clone._annotations.push(annotation.clone());
    });
    each(anchor._referenced_individuals, function(ind){
	new_clone._referenced_individuals.push(ind.clone());
    });

    // Embedded subgraph.
    if( anchor._embedded_subgraph ){
	new_clone._embedded_subgraph = anchor._embedded_subgraph.clone();
    }else{
	new_clone._embedded_subgraph = null;
    }

    // Coordinates.
    new_clone._x_init = anchor._x_init;
    new_clone._y_init = anchor._y_init;

    return new_clone;
};

/**
 * Get current types; replace current types.
 * 
 * Parameters:
 * @param {Array} [in_types] - raw JSON type objects
 * @returns {Array} array of types
 */
noctua_node.prototype.types = function(in_types){
    var anchor = this;    

    if( us.isArray(in_types) ){

	// Wipe previous type set.
	each(anchor._types, function(t){
	    delete anchor._id2type[t.id()];
	});
	anchor._types = [];

	// Serially add new ondes.
	each(in_types, function(in_type){
	    var new_type = new class_expression(in_type);
	    anchor._id2type[new_type.id()] = new_type;
	    anchor._types.push(new_type);
	});
    }

    return this._types;
};

/**
 * Get current inferred types; replace current inferred types.
 * 
 * Parameters:
 * @param {Array} [in_types] - raw JSON type objects
 * @returns {Array} array of types
 */
noctua_node.prototype.inferred_types = function(in_types){
    var anchor = this;    

    if( us.isArray(in_types) ){

	// Wipe previous type set.
	each(anchor._inferred_types, function(t){
	    delete anchor._id2type[t.id()];
	});
	anchor._inferred_types = [];

	// Serially add new ondes.
	each(in_types, function(in_type){
	    var new_type = new class_expression(in_type);
	    anchor._id2type[new_type.id()] = new_type;
	    anchor._inferred_types.push(new_type);
	});
    }

    return this._inferred_types;
};

/**
 * Add types to current types.
 * 
 * Parameters:
 * @param {Object} in_types - raw JSON type objects
 * @param {Boolean} inferred_p - whether or not the argument types are inferred
 * @returns {Boolean} t|f
 */
noctua_node.prototype.add_types = function(in_types, inferred_p){
    var anchor = this;    
    var inf_p = inferred_p || false;

    var ret = false;

    if( us.isArray(in_types) ){
	each(in_types, function(in_type){
	    var new_type = new class_expression(in_type);
	    anchor._id2type[new_type.id()] = new_type;
	    if( ! inferred_p ){
		anchor._types.push(new_type);
	    }else{
		anchor._inferred_types.push(new_type);
	    }
	    
	    ret = true; // return true if did something
	});
    }
    return ret;
};

/**
 * If extant, get the type by its unique identifier. This works for
 * both inferred and non-inferred types generally.
 * 
 * @param {String} type_id - type id
 * @returns {type|null} type or null
 */
noctua_node.prototype.get_type_by_id = function(type_id){
    var anchor = this;

    var ret = null;
    ret = anchor._id2type[type_id];

    return ret;
};

/**
 * Essentially, get all of the "uneditable" inferred types from the
 * reasoner that are not duplicated in the regular (editable) types
 * listing.
 * 
 * Returns originals.
 * 
 * Note: the matching here is awful and should be redone (going by
 * very lossy string rep).
 * 
 * @returns {Array} of {class_expression}
 */
noctua_node.prototype.get_unique_inferred_types = function(){
    var anchor = this;

    var ret = [];

    // Create a checkable representation of the types.
    var type_cache = {};
    each(anchor.types(), function(t){
	type_cache[t.signature()] = true;
    });

    // Do a lookup.
    each(anchor.inferred_types(), function(t){
	if( ! type_cache[t.signature()] ){
	    ret.push(t);
	}
    });

    return ret;
};

/**
 * Get/set the "contained" subgraph. This subgraph is still considered
 * to be part of the graph, but is "hidden" under this node for most
 * use cases except serialization.
 * 
 * To put it another way, unless you specifically load this with a
 * specialized loader, it will remain unpopulated. During
 * serialization, it should be recursively walked and dumped.
 * 
 * @param {graph} [subgraph] - the subgraph to "hide" inside this individual in the graph
 * @returns {graph|null} contained subgraph
 */
noctua_node.prototype.subgraph = function(subgraph){
    if( subgraph && bbop.what_is(subgraph) == 'bbop-graph-noctua.graph'){
	this._embedded_subgraph = subgraph;
    }
    return this._embedded_subgraph;
};

/**
 * Get/set "x" value of node.
 * 
 * @param {Number} value - number
 * @returns {Number|null} type or null
 */
noctua_node.prototype.x_init = function(value){
    if(value) this._x_init = value;
    return this._x_init;
};

/**
 * Get/set "y" value of node.
 * 
 * @param {Number} value - number
 * @returns {Number|null} type or null
 */
noctua_node.prototype.y_init = function(value){
    if(value) this._y_init = value;
    return this._y_init;
};

///
/// Edge subclass and overrides.
///

var bbop_edge = bbop_model.edge;
/**
 * Sublcass of bbop-graph.edge for use with Noctua ideas and concepts.
 *
 * @constructor
 * @see module:bbop-graph
 * @alias edge
 * @param {String} subject - required subject id
 * @param {String} object - required object id
 * @param {String} [predicate] - preidcate id; if not provided, will use defined default (you probably want to provide one--explicit is better)
 * @returns {this}
 */
function noctua_edge(subject, object, predicate){
    bbop_edge.call(this, subject, object, predicate);
    this._is_a = 'bbop-graph-noctua.edge';

    // Edges are not completely anonymous in this world.
    this._id = bbop.uuid();

    this._annotations = [];
    this._referenced_individuals = [];
};
bbop.extend(noctua_edge, bbop_edge);

/**
 * Get a fresh new copy of the current edge--no shared structure.
 *
 * @returns {edge} - new copy of edge
 */
noctua_edge.prototype.clone = function(){
    var anchor = this;

    // Fresh.
    var new_clone = new noctua_edge(anchor.subject_id(),
				    anchor.object_id(),
				    anchor.predicate_id());

    // Same id.
    new_clone._id = anchor._id;
    
    // Base class stuff.
    new_clone.default_predicate = anchor.default_predicate;
    new_clone.type(anchor.type());
    new_clone.metadata(bbop.clone(anchor.metadata()));

    // Transfer over the new goodies.
    each(anchor._annotations, function(annotation){
	new_clone._annotations.push(annotation.clone());
    });
    each(anchor._referenced_individuals, function(ind){
	new_clone._referenced_individuals.push(ind.clone());
    });

    return new_clone;
};

/**
 * Access to the "id".
 * 
 * @returns {String} string
 */
noctua_edge.prototype.id = function(){
    return this._id;
 };

/**
 * Get/set "source" of edge.
 * 
 * @deprecated
 * @param {String} [value] - string
 * @returns {String} string
 */
noctua_edge.prototype.source = function(value){
    if(value) this._subject_id = value;
    return this._subject_id;
};

/**
 * Get/set "target" of edge.
 * 
 * @deprecated
 * @param {String} [value] - string
 * @returns {String} string
 */
noctua_edge.prototype.target = function(value){
    if(value) this._object_id = value;
    return this._object_id;
};

/**
 * Get/set "relation" of edge.
 * 
 * @deprecated
 * @param {String} [value] - string
 * @returns {String} string
 */
noctua_edge.prototype.relation = function(value){
    if(value) this._predicate_id = value;
    return this._predicate_id;
};

// Add generic bulk annotation operations to: graph, edge, and node.
each([noctua_graph, noctua_node, noctua_edge], function(constructr){
    constructr.prototype.annotations = _annotations;
    constructr.prototype.add_annotation = _add_annotation;
    constructr.prototype.get_annotations_by_filter = _get_annotations_by_filter;
    constructr.prototype.get_annotations_by_key = _get_annotations_by_key;
    constructr.prototype.get_annotation_by_id = _get_annotation_by_id;
});

// Add generic evidence (referenced individuals) operations to: edge
// and node.
each([noctua_node, noctua_edge], function(constructr){
    constructr.prototype.referenced_individuals =
	_referenced_individuals;
    constructr.prototype.add_referenced_individual =
	_add_referenced_individual;
    constructr.prototype.get_referenced_individuals_by_filter =
	_get_referenced_individuals_by_filter;
    constructr.prototype.get_referenced_individual_by_id =
	_get_referenced_individual_by_id;
    constructr.prototype.get_referenced_individual_profiles
	= _get_referenced_individual_profiles;
    constructr.prototype.get_basic_evidence
	= _get_basic_evidence;
});

///
/// Exportable body.
///

module.exports = {

    annotation: annotation,
    node: noctua_node,
    edge: noctua_edge,
    graph: noctua_graph

};
