<script>
	import { onMount, afterUpdate, createEventDispatcher } from 'svelte';
	import { phylotree } from 'phylotree';
	import * as d3 from 'd3';

	export let data = null;
	export let height = 600;
	export let width = 800;
	export let branchLengthProperty = 'branch length';
	export let colorBranches = 'none';
	export let showLabels = true;
	export let showScale = true;
	export let isRadial = false;
	export let treeIndex = 0;

	let treeContainer;
	let tree;
	let renderedTree;
	let selection_set = []; // For parsed tags
	let current_selection_id = 0; // Current active selection index

	// Color scheme for different tags
	const color_scheme = d3.scaleOrdinal(d3.schemeCategory10);

	const dispatch = createEventDispatcher();

	onMount(() => {
		renderTree();
	});

	afterUpdate(() => {
		const newick = getTreeNewick(data, treeIndex);
		if (newick && treeContainer) {
			renderTree();
		}
	});

	function getTreeNewick(data, treeIndex = 0) {
		if (!data?.input?.trees) return null;
		
		// Handle different tree storage formats from hyphy-eye
		const trees = data.input.trees;
		
		if (Array.isArray(trees)) {
			return trees[treeIndex] || trees[0] || null;
		} else if (typeof trees === 'object') {
			const treeKeys = Object.keys(trees);
			const treeKey = treeKeys[treeIndex] || treeKeys[0];
			return trees[treeKey] || null;
		} else if (typeof trees === 'string') {
			return trees;
		}
		
		return null;
	}

	function getBranchAttributes(data, treeIndex = 0) {
		if (!data?.["branch attributes"]) return {};
		
		const branchAttrs = data["branch attributes"];
		if (Array.isArray(branchAttrs)) {
			return branchAttrs[treeIndex] || branchAttrs[0] || {};
		} else if (typeof branchAttrs === 'object') {
			const attrKeys = Object.keys(branchAttrs);
			const attrKey = attrKeys[treeIndex] || attrKeys[0];
			return branchAttrs[attrKey] || {};
		}
		
		return branchAttrs || {};
	}

	// Node colorizer function that applies colors based on annotations/tags
	function nodeColorizer(element, data) {
		try {
			if (!data || !selection_set || selection_set.length === 0) {
				return;
			}

			let count_class = 0;
			// The structure might vary depending on the phylotree version, so we need to safely access it
			let annotation = null;

			// Different possible paths to annotation data
			if (data.annotation) {
				annotation = data.annotation;
			} else if (data.data && data.data.annotation) {
				annotation = data.data.annotation;
			}

			if (annotation) {
				selection_set.forEach(function (tag, i) {
					// Check if the node has this tag
					if (annotation === tag) {
						count_class++;
						element.style('fill', color_scheme(i), i === current_selection_id ? 'important' : null);
					}
				});
			}

			// If no tag was applied, reset the style
			if (count_class === 0) {
				element.style('fill', null);
			}
		} catch (e) {
			console.error('Error in nodeColorizer:', e);
		}
	}

	// Edge colorizer function that applies colors based on annotations/tags
	function edgeColorizer(element, data) {
		try {
			let count_class = 0;
			// The structure might vary depending on the phylotree version, so we need to safely access it
			let annotation = null;

			// Different possible paths to annotation data
			if (data.target && data.target.annotation) {
				annotation = data.target.annotation;
			} else if (data.target && data.target.data && data.target.data.annotation) {
				annotation = data.target.data.annotation;
			} else if (data.annotation) {
				annotation = data.annotation;
			}

			if (annotation && selection_set.length > 0) {
				selection_set.forEach(function (tag, i) {
					// Check if the target node has this tag
					if (annotation === tag) {
						count_class++;
						element.style(
							'stroke',
							color_scheme(i),
							i === current_selection_id ? 'important' : null
						);
					}
				});
			}

			// Handle multiple classes or reset style if needed
			if (count_class > 1) {
				element.classed('branch-multiple', true);
			} else if (count_class === 0) {
				element.style('stroke', null).classed('branch-multiple', false);
			}
		} catch (e) {
			console.error('Error in edgeColorizer:', e);
		}
	}

	function renderTree() {
		try {
			// Make sure we have a valid Newick string
			const newickString = getTreeNewick(data, treeIndex);
			if (!newickString || newickString.trim() === '') {
				if (treeContainer) {
					treeContainer.innerHTML = '<p>No tree data found</p>';
				}
				return;
			}

			// Initialize tree from Newick string
			tree = new phylotree(newickString);

			// Check for parsed tags in the tree
			if (tree.parsed_tags && tree.parsed_tags.length) {
				selection_set = [...tree.parsed_tags];

				// Dispatch the parsed tags to the parent component using a timeout
				// to avoid the initial rendering error
				setTimeout(() => {
					try {
						dispatch('parsedtags', {
							parsed_tags: selection_set
						});
					} catch (dispatchError) {
						console.error('Error dispatching parsed tags:', dispatchError);
					}
				}, 0);
			}

			// Set branch length accessor if we have branch attributes
			const branchAttrs = getBranchAttributes(data, treeIndex);
			if (branchAttrs && Object.keys(branchAttrs).length > 0) {
				tree.branch_length(function(node) {
					if (node.data.name && branchAttrs[node.data.name]) {
						return branchAttrs[node.data.name][branchLengthProperty] || node.data.attribute;
					}
					return node.data.attribute || 0;
				});
			}
		} catch (e) {
			console.error('Error in renderTree:', e);
		}

		// Render the tree with colorizers
		renderedTree = tree.render({
			container: '.tree-container',
			height: height,
			width: width,
			'left-right-spacing': 'fit-to-size',
			'top-bottom-spacing': 'fit-to-size',
			'show-scale': showScale,
			'is-radial': isRadial,
			'show-menu': false,
			selectable: false,
			collapsible: false,
			reroot: false,
			hide: false,
			'node-styler': nodeColorizer,
			'edge-styler': edgeColorizer
		});

		// Apply branch styling for color branches
		if (colorBranches === 'branch length') {
			const branchAttrs = getBranchAttributes(data, treeIndex);
			if (branchAttrs && Object.keys(branchAttrs).length > 0) {
				const values = [];
				Object.keys(branchAttrs).forEach(nodeName => {
					const value = branchAttrs[nodeName][branchLengthProperty];
					if (value !== undefined) values.push(value);
				});

				if (values.length > 0) {
					const colorScale = d3.scaleSequential(d3.interpolateViridis)
						.domain(d3.extent(values));

					renderedTree.style_edges((element, data) => {
						const targetName = data.target.data.name;
						if (targetName && branchAttrs[targetName]) {
							const value = branchAttrs[targetName][branchLengthProperty];
							if (value !== undefined) {
								d3.select(element).style('stroke', colorScale(value))
									.style('stroke-width', '2px');
							}
						}
					});
				}
			}
		}

		// Style nodes and add labels
		if (showLabels) {
			renderedTree.style_nodes((element, data) => {
				// Hide internal node circles when showing labels
				if (data.children) {
					d3.select(element).style('display', 'none');
				}
			});
		}

		// Clear the container and append the SVG element
		treeContainer.innerHTML = '';
		treeContainer.appendChild(renderedTree.show());

		// Add click handlers for the nodes
		d3.select(treeContainer)
			.selectAll('.node')
			.on('click', (event, d) => {
				event.preventDefault();
				if (renderedTree.handle_node_click) {
					renderedTree.handle_node_click(d, event);
				}
			});
	}
