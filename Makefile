####
#### Just here to do some dev patching in some cases.
####

## Repo paths.
BBOP_GRAPH ?= ../bbop-graph/


## Note, this is useful for ultra-fast prototyping, bypassing the
## necessary NPM steps for the server code.
.PHONY: patch-test-js
patch-test-js:
	cp $(BBOP_GRAPH)/lib/graph.js node_modules/bbop-graph/lib/graph.js
	gulp test
