import { App, Notice, TAbstractFile, TFile } from 'obsidian';
import { SNACalculator, Node, Edge, CentralityResults } from './SNACalculator';
import { LayoutEngine } from './LayoutEngine';
import SNAPlugin from '../main';

export class GraphAnalyzer {
	plugin: SNAPlugin;
	calculator: SNACalculator;
	layoutEngine: LayoutEngine;

	constructor(plugin: SNAPlugin, calculator: SNACalculator) {
		this.plugin = plugin;
		this.calculator = calculator;
		this.layoutEngine = new LayoutEngine();
	}

	/**
	 * Get the current graph view's query/path filter
	 */
	private getGraphViewFilter(): string | null {
		try {
			const graphLeaves = (this.plugin.app.workspace as any).getLeavesOfType('graph');
			if (graphLeaves && graphLeaves.length > 0) {
				const graphState = (graphLeaves[0] as any).view?.state;
				if (graphState && graphState.query) {
					return graphState.query;
				}
			}
		} catch (error) {
			console.error('Error getting graph view filter:', error);
		}
		return null;
	}

	/**
	 * Check if a file path matches the graph filter
	 */
	private matchesFilter(filePath: string, filter: string | null): boolean {
		if (!filter) return true; // No filter = include all
		
		// Handle path-based filters like "folder/" or "folder"
		if (filter.endsWith('/') || !filter.includes('*')) {
			return filePath.startsWith(filter.replace(/\/$/, ''));
		}
		
		// Handle wildcard patterns
		const regex = new RegExp('^' + filter.replace(/\*/g, '.*') + '$');
		return regex.test(filePath);
	}

	/**
	 * Extract graph data from Obsidian's metadataCache using resolvedLinks
	 * Respects the current graph view's path filter
	 */
	extractGraphData(): { nodes: Node[]; edges: Edge[] } | null {
		try {
			const metadataCache = this.plugin.app.metadataCache;
			const vault = this.plugin.app.vault;
			const filter = this.getGraphViewFilter();

			// Get all markdown files
			const files: TFile[] = [];
			vault.getAllLoadedFiles().forEach((file: TAbstractFile) => {
				if (file instanceof TFile && file.extension === 'md') {
					// Apply graph view filter
					if (this.matchesFilter(file.path, filter)) {
						files.push(file);
					}
				}
			});

			if (files.length === 0) {
				const filterMsg = filter ? ` matching filter "${filter}"` : '';
				new Notice(`No markdown files found${filterMsg} in vault.`);
				return null;
			}

			// Create set of valid file paths
			const validPaths = new Set(files.map(f => f.path));

			// Create nodes from files
			const nodeSet = new Set<string>();
			const edges: Edge[] = [];

			files.forEach((file: TFile) => {
				const filePath = file.path;
				nodeSet.add(filePath);

				// Get resolved links for this file
				const resolvedLinks = metadataCache.getLinks(filePath);
				if (!resolvedLinks) return;

				// Process each resolved link
				Object.keys(resolvedLinks).forEach((linkedPath: string) => {
					// Only include links to files in the filtered set
					if (!validPaths.has(linkedPath)) return;

					nodeSet.add(linkedPath);

					// Get link count (how many times this file links to the target)
					const linkCount = resolvedLinks[linkedPath] || 1;

					edges.push({
						source: filePath,
						target: linkedPath,
						weight: this.plugin.settings.enableWeightedLinks
							? linkCount
							: 1,
						directed: true,
					});
				});
			});

			// Convert node set to node array
			const nodes: Node[] = Array.from(nodeSet).map((nodePath: string) => ({
				id: nodePath,
				label: nodePath.split('/').pop()?.replace('.md', '') || nodePath,
			}));

			if (nodes.length === 0) {
				new Notice('No nodes found. Check your graph view settings.');
				return null;
			}

			if (edges.length === 0) {
				new Notice('No links found. Create some backlinks first.');
				return null;
			}

			console.log(`Extracted ${nodes.length} nodes and ${edges.length} edges`);
			return { nodes, edges };
		} catch (error) {
			new Notice('Error extracting graph data: ' + error);
			console.error('Graph extraction error:', error);
			return null;
		}
	}

	/**
	 * Filter edges based on minimum weight threshold
	 */
	filterEdgesByWeight(edges: Edge[], minWeight: number): Edge[] {
		if (!this.plugin.settings.enableWeightedLinks) {
			return edges;
		}
		return edges.filter((edge) => edge.weight >= minWeight);
	}

	/**
	 * Analyze the current graph
	 */
	async analyzeCurrentGraph(): Promise<CentralityResults | null> {
		const graphData = this.extractGraphData();
		if (!graphData) return null;

		const { nodes, edges } = graphData;
		
		if (edges.length === 0) {
			new Notice('No edges found in graph.');
			return null;
		}

		const filteredEdges = this.filterEdgesByWeight(
			edges,
			this.plugin.settings.minLinkWeight
		);

		if (filteredEdges.length === 0) {
			new Notice('No edges match the minimum weight threshold.');
			return null;
		}

		const results = this.calculator.calculateAllCentrality(
			nodes,
			filteredEdges,
			this.plugin.settings.enableDirectional
		);

		new Notice('Graph analysis complete!');
		return results;
	}

	/**
	 * Calculate all centrality metrics
	 */
	async calculateAllCentrality(): Promise<void> {
		const results = await this.analyzeCurrentGraph();
		if (!results) return;

		// Display results
		const message = this.formatResults(results);
		console.log(message);

		if (this.plugin.settings.autoExport) {
			await this.exportResults();
		}
	}

	/**
	 * Format results for display
	 */
	private formatResults(results: CentralityResults): string {
		let output = '## Social Network Analysis Results\n\n';

		output += this.formatCentralityMap('Degree Centrality', results.degreeCentrality);

		if (this.plugin.settings.enableCloseness) {
			output += this.formatCentralityMap('Closeness Centrality', results.closenesssCentrality);
		}

		if (this.plugin.settings.enableBetweenness) {
			output += this.formatCentralityMap(
				'Betweenness Centrality',
				results.betweennessCentrality
			);
		}

		if (this.plugin.settings.enableEigenvector) {
			output += this.formatCentralityMap(
				'Eigenvector Centrality',
				results.eigenvectorCentrality
			);
		}

		if (this.plugin.settings.enablePageRank) {
			output += this.formatCentralityMap('PageRank', results.pageRank);
		}

		if (this.plugin.settings.enableHarmonic) {
			output += this.formatCentralityMap(
				'Harmonic Centrality',
				results.harmonicCentrality
			);
		}

		if (this.plugin.settings.enableClustering) {
			output += this.formatCentralityMap(
				'Clustering Coefficient',
				results.clusteringCoefficient
			);
		}

		return output;
	}

	/**
	 * Format a single centrality map
	 */
	private formatCentralityMap(name: string, map: Map<string, number>): string {
		let output = `### ${name}\n\n`;
		const sorted = Array.from(map.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 20); // Top 20

		sorted.forEach(([node, value]) => {
			output += `- ${node}: ${value.toFixed(4)}\n`;
		});

		output += '\n';
		return output;
	}

	/**
	 * Export results to a markdown file
	 */
	async exportResults(): Promise<void> {
		const results = await this.analyzeCurrentGraph();
		if (!results) return;

		const content = this.formatResults(results);
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const filename = `SNA-Results-${timestamp}.md`;

		try {
			await this.plugin.app.vault.create(filename, content);
			new Notice(`Results exported to ${filename}`);
		} catch (error) {
			new Notice('Error exporting results: ' + error);
		}
	}
}
