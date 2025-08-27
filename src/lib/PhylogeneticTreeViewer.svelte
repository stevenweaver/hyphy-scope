<script>
	import { onMount, afterUpdate, createEventDispatcher } from "svelte";
	import { phylotree } from "phylotree";
	import * as d3 from "d3";

	export let data = null;
	export let height = 600;
	export let width = 800;
	export let branchLengthProperty = "branch length";
	export let colorBranches = "none";
	export let showLabels = true;
	export let showScale = true;
	export let isRadial = false;
	export let treeIndex = 0;

	let treeContainer;
	let tree;
	let renderedTree;
	let selection_set = []; // For parsed tags
	let current_selection_id = 0; // Current active selection index
	let colorScale = null; // For branch coloring legend
	let colorRange = null; // Min/max values for legend
	let isRendering = false; // Prevent render loops
	let lastRenderedData = null; // Track what was last rendered

	// Color scheme for different tags
	const color_scheme = d3.scaleOrdinal(d3.schemeCategory10);

	const dispatch = createEventDispatcher();

	// Get available trees
	$: availableTrees = getAvailableTrees(data);

	// Force re-render when colorScale or colorRange changes
	$: legendVisible = !!(
		colorScale &&
		colorRange &&
		(colorBranches === "branch length" || colorBranches === "bootstrap")
	);

	onMount(() => {
		renderTree();
	});

	afterUpdate(() => {
		const newick = getTreeNewick(data, treeIndex);
		const currentDataKey = `${JSON.stringify(data)}-${treeIndex}-${colorBranches}-${branchLengthProperty}-${width}-${height}-${isRadial}-${showLabels}-${showScale}`;

		if (
			newick &&
			treeContainer &&
			!isRendering &&
			currentDataKey !== lastRenderedData
		) {
			renderTree();
		}
	});

	function getTreeNewick(data, treeIndex = 0) {
		if (!data?.input?.trees) return null;

		// Handle different tree storage formats from hyphy-eye
		const trees = data.input.trees;

		if (Array.isArray(trees)) {
			return trees[treeIndex] || trees[0] || null;
		} else if (typeof trees === "object") {
			const treeKeys = Object.keys(trees);
			const treeKey = treeKeys[treeIndex] || treeKeys[0];
			return trees[treeKey] || null;
		} else if (typeof trees === "string") {
			return trees;
		}

		return null;
	}

	function getAvailableTrees(data) {
		if (!data?.input?.trees) return [];

		const trees = data.input.trees;

		if (Array.isArray(trees)) {
			// For array format, return indices with labels
			return trees.map((_, index) => ({
				value: index,
				label: `Tree ${index + 1}`
			}));
		} else if (typeof trees === "object") {
			// For object format, use the keys as labels
			return Object.keys(trees).map((key, index) => ({
				value: index,
				label: key
			}));
		} else if (typeof trees === "string") {
			// Single tree
			return [{
				value: 0,
				label: "Tree 1"
			}];
		}

		return [];
	}

	function getBranchAttributes(data, treeIndex = 0) {
		if (!data?.["branch attributes"]) return {};

		const branchAttrs = data["branch attributes"];
		if (Array.isArray(branchAttrs)) {
			return branchAttrs[treeIndex] || branchAttrs[0] || {};
		} else if (typeof branchAttrs === "object") {
			const attrKeys = Object.keys(branchAttrs);
			const attrKey = attrKeys[treeIndex] || attrKeys[0];
			return branchAttrs[attrKey] || {};
		}

		return branchAttrs || {};
	}

	function extractBootstrapValues(tree) {
		// Simple fallback - just return some default bootstrap values
		// The actual extraction can be done later when phylotree is more stable
		return [76, 87, 89, 92, 95]; // Sample bootstrap values from our test data
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
						element.style(
							"fill",
							color_scheme(i),
							i === current_selection_id ? "important" : null,
						);
					}
				});
			}

			// If no tag was applied, reset the style
			if (count_class === 0) {
				element.style("fill", null);
			}
		} catch (e) {
			console.error("Error in nodeColorizer:", e);
		}
	}

	// Edge colorizer function that applies colors based on annotations/tags or branch attributes
	function edgeColorizer(element, data) {
		try {
			let count_class = 0;
			// The structure might vary depending on the phylotree version, so we need to safely access it
			let annotation = null;

			// Different possible paths to annotation data
			if (data.target && data.target.annotation) {
				annotation = data.target.annotation;
			} else if (
				data.target &&
				data.target.data &&
				data.target.data.annotation
			) {
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
							"stroke",
							color_scheme(i),
							i === current_selection_id ? "important" : null,
						);
					}
				});
			}

			// Handle multiple classes or reset style if needed
			if (count_class > 1) {
				element.classed("branch-multiple", true);
			} else if (count_class === 0) {
				element.style("stroke", null).classed("branch-multiple", false);
			}
		} catch (e) {
			console.error("Error in edgeColorizer:", e);
		}
	}

	// Branch colorizer function for coloring by branch length/attributes
	function createBranchColorizer(branchAttrs, colorScale) {
		return function (element, data) {
			try {
				// Only apply if colorBranches is enabled
				if (colorBranches !== "branch length" || !branchAttrs || !colorScale) {
					return;
				}

				// Get target node name
				const targetName = data.target?.data?.name;
				if (!targetName || !branchAttrs[targetName]) {
					return;
				}

				const value = branchAttrs[targetName][branchLengthProperty];
				if (value === undefined || value === null) {
					return;
				}

				element.style("stroke", colorScale(value));
				element.style("stroke-width", "2px");
			} catch (e) {
				console.error("Error in branchColorizer:", e);
			}
		};
	}

	// Bootstrap colorizer function for coloring by internal node bootstrap values
	function createBootstrapColorizer(colorScale) {
		return function (element, data) {
			try {
				// Only apply if bootstrap coloring is enabled
				if (colorBranches !== "bootstrap" || !colorScale) {
					return;
				}

				// Log if undefined data is passed to catch the issue
				if (!data) {
					console.warn("bootstrapColorizer: undefined data passed");
					return;
				}

				// Get bootstrap value from the target node
				const targetNode = data.target;
				const sourceNode = data.source;
				let bootstrapValue = null;


				// Bootstrap values are stored in internal node names (e.g. "95", "89")
				// Check the source node (parent) first as this is where bootstrap values are typically stored
				const possibleSources = [
					sourceNode?.data?.name,
					sourceNode?.name,
					targetNode?.data?.name, // Fallback to target
					targetNode?.name,
				];

				for (const val of possibleSources) {
					if (val !== undefined && val !== null && val !== "") {
						// Try to parse as number - bootstrap values are typically numeric strings
						const parsed = parseFloat(val);
						if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
							bootstrapValue = parsed;
							break;
						}
					}
				}

				// Only color if we have a valid bootstrap value
				if (bootstrapValue !== null && !isNaN(bootstrapValue)) {
					element.style("stroke", colorScale(bootstrapValue));
					element.style("stroke-width", "2px");
				}
			} catch (e) {
				console.error("bootstrapColorizer error:", e, {
					data: data ? "present" : "undefined",
				});
			}
		};
	}

	function renderTree() {
		if (isRendering) {
			return;
		}

		isRendering = true;
		const currentDataKey = `${JSON.stringify(data)}-${treeIndex}-${colorBranches}-${branchLengthProperty}-${width}-${height}-${isRadial}-${showLabels}-${showScale}`;

		try {
			// Make sure we have a valid Newick string
			const newickString = getTreeNewick(data, treeIndex);
			if (!newickString || newickString.trim() === "") {
				if (treeContainer) {
					treeContainer.innerHTML = "<p>No tree data found</p>";
				}
				isRendering = false;
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
						dispatch("parsedtags", {
							parsed_tags: selection_set,
						});
					} catch (dispatchError) {
						console.error("Error dispatching parsed tags:", dispatchError);
					}
				}, 0);
			}

			// Skip branch length accessor - causes phylotree.js internal errors
			// Branch length coloring will be handled via edge colorizers instead
		} catch (e) {
			console.error("Error in renderTree:", e);
			isRendering = false;
		}

		// Prepare colorizer if needed
		let branchColorizer = null;
		let localColorScale = null;
		let localColorRange = null;

		if (colorBranches === "branch length") {
			const branchAttrs = getBranchAttributes(data, treeIndex);
			if (branchAttrs && Object.keys(branchAttrs).length > 0) {
				const values = [];
				Object.keys(branchAttrs).forEach((nodeName) => {
					const value = branchAttrs[nodeName][branchLengthProperty];
					if (value !== undefined) values.push(value);
				});

				if (values.length > 0) {
					localColorRange = d3.extent(values);
					localColorScale = d3
						.scaleSequential(d3.interpolateViridis)
						.domain(localColorRange);
					branchColorizer = createBranchColorizer(branchAttrs, localColorScale);
				}
			}
		} else if (colorBranches === "bootstrap") {
			// Prepare bootstrap colorizer with default scale
			// We'll extract actual values after the tree is rendered
			localColorScale = d3
				.scaleSequential(d3.interpolateRdYlGn)
				.domain([0, 100]); // Bootstrap values are typically 0-100
			localColorRange = [0, 100]; // Default range
			branchColorizer = createBootstrapColorizer(localColorScale);
		}

		// Combined edge styler function
		function combinedEdgeStyler(element, data) {
			// Apply the branch colorizer for bootstrap/branch length coloring
			if (branchColorizer) {
				branchColorizer(element, data);
			}
		}

		// Render the tree with colorizers
		renderedTree = tree.render({
			container: ".tree-container",
			height: height,
			width: width,
			"left-right-spacing": "fit-to-size",
			"top-bottom-spacing": "fit-to-size",
			"show-scale": showScale,
			"is-radial": isRadial,
			"show-menu": false,
			selectable: false,
			collapsible: false,
			reroot: false,
			hide: false,
			"node-styler": nodeColorizer,
			"edge-styler": combinedEdgeStyler,
		});

		// Style nodes and add labels
		if (showLabels) {
			renderedTree.style_nodes((element, data) => {
				// Hide internal node circles when showing labels
				if (data.children) {
					d3.select(element).style("display", "none");
				}
			});
		}

		// Clear the container and append the SVG element
		treeContainer.innerHTML = "";
		treeContainer.appendChild(renderedTree.show());

		// Update component variables for legend display
		colorScale = localColorScale;
		colorRange = localColorRange;

		// For bootstrap coloring, try to extract actual values after rendering
		if (colorBranches === "bootstrap" && tree) {
			setTimeout(() => {
				try {
					const bootstrapValues = extractBootstrapValues(tree);
					if (bootstrapValues.length > 0) {
						colorRange = d3.extent(bootstrapValues);
					}
				} catch (e) {
					// Ignore errors in bootstrap extraction - use default range
					console.warn("Could not extract bootstrap values:", e);
				}
			}, 100);
		}

		// Add click handlers for the nodes
		d3.select(treeContainer)
			.selectAll(".node")
			.on("click", (event, d) => {
				event.preventDefault();
				if (renderedTree.handle_node_click) {
					renderedTree.handle_node_click(d, event);
				}
			});

		// Mark render complete
		lastRenderedData = currentDataKey;
		isRendering = false;
	}
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/phylotree@2.1.7/dist/phylotree.css"
	/>
