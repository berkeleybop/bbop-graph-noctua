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
 * @memberOf annotation
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
 * @param {Array} in_anns - (optional) list of annotations to clobber current list
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
 * @param {String} new_id - (optional) new id; otherwise new unique generated
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
};
bbop.extend(noctua_graph, bbop_graph);

/**
 * Create an edge for use in internal operations.
 *
 * @param {string} subject - node id string or node
 * @param {string} object - node id string or node
 * @param {string} predicate - (optional) a user-friendly description of the node
 * @returns {edge} bbop model edge
 */
noctua_graph.prototype.create_edge = function(subject, object, predicate){
    return new noctua_edge(subject, object, predicate);
};

/**
 * Create a node for use in internal operations.
 *
 * @param {string} id - a unique id for the node
 * @param {string} label - (optional) a user-friendly description of the node
 * @param {Array} types - (optional) list of types to pre-load
 * @returns {node} new bbop model node
 */
noctua_graph.prototype.create_node = function(id, label, types){
    return new noctua_node(id, label, types);
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
	new_node = anchor.create_node(iid, null, itypes);

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
    return this._nodes || {};
};

/**
 * Remove a node from the graph.
 *
 * @param {String} node_id - the id for a node
 * @param {Boolean} clean_p - (optional) remove all edges connects to node (default false)
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
 * @param {String} predicate_id - (Optional) predicate ID or default
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
	ret = bbop_graph.prototype.remove_edge.call(eedge.subject_id(),
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
 * Load minerva data response.
 *
 * @param {Object} the "data" portion of a Minerva graph-related response.
 * @returns {this} 
 */
noctua_graph.prototype.load_minerva_response_data = function(data){
    var anchor = this;

    var ret = false;

    if( data ){
	
	// TODO: Graph parts--annotations, etc.

	var inds = data['individuals'];
	//var i_inds =raw_resp['data']['individuals-i'];
	var facts = data['facts'];
	
	// This is likely to be the seed for the graph builders ;)
	each(inds, function(ind){
	    anchor.add_node_from_individual(ind);
	});
	each(facts, function(fact){
	    anchor.add_edge_from_fact(fact);
	});

	ret = true;
    }	

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
 * @param {String} in_id - (optional) new id; otherwise new unique generated
 * @param {String} in_label - (optional) node "label"
 * @param {Array} in_types - (optional) list of Objects or strings--anything that can be parsed by class_expression
 * @returns {this}
 */
function noctua_node(in_id, in_label, in_types){
    bbop_node.call(this, in_id, in_label);
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
    if( us.isArray(in_types) ){
	each(in_types, function(in_type){
	    var new_type = new class_expression(in_type);
	    anchor._id2type[new_type.id()] = new_type;
	    anchor._types.push(new class_expression(in_type));
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
    var new_clone = new noctua_node(anchor.id(), anchor.label(), anchor.types());

    // Base class stuff.
    new_clone.type(this.type());
    new_clone.metadata(bbop.clone(this.metadata()));

    // Transfer over the new goodies.
    each(anchor._annotations, function(annotation){
	new_clone._annotations.push(annotation.clone());
    });
    new_clone._x_init = anchor._x_init;
    new_clone._y_init = anchor._y_init;

    return new_clone;
};

/**
 * Get current types; replace current types.
 * 
 * Parameters:
 * @param {Array} in_types - (optional) raw JSON type objects
 * @returns {Array} array of types
 */
noctua_node.prototype.types = function(in_types){
    var anchor = this;    

    if( us.isArray(in_types) ){

	// Wipe previous type set.
	anchor._id2type = {};
	anchor._types = [];

	each(in_types, function(in_type){
	    var new_type = new class_expression(in_type);
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

    if( us.isArray(in_types) ){
	each(in_types, function(in_type){
	    var new_type = new class_expression(in_type, inf_p);
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
/**
 * Sublcass of bbop-graph.edge for use with Noctua ideas and concepts.
 *
 * @constructor
 * @see module:bbop-graph
 * @alias edge
 * @param {String} subject - required subject id
 * @param {String} object - required object id
 * @param {String} predicate - (optional) preidcate id; if not provided, will use defined default (you probably want to provide one--explicit is better)
 * @returns {this}
 */
function noctua_edge(subject, object, predicate){
    bbop_edge.call(this, subject, object, predicate);
    this._is_a = 'bbop-graph-noctua.edge';

    // Edges are not completely anonymous in this world.
    this._id = bbop.uuid();

    this._annotations = [];
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
 * @deprecated
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
 * @deprecated
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
    constructr.prototype.get_annotations_by_key = _get_annotations_by_key;
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
