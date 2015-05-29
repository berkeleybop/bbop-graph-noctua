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


// Exportable body.
module.exports = {

    node: noctua_node,
    edge: noctua_edge,
    graph: noctua_graph

};