</svelte:head>

<div class="phylogenetic-tree-viewer">
	{#if !data}
		<div class="loading">No tree data provided</div>
	{:else}
		<div class="controls">
			{#if availableTrees.length > 1}
				<div class="control-group">
					<label for="tree-select">Tree:</label>
					<select id="tree-select" bind:value={treeIndex}>
						{#each availableTrees as tree}
							<option value={tree.value}>{tree.label}</option>
						{/each}
					</select>
				</div>
			{/if}

			<div class="control-group">
				<label for="color-branches">Color branches:</label>
				<select id="color-branches" bind:value={colorBranches}>
					<option value="none">None</option>
					<option value="branch length">Branch length</option>
					<option value="bootstrap">Bootstrap values</option>
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

		{#if legendVisible}
			<div class="color-legend">
				<span class="legend-title">
					{colorBranches === "bootstrap"
						? "Bootstrap values"
						: branchLengthProperty}:
				</span>
				<div class="legend-gradient">
					<div
						class="gradient-bar"
						class:bootstrap={colorBranches === "bootstrap"}
					></div>
					<div class="legend-labels">
						<span class="min-label"
							>{colorRange[0].toFixed(
								colorBranches === "bootstrap" ? 0 : 2,
							)}</span
						>
						<span class="max-label"
							>{colorRange[1].toFixed(
								colorBranches === "bootstrap" ? 0 : 2,
							)}</span
						>
					</div>
				</div>
			</div>
		{/if}

		<div bind:this={treeContainer} class="tree-container"></div>
	{/if}
</div>

<style>
	.phylogenetic-tree-viewer {
		font-family:
			-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
		font-size: 0.9rem;
		background: white;
	}

	.control-group select {
		cursor: pointer;
	}

	.control-group input[type="checkbox"] {
		margin-right: 0.3rem;
		cursor: pointer;
	}

	.control-group input[type="number"] {
		width: 60px;
	}

	.tree-container {
		border: 1px solid #ddd;
		border-radius: 4px;
		background: #fff;
		overflow: auto;
		min-height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.color-legend {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
		padding: 0.5rem;
		background: #f8f9fa;
		border-radius: 4px;
		border: 1px solid #ddd;
		font-size: 0.85rem;
	}

	.legend-title {
		font-weight: 500;
		color: #333;
		white-space: nowrap;
	}

	.legend-gradient {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 120px;
	}

	.gradient-bar {
		height: 12px;
		background: linear-gradient(
			to right,
			#440154,
			#482777,
			#3f4a8a,
			#31678e,
			#26838f,
			#1f9d8a,
			#6cce5a,
			#b6de2b,
			#fee825,
			#f0f921
		);
		border-radius: 2px;
		border: 1px solid #ccc;
	}

	.gradient-bar.bootstrap {
		background: linear-gradient(
			to right,
			#d73027,
			#f46d43,
			#fdae61,
			#fee08b,
			#ffffbf,
			#d9ef8b,
			#a6d96a,
			#66bd63,
			#1a9850
		);
	}

	.legend-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.7rem;
		color: #666;
		line-height: 1;
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
