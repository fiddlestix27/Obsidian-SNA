
/**
 * Optimized SNACalculator: Core calculations for social network analysis metrics
 * With support for normalization toggle for each centrality measure
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

export interface NormalizationOptions {
	degreeCentrality?: boolean;
	betweennessCentrality?: boolean;
	eigenvectorCentrality?: boolean;
	closenessCentrality?: boolean;
	pageRank?: boolean;
	harmonicCentrality?: boolean;
	clusteringCoefficient?: boolean;
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
		directed: boolean = false,
		normalizationOptions?: NormalizationOptions
	): CentralityResults {

		if (!nodes.length) {
			throw new Error("No nodes supplied for centrality analysis");
		}

		const adjacency = this.buildAdjacency(nodes, edges, directed);

		// Default normalization options: normalize metrics that are typically normalized in industry standards
		const options: NormalizationOptions = {
			degreeCentrality: normalizationOptions?.degreeCentrality ?? false,
			betweennessCentrality: normalizationOptions?.betweennessCentrality ?? true,
			eigenvectorCentrality: normalizationOptions?.eigenvectorCentrality ?? false,
			closenessCentrality: normalizationOptions?.closenessCentrality ?? true,
			pageRank: normalizationOptions?.pageRank ?? false,
			harmonicCentrality: normalizationOptions?.harmonicCentrality ?? false,
			clusteringCoefficient: normalizationOptions?.clusteringCoefficient ?? true,
		};

		return {
			degreeCentrality: this.calculateDegreeCentrality(nodes, edges, directed, options.degreeCentrality),
			betweennessCentrality: this.calculateBetweennessCentrality(nodes, adjacency, directed, options.betweennessCentrality),
			eigenvectorCentrality: this.calculateEigenvectorCentrality(nodes, edges, directed, options.eigenvectorCentrality),
			closenessCentrality: this.calculateClosenessCentrality(nodes, adjacency, options.closenessCentrality),
			pageRank: this.calculatePageRank(nodes, edges, directed, options.pageRank),
			harmonicCentrality: this.calculateHarmonicCentrality(nodes, adjacency, options.harmonicCentrality),
			clusteringCoefficient: this.calculateClusteringCoefficient(nodes, adjacency, directed),
		};
	}

	calculateDegreeCentrality(
		nodes: Node[],
		edges: Edge[],
		directed: boolean = false,
		normalize: boolean = true
	): Map<string, number> {

		const centrality = new Map<string, number>();
		nodes.forEach((node) => centrality.set(node.id, 0));

		edges.forEach((edge) => {
			centrality.set(
				edge.source,
				(centrality.get(edge.source) || 0) + edge.weight
			);

			if (!directed) {
				centrality.set(
					edge.target,
					(centrality.get(edge.target) || 0) + edge.weight
				);
			}
		});

		if (normalize) {
			const maxDegree = Math.max(...Array.from(centrality.values()), 1);

			centrality.forEach((value, key) => {
				centrality.set(key, value / maxDegree);
			});
		}

		return centrality;
	}

	calculateBetweennessCentrality(
		nodes: Node[],
		adj: Map<string, Set<string>>,
		directed: boolean = false,
		normalize: boolean = false
	): Map<string, number> {

		const centrality = new Map<string, number>();
		const nodeIds = nodes.map((n) => n.id);

		nodeIds.forEach((id) => centrality.set(id, 0));

		for (const source of nodeIds) {

			const stack: string[] = [];
			const predecessors = new Map<string, string[]>();
			const sigma = new Map<string, number>();
			const dist = new Map<string, number>();

			nodeIds.forEach((v) => {
				predecessors.set(v, []);
				sigma.set(v, 0);
				dist.set(v, -1);
			});

			sigma.set(source, 1);
			dist.set(source, 0);

			const queue: string[] = [source];

			while (queue.length > 0) {

				const v = queue.shift()!;
				stack.push(v);

				for (const w of adj.get(v) || []) {

					if (dist.get(w)! < 0) {
						queue.push(w);
						dist.set(w, dist.get(v)! + 1);
					}

					if (dist.get(w) === dist.get(v)! + 1) {
						sigma.set(w, sigma.get(w)! + sigma.get(v)!);
						predecessors.get(w)!.push(v);
					}
				}
			}

			const delta = new Map<string, number>();
			nodeIds.forEach((v) => delta.set(v, 0));

			while (stack.length > 0) {

				const w = stack.pop()!;

				for (const v of predecessors.get(w) || []) {

					const sigmaW = sigma.get(w)!;

					if (sigmaW !== 0) {
						const contribution =
							(sigma.get(v)! / sigmaW) * (1 + delta.get(w)!);

						delta.set(v, delta.get(v)! + contribution);
					}
				}

				if (w !== source) {
					centrality.set(
						w,
						centrality.get(w)! + delta.get(w)!
					);
				}
			}
		}

		// For undirected graphs, divide by 2 (each path counted twice)
		if (!directed) {
			centrality.forEach((value, key) => {
				centrality.set(key, value / 2);
			});
		}

		if (normalize) {
			const maxVal = Math.max(...Array.from(centrality.values()), 1);

			centrality.forEach((value, key) => {
				centrality.set(key, value / maxVal);
			});
		}

		return centrality;
	}

	calculateEigenvectorCentrality(
		nodes: Node[],
		edges: Edge[],
		directed: boolean = false,
		normalize: boolean = false
	): Map<string, number> {

		const nodeIds = nodes.map((n) => n.id);
		const adjacency = new Map<string, Map<string, number>>();

		nodeIds.forEach((id) => adjacency.set(id, new Map()));

		edges.forEach((edge) => {

			const sourceMap = adjacency.get(edge.source)!;

			sourceMap.set(
				edge.target,
				(sourceMap.get(edge.target) || 0) + edge.weight
			);

			if (!directed) {

				const targetMap = adjacency.get(edge.target)!;

				targetMap.set(
					edge.source,
					(targetMap.get(edge.source) || 0) + edge.weight
				);
			}
		});

		const centrality = new Map<string, number>();

		nodeIds.forEach((id) => {
			centrality.set(id, 1 / nodeIds.length);
		});

		// Store raw values before any normalization
		const rawValues = new Map<string, number>();

		for (let iter = 0; iter < MAX_ITERATIONS; iter++) {

			const next = new Map<string, number>();
			let norm = 0;

			for (const node of nodeIds) {

				let score = 0;

				for (const [neighbor, weight] of adjacency.get(node) || []) {
					score += weight * (centrality.get(neighbor) || 0);
				}

				next.set(node, score);
				norm += score * score;
			}

			norm = Math.sqrt(norm) || 1;

			let maxDiff = 0;

			for (const node of nodeIds) {

				const normalized = (next.get(node) || 0) / norm;

				maxDiff = Math.max(
					maxDiff,
					Math.abs(normalized - (centrality.get(node) || 0))
				);

				centrality.set(node, normalized);
			}

			if (maxDiff < CONVERGENCE_THRESHOLD) {
				break;
			}
		}

		// Store the converged values
		centrality.forEach((value, key) => {
			rawValues.set(key, value);
		});

		if (normalize) {
			const maxVal = Math.max(...Array.from(rawValues.values()), 1);

			rawValues.forEach((value, key) => {
				centrality.set(key, value / maxVal);
			});
		}

		return centrality;
	}

	calculateClosenessCentrality(
		nodes: Node[],
		adj: Map<string, Set<string>>,
		normalize: boolean = true
	): Map<string, number> {

		const centrality = new Map<string, number>();

		for (const node of nodes) {

			const dist = this.bfsDistances(node.id, adj);

			let totalDist = 0;

			dist.forEach((d) => {
				totalDist += d;
			});

			centrality.set(
				node.id,
				totalDist > 0 ? (dist.size - 1) / totalDist : 0
			);
		}

		if (normalize) {
			const maxVal = Math.max(...Array.from(centrality.values()), 1);

			centrality.forEach((value, key) => {
				centrality.set(key, value / maxVal);
			});
		}

		return centrality;
	}

	calculatePageRank(
		nodes: Node[],
		edges: Edge[],
		directed: boolean = false,
		normalize: boolean = false
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

		if (normalize) {
			const maxVal = Math.max(...Array.from(pageRank.values()), 1);

			pageRank.forEach((value, key) => {
				pageRank.set(key, value / maxVal);
			});
		}

		return pageRank;
	}

	calculateHarmonicCentrality(
		nodes: Node[],
		adj: Map<string, Set<string>>,
		normalize: boolean = false
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

		if (normalize) {
			const maxVal = Math.max(...Array.from(centrality.values()), 1);

			centrality.forEach((value, key) => {
				centrality.set(key, value / maxVal);
			});
		}

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

		// Clustering coefficient always returns normalized 0-1
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
