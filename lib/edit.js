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
/// node, edge.
///

var bbop_graph = bbop_model.graph;
function noctua_graph(new_id){
    bbop_graph.call(this);
    this._is_a = 'bbop-graph-noctua.graph';

    // The old edit core.
    this.core = {
	//'id': [], // currently optional
	'id': null, // currently optional
	'nodes': {}, // map of id to edit_node
	'edges': {}, // map of id to edit_edge
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

var bbop_node = bbop_model.node;
function noctua_node(new_id, new_label){
    bbop_node.call(this, new_id, new_label);
    this._is_a = 'bbop-graph-noctua.node';
};
bbop.extend(noctua_node, bbop_node);

var bbop_edge = bbop_model.edge;
function noctua_edge(subject, object, predicate){
    bbop_edge.call(this, subject, object, predicate);
    this._is_a = 'bbop-graph-noctua.edge';
};
bbop.extend(noctua_edge, bbop_edge);

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
