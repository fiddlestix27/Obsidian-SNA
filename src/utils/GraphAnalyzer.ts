import { App, Notice } from 'obsidian';
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
	 * Extract graph data from Obsidian's graph view
	 */
	extractGraphData(): { nodes: Node[]; edges: Edge[] } | null {
		try {
			const graphLeaves = (this.plugin.app.workspace as any).getLeavesOfType('graph');
			if (!graphLeaves || graphLeaves.length === 0) {
				new Notice('No graph view found. Please open the graph view first.');
				return null;
			}

			const graphView = graphLeaves[0];
			const state = (graphView as any).view?.state;
			const data = (graphView as any).view?.data;

			if (!data || !data.nodes || !data.links) {
				new Notice('Unable to extract graph data.');
				return null;
			}

			// Convert Obsidian graph format to our format
			const nodes: Node[] = data.nodes.map((node: any) => ({
				id: node.id,
				label: node.label || node.id,
			}));

			const edges: Edge[] = data.links.map((link: any) => ({
				source: link.source.id || link.source,
				target: link.target.id || link.target,
				weight: this.calculateLinkWeight(link),
				directed: link.directed !== false,
			}));

			return { nodes, edges };
		} catch (error) {
			new Notice('Error extracting graph data: ' + error);
			return null;
		}
	}

	/**
	 * Calculate weight of a link based on mentions
	 */
	private calculateLinkWeight(link: any): number {
		if (this.plugin.settings.enableWeightedLinks) {
			try {
				const sourceId = link.source.id || link.source;
				const targetId = link.target.id || link.target;
				
				// Try to get file content
				const file = this.plugin.app.vault.getAbstractFileByPath(sourceId);
				if (file && (file as any).vault) {
					const content = (file as any).content || '';
					const targetName = targetId.split('/').pop();
					const regex = new RegExp(`\\[\\[${targetName}`, 'g');
					const matches = content.match(regex);
					return Math.max(1, matches ? matches.length : 1);
				}
			} catch (error) {
				// Fall back to default weight
			}
		}
		return 1;
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
		const filteredEdges = this.filterEdgesByWeight(
			edges,
			this.plugin.settings.minLinkWeight
		);

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
		output += this.formatCentralityMap(
			'Betweenness Centrality',
			results.betweennessCentrality
		);
		output += this.formatCentralityMap(
			'Eigenvector Centrality',
			results.eigenvectorCentrality
		);
		output += this.formatCentralityMap(
			'Closeness Centrality',
			results.closenesssCentrality
		);
		output += this.formatCentralityMap('PageRank', results.pageRank);
		output += this.formatCentralityMap(
			'Harmonic Centrality',
			results.harmonicCentrality
		);
		output += this.formatCentralityMap(
			'Clustering Coefficient',
			results.clusteringCoefficient
		);

		return output;
	}

	/**
	 * Format a single centrality map
	 */
	private formatCentralityMap(name: string, map: Map<string, number>): string {
		let output = `### ${name}\n\n`;
		const sorted = Array.from(map.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10); // Top 10

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
