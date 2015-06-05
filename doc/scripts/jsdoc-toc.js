(function($) {
    // TODO: make the node ID configurable
    var treeNode = $('#jsdoc-toc-nav');

    // initialize the tree
    treeNode.tree({
        autoEscape: false,
        closedIcon: '&#x21e2;',
        data: [{"label":"<a href=\"edge.html\">edge</a>","id":"edge","children":[]},{"label":"<a href=\"graph.html\">graph</a>","id":"graph","children":[]},{"label":"<a href=\"module-bbop-graph-noctua.html\">bbop-graph-noctua</a>","id":"module:bbop-graph-noctua","children":[{"label":"<a href=\"module-bbop-graph-noctua-annotation.html\">annotation</a>","id":"module:bbop-graph-noctua~annotation","children":[]}]},{"label":"<a href=\"node.html\">node</a>","id":"node","children":[]}],
        openedIcon: ' &#x21e3;',
        saveState: true,
        useContextMenu: false
    });

    // add event handlers
    // TODO
})(jQuery);