</script>

<svelte:head>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/phylotree@2.1.7/dist/phylotree.css" />
</svelte:head>

<div class="phylogenetic-tree-viewer">
	{#if !data}
		<div class="loading">No tree data provided</div>
	{:else}
		<div class="controls">
			<div class="control-group">
				<label for="tree-index">Tree:</label>
				<input 
					id="tree-index" 
					type="number" 
					bind:value={treeIndex} 
					min="0" 
					max="10"
				/>
			</div>
			
			<div class="control-group">
				<label for="color-branches">Color branches:</label>
				<select id="color-branches" bind:value={colorBranches}>
					<option value="none">None</option>
					<option value="branch length">Branch length</option>
				</select>
			</div>

			<div class="control-group">
				<label>
					<input type="checkbox" bind:checked={showLabels} />
					Show labels
				</label>
			</div>

			<div class="control-group">
				<label>
					<input type="checkbox" bind:checked={showScale} />
					Show scale
				</label>
			</div>

			<div class="control-group">
				<label>
					<input type="checkbox" bind:checked={isRadial} />
					Radial layout
				</label>
			</div>
		</div>
		
		<div bind:this={treeContainer} class="tree-container"></div>
	{/if}
</div>

<style>
	.phylogenetic-tree-viewer {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		max-width: 100%;
		margin: 0 auto;
		padding: 1rem;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: #666;
		font-style: italic;
	}

	.controls {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.control-group label {
		font-weight: 500;
		color: #333;
	}

	.control-group input,
	.control-group select {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 3px;
	}

	.tree-container {
		border: 1px solid #ddd;
		border-radius: 4px;
		background: #fff;
		overflow: auto;
		min-height: 400px;
	}

	.error {
		color: #e74c3c;
		text-align: center;
		padding: 2rem;
	}

	/* Global styles for phylotree dropdown functionality */
	:global(.dropdown-menu) {
		position: absolute;
		background: white;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 5px 0;
		min-width: 160px;
		z-index: 1000;
	}

	:global(.dropdown-item) {
		display: block;
		padding: 3px 20px;
		clear: both;
		font-weight: normal;
		line-height: 1.42857143;
		color: #333;
		white-space: nowrap;
		cursor: pointer;
	}

	:global(.dropdown-item:hover) {
		background-color: #f5f5f5;
	}

	:global(.dropdown-divider) {
		height: 1px;
		margin: 5px 0;
		background-color: #e5e5e5;
	}

	:global(.dropdown-header) {
		display: block;
		padding: 3px 20px;
		font-size: 12px;
		line-height: 1.42857143;
		color: #777;
	}

	/* Styling for tagged nodes */
	:global(.tagged-node) {
		fill: #007bff;
		font-weight: bold;
	}

	:global(.tagged-node circle) {
		fill: #007bff;
		stroke: #0056b3;
		stroke-width: 2px;
	}

	/* Multiple tag styling */
	:global(.branch-multiple) {
		stroke-dasharray: 5, 3;
		stroke-width: 3px !important;
	}

	/* Phylotree specific styles */
	:global(.node) {
		fill: #333;
		stroke: #333;
	}

	:global(.branch) {
		fill: none;
		stroke: #333;
		stroke-width: 1px;
	}

	:global(.internal-node) {
		fill: #666;
		stroke: #666;
	}

	:global(.tree-scale-bar) {
		stroke: #666;
		stroke-width: 1px;
	}

	:global(.tree-scale-label) {
		font-size: 10px;
		fill: #666;
	}
</style>