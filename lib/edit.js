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
var bbop = require('bbop-core');
var bbop_model = require('bbop-graph');

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
 * @param {Object} kv_set - (optional) a set of keys and values; a simple object
 * @returns {this} new instance
 */
function annotation(kv_set){
    this._id = bbop.uuid();
    
    this._properties = {};
    
    if( kv_set && bbop.what_is(kv_set) == 'object' ){
	
	// Attempt to convert
	if( kv_set['key'] && kv_set['value'] ){
	    var key = kv_set['key'];
	    var val = kv_set['value'];
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
 * @param {String} value - (optional) string
 * @param {String} value_type - (optional) string
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
 * @param {String} key - (optional) string
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
 * @param {String} value - (optional) string
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
 * @param {String} value_type - (optional) string
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

///
/// Generic internal annotation operations.
///

function _annotations(in_ann){
    if( in_ann && bbop.what_is(in_ann) == 'array' ){
	this._annotations = in_ann;
    }
    return this._annotations;
}

function _add_annotation(in_ann){
    if( in_ann && bbop.what_is(in_ann) != 'array' ){
	this._annotations.push(in_ann);
    }
    return this._annotations;
}

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
/// Next, get some subclasses working for the core triumvirate: graph,
/// node, edge. Start with graph.
///

var bbop_graph = bbop_model.graph;
function noctua_graph(new_id){
    bbop_graph.call(this);
    this._is_a = 'bbop-graph-noctua.graph';

    // Deal with id.
    if( new_id ){ bbop_graph.id(new_id); }

    // The old edit core.
    this.core = {
	//'id': [], // currently optional
	//'id': null, // currently optional
	//'nodes': {}, // map of id to edit_node
	//'edges': {}, // map of id to edit_edge
	'node_order': [], // initial table order on redraws
	'node2elt': {}, // map of id to physical object id
	'elt2node': {},  // map of physical object id to id
	// Remeber that edge ids and elts ids are the same, so no map
	// is needed.
	'edge2connector': {}, // map of edge id to virtual connector id
	'connector2edge': {}  // map of virtual connector id to edge id 
    };

    this._annotations = [];
};
bbop.extend(noctua_graph, bbop_graph);

/**
 * Add an ID to the graph.
 *
 * @param {String} id - string
 * @returns {String} string
 */
noctua_graph.prototype.add_id = function(id){
    return this.id(id);
};

/**
 * Get the ID from the graph.
 *
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
 * Convert the JSON-LD lite node model (Minerva) into the edit core.
 * Creates or adds as necessary.
 *
 * @param {Object} indv - hash rep of graph individual from Minerva response?
 * @returns {node|null} 
 */
noctua_graph.prototype.add_node_from_individual = function(indv){
    var anchor = this;

    var ret = null;

    // Add individual to edit graph if properly structured.
    var iid = indv['id'];
    if( iid ){
	
	// See if there is type info that we want to add.
	var itypes = indv['type'] || [];
	if( bbop.core.what_is(itypes) != 'array' ){
	    throw new Error('types is wrong');
	}

	// Create the node.
	var ne = new noctua_node(iid, itypes, ianns);

	// See if there is type info that we want to add.
	var ianns = indv['annotations'] || [];
	if( bbop.what_is(ianns) != 'array' ){
	    throw new Error('annotations is wrong');
	}else{
	    // Add the annotations individually.
	    each(ianns, function(ann_kv_set){
		var na = new annotation(ann_kv_set);
		ne.add_annotation(na);
	    });
	}

	anchor.add_node(ne);
	ret = ne;
    }
    
    return ne;
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
 * Return a node by its element id.
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
 * Return a node by its corresponding Minerva JSON rep individual.
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
    return this._nodes.hash || {};
};

//// TODO

///
/// Node subclass and overrides.
///

var bbop_node = bbop_model.node;
function noctua_node(in_id, in_types){
    bbop_node.call(this, in_id); // no labels here
    this._is_a = 'bbop-graph-noctua.node';
    var anchor = this;

    this._types = [];
    this._id2type = {};
    this._annotations = [];

    // Incoming ID or generate ourselves.
    if( typeof(in_id) === 'undefined' ){
	this._id = bbop.uuid();
    }else{
	//this._id = in_id;
	this._id = in_id;
    }

    // Roll in any types that we may have coming in.
    if( typeof(in_types) !== 'undefined' ){
	each(in_types, function(in_type){
	    var new_type = new bbopx.minerva.class_expression(in_type);
	    anchor._id2type[new_type.id()] = new_type;
	    anchor._types.push(new bbopx.minerva.class_expression(in_type));
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
 * Get current types; replace current types.
 * 
 * Parameters:
 * @param {Array} in_types - (optional) raw JSON type objects
 * @returns {Array} array of types
 */
noctua_node.prototype.types = function(in_types){
    var anchor = this;    

    if( in_types && bbop.what_is(in_types) == 'array' ){

	// Wipe previous type set.
	anchor._id2type = {};
	anchor._types = [];

	bbop.core.each(in_types, function(in_type){
	    var new_type = new bbopx.minerva.class_expression(in_type);
	    anchor._id2type[new_type.id()] = new_type;
	    anchor._types.push(new_type);
	});
    }
    return this._types;
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

    if( in_types && bbop.what_is(in_types) == 'array' ){
	each(in_types, function(in_type){
	    var new_type = new bbopx.minerva.class_expression(in_type, inf_p);
	    anchor._id2type[new_type.id()] = new_type;
	    anchor._types.push(new_type);
	    
	    ret = true; // return true if did something
	});
    }
    return ret;
};

/**
 * If extant, get the type by its unique identifier.
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
function noctua_edge(subject, object, predicate){
    bbop_edge.call(this, subject, object, predicate);
    this._is_a = 'bbop-graph-noctua.edge';

    // Edges are not completely anonymous in this world.
    this._id = bbop.uuid();

    this._annotations = [];
};
bbop.extend(noctua_edge, bbop_edge);

/**
 * Get/set "source" of edge.
 * 
 * @param {String} value - (optional) string
 * @returns {String} string
 */
noctua_edge.prototype.source = function(value){
    if(value) this._subject_id = value;
    return this._subject_id;
};

/**
 * Get/set "target" of edge.
 * 
 * @param {String} value - (optional) string
 * @returns {String} string
 */
noctua_edge.prototype.target = function(value){
    if(value) this._object_id = value;
    return this._object_id;
};

/**
 * Get/set "relation" of edge.
 * 
 * @param {String} value - (optional) string
 * @returns {String} string
 */
noctua_edge.prototype.relation = function(value){
    if(value) this._predicate_id = value;
    return this._predicate_id;
};

///
/// Add generic bulk annotation operations to: graph, edge, and node.
///

each([noctua_graph, noctua_node, noctua_edge], function(constructr){
    constructr.prototype.annotations = _annotations;
    constructr.prototype.add_annotation = _add_annotation;
    constructr.prototype.get_annotations_by_filter = _get_annotations_by_filter;
    constructr.prototype.get_annotation_by_id = _get_annotation_by_id;
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
