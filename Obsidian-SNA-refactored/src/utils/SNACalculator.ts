
/**
 * Optimized SNACalculator: Core calculations for social network analysis metrics
 */

export interface Node {
	id: string;
	label: string;
}

export interface Edge {
	source: string;
	target: string;
	weight: number;
	directed: boolean;
}

export interface CentralityResults {
	degreeCentrality: Map<string, number>;
	betweennessCentrality: Map<string, number>;
	eigenvectorCentrality: Map<string, number>;
	closenessCentrality: Map<string, number>;
	pageRank: Map<string, number>;
	harmonicCentrality: Map<string, number>;
	clusteringCoefficient: Map<string, number>;
}

const MAX_ITERATIONS = 100;
const CONVERGENCE_THRESHOLD = 1e-6;
const PAGERANK_DAMPING = 0.85;

export class SNACalculator {

	private buildAdjacency(
		nodes: Node[],
		edges: Edge[],
		directed: boolean
	): Map<string, Set<string>> {
		const adj = new Map<string, Set<string>>();

		nodes.forEach((node) => adj.set(node.id, new Set()));

		edges.forEach((edge) => {
			adj.get(edge.source)?.add(edge.target);

			if (!directed) {
				adj.get(edge.target)?.add(edge.source);
			}
		});

		return adj;
	}

	calculateAllCentrality(
		nodes: Node[],
		edges: Edge[],
		directed: boolean = false
	): CentralityResults {

		if (!nodes.length) {
			throw new Error("No nodes supplied for centrality analysis");
		}

		const adjacency = this.buildAdjacency(nodes, edges, directed);

		return {
			degreeCentrality: this.calculateDegreeCentrality(nodes, edges, directed),
			betweennessCentrality: this.calculateBetweennessCentrality(nodes, adjacency),
			eigenvectorCentrality: this.calculateEigenvectorCentrality(nodes, edges, directed),
			closenessCentrality: this.calculateClosenessCentrality(
		nodes: Node[],
		adj: Map<string, Set<string>>
	): Map<string, number> {

		const centrality = new Map<string, number>();

		for (const node of nodes) {
			const dist = this.bfsDistances(node.id, adj);
			let score = 0;
			dist.forEach((d,key)=> {
				if(key!==node.id && d>0){ score += 1/d; }
			});
			centrality.set(node.id, score);
		}
		return centrality;
	}

	calculatePageRank(
		nodes: Node[],
		edges: Edge[],
		directed: boolean = false
	): Map<string, number> {

		const nodeIds = nodes.map((n) => n.id);
		const n = nodeIds.length;

		const pageRank = new Map<string, number>();
		const outDegree = new Map<string, number>();
		const incoming = new Map<string, Array<{source: string, weight: number}>>();

		nodeIds.forEach((id) => {
			pageRank.set(id, 1 / n);
			outDegree.set(id, 0);
			incoming.set(id, []);
		});

		edges.forEach((edge) => {

			outDegree.set(
				edge.source,
				(outDegree.get(edge.source) || 0) + edge.weight
			);

			incoming.get(edge.target)?.push({
				source: edge.source,
				weight: edge.weight,
			});

			if (!directed) {

				outDegree.set(
					edge.target,
					(outDegree.get(edge.target) || 0) + edge.weight
				);

				incoming.get(edge.source)?.push({
					source: edge.target,
					weight: edge.weight,
				});
			}
		});

		for (let iter = 0; iter < MAX_ITERATIONS; iter++) {

			const next = new Map<string, number>();
			let maxDiff = 0;

			for (const node of nodeIds) {

				let rank = (1 - PAGERANK_DAMPING) / n;

				for (const edge of incoming.get(node) || []) {

					const sourceRank = pageRank.get(edge.source) || 0;
					const degree = outDegree.get(edge.source) || 1;

					rank +=
						PAGERANK_DAMPING *
						(sourceRank / degree) *
						edge.weight;
				}

				next.set(node, rank);

				maxDiff = Math.max(
					maxDiff,
					Math.abs(rank - (pageRank.get(node) || 0))
				);
			}

			next.forEach((value, key) => {
				pageRank.set(key, value);
			});

			if (maxDiff < CONVERGENCE_THRESHOLD) {
				break;
			}
		}

		const maxVal = Math.max(...Array.from(pageRank.values()), 1);

		pageRank.forEach((value, key) => {
			pageRank.set(key, value / maxVal);
		});

		return pageRank;
	}

	calculateHarmonicCentrality(
		nodes: Node[],
		adj: Map<string, Set<string>>
	): Map<string, number> {

		const centrality = new Map<string, number>();

		for (const node of nodes) {

			const dist = this.bfsDistances(node.id, adj);

			let score = 0;

			dist.forEach((d, key) => {
				if (key !== node.id && d > 0) {
					score += 1 / d;
				}
			});

			centrality.set(node.id, score);
		}

		const maxVal = Math.max(...Array.from(centrality.values()), 1);

		centrality.forEach((value, key) => {
			centrality.set(key, value / maxVal);
		});

		return centrality;
	}

	calculateClusteringCoefficient(
		nodes: Node[],
		adj: Map<string, Set<string>>,
		directed: boolean = false
	): Map<string, number> {

		const coefficients = new Map<string, number>();

		for (const node of nodes) {

			const neighbors = Array.from(adj.get(node.id) || []);

			const k = neighbors.length;

			if (k < 2) {
				coefficients.set(node.id, 0);
				continue;
			}

			let links = 0;

			for (let i = 0; i < neighbors.length; i++) {
				for (let j = i + 1; j < neighbors.length; j++) {

					const ni = neighbors[i];
					const nj = neighbors[j];

					if (adj.get(ni)?.has(nj)) {
						links++;
					}

					if (directed && adj.get(nj)?.has(ni)) {
						links++;
					}
				}
			}

			const possible = directed ? k * (k - 1) : (k * (k - 1)) / 2;

			coefficients.set(node.id, possible > 0 ? links / possible : 0);
		}

		return coefficients;
	}

	private bfsDistances(
		source: string,
		adj: Map<string, Set<string>>
	): Map<string, number> {

		const dist = new Map<string, number>();
		const queue: string[] = [source];

		dist.set(source, 0);

		while (queue.length > 0) {

			const current = queue.shift()!;

			for (const neighbor of adj.get(current) || []) {

				if (!dist.has(neighbor)) {

					dist.set(
						neighbor,
						dist.get(current)! + 1
					);

					queue.push(neighbor);
				}
			}
		}

		return dist;
	}
}
