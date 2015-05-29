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
/// Okay, first off, get some subclasses working for the core
/// triumvirate: graph, node, edge.
///

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

var bbop_graph = bbop_model.graph;
function noctua_graph(new_id){
    bbop_graph.call(this);
    this._is_a = 'bbop-graph-noctua.graph';
};
bbop.extend(noctua_graph, bbop_graph);

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
	    var adj_set = {};
	    adj_set[key] = val;
	    this._properties = bbop.clone(adj_set);
	}else{
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
 * Add a property by key and value.
 *
 * @param {String} key - string
 * @param {String} value - (optional) string
 * @returns {String|null} returns property is key
 */
annotation.prototype.property = function(key, value){

    var anchor = this;
    var ret = null;

    // Set if the key and value are there.
    if( key ){
	if( typeof(value) !== 'undefined' ){
	    anchor._properties[key] = value;
	}
	ret = anchor._properties[key];
    }

    return ret;
};

/**
 * Delete a property by key.
 *
 * @param {String} key - string
 * @returns {String|null} returns string if property was found and deleted
 */
annotation.prototype.delete_property = function(key){

    var anchor = this;
    var ret = null;

    if( key ){
	ret = delete anchor._properties[key];
    }

    return ret;
};

///
/// Exportable body.
///

module.exports = {

    annotation: annotation,
    node: noctua_node,
    edge: noctua_edge,
    graph: noctua_graph

};
