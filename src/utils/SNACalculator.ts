/**
 * SNACalculator: Core calculations for social network analysis metrics
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
	closenesssCentrality: Map<string, number>;
	pageRank: Map<string, number>;
	harmonicCentrality: Map<string, number>;
	clusteringCoefficient: Map<string, number>;
}

export class SNACalculator {
	/**
	 * Calculate degree centrality
	 * Number of connections for each node
	 */
	calculateDegreeCentrality(
		nodes: Node[],
		edges: Edge[],
		directed: boolean = false
	): Map<string, number> {
		const centrality = new Map<string, number>();

		// Initialize all nodes with 0
		nodes.forEach((node) => centrality.set(node.id, 0));

		// Count connections
		edges.forEach((edge) => {
			if (directed) {
				// For directed graphs, count out-degree
				centrality.set(
					edge.source,
					(centrality.get(edge.source) || 0) + edge.weight
				);
				// Also count in-degree
				centrality.set(
					edge.target,
					(centrality.get(edge.target) || 0) + edge.weight
				);
			} else {
				// For undirected, count both directions
				centrality.set(
					edge.source,
					(centrality.get(edge.source) || 0) + edge.weight
				);
				centrality.set(
					edge.target,
					(centrality.get(edge.target) || 0) + edge.weight
				);
			}
		});

		// Normalize (avoid division by zero)
		const maxDegree = Math.max(...Array.from(centrality.values()), 1);
		centrality.forEach((value, key) => {
			centrality.set(key, value / maxDegree);
		});

		return centrality;
	}

	/**
	 * Calculate betweenness centrality using Brandes' algorithm
	 * Measures how often a node appears on shortest paths
	 */
	calculateBetweennessCentrality(
		nodes: Node[],
		edges: Edge[],
		directed: boolean = false
	): Map<string, number> {
		const centrality = new Map<string, number>();
		nodes.forEach((node) => centrality.set(node.id, 0));

		const n = nodes.length;
		const nodeIds = nodes.map((n) => n.id);

		// Build adjacency list
		const adj = new Map<string, string[]>();
		nodeIds.forEach((id) => adj.set(id, []));
		edges.forEach((edge) => {
			if (!adj.get(edge.source)!.includes(edge.target)) {
				adj.get(edge.source)!.push(edge.target);
			}
			if (!directed && !adj.get(edge.target)!.includes(edge.source)) {
				adj.get(edge.target)!.push(edge.source);
			}
		});

		// Brandes' algorithm
		nodeIds.forEach((source) => {
			const stack: string[] = [];
			const paths = new Map<string, number>();
			const dist = new Map<string, number>();

			nodeIds.forEach((v) => {
				paths.set(v, 0);
				dist.set(v, -1);
			});

			paths.set(source, 1);
			dist.set(source, 0);

			const queue = [source];
			let qIndex = 0;

			while (qIndex < queue.length) {
				const v = queue[qIndex++];
				stack.push(v);

				adj.get(v)!.forEach((w) => {
					if (dist.get(w)! < 0) {
						dist.set(w, dist.get(v)! + 1);
						queue.push(w);
					}

					if (dist.get(w) === dist.get(v)! + 1) {
						paths.set(w, paths.get(w)! + paths.get(v)!);
					}
				});
			}

			const delta = new Map<string, number>();
			nodeIds.forEach((v) => delta.set(v, 0));

			while (stack.length > 0) {
				const w = stack.pop()!;
				adj.get(w)!.forEach((v) => {
					if (dist.get(v) === dist.get(w)! + 1) {
						const pathsW = paths.get(w)!;
						if (pathsW > 0) {
							delta.set(
								v,
								delta.get(v)! +
									(paths.get(v)! / pathsW) * (1 + delta.get(w)!)
							);
						}
					}
				});

				if (w !== source) {
					centrality.set(w, centrality.get(w)! + delta.get(w)!);
				}
			}
		});

		// Normalize (avoid division by zero)
		const maxBetweenness = Math.max(...Array.from(centrality.values()), 1);
		centrality.forEach((value, key) => {
			centrality.set(key, value / maxBetweenness);
		});

		return centrality;
	}

	/**
	 * Calculate eigenvector centrality
	 * Importance based on connections to important nodes
	 */
	calculateEigenvectorCentrality(
		nodes: Node[],
		edges: Edge[],
		directed: boolean = false,
		iterations: number = 100
	): Map<string, number> {
		const centrality = new Map<string, number>();
		const nodeIds = nodes.map((n) => n.id);

		// Initialize
		nodeIds.forEach((id) => centrality.set(id, 1 / nodeIds.length));

		// Build adjacency matrix
		const adj = new Map<string, Map<string, number>>();
		nodeIds.forEach((id) => adj.set(id, new Map()));
		nodeIds.forEach((id) => {
			nodeIds.forEach((jd) => adj.get(id)!.set(jd, 0));
		});

		edges.forEach((edge) => {
			adj.get(edge.source)!.set(
				edge.target,
				adj.get(edge.source)!.get(edge.target)! + edge.weight
			);
			if (!directed) {
				adj.get(edge.target)!.set(
					edge.source,
					adj.get(edge.target)!.get(edge.source)! + edge.weight
				);
			}
		});

		// Power iteration
		for (let iter = 0; iter < iterations; iter++) {
			const newCentrality = new Map<string, number>();

			nodeIds.forEach((node) => {
				let sum = 0;
				nodeIds.forEach((other) => {
					sum +=
						(adj.get(node)!.get(other) || 0) *
						(centrality.get(other) || 0);
				});
				newCentrality.set(node, sum);
			});

			// Normalize
			const norm = Math.sqrt(
				nodeIds.reduce((sum, node) => sum + newCentrality.get(node)! ** 2, 0)
			);

			if (norm > 0) {
				nodeIds.forEach((node) => {
					newCentrality.set(node, newCentrality.get(node)! / norm);
				});
			} else {
				// Isolated component - maintain initial value
				nodeIds.forEach((node) => {
					newCentrality.set(node, 1 / nodeIds.length);
				});
			}

			centrality.clear();
			newCentrality.forEach((value, key) => centrality.set(key, value));
		}

		// Normalize to 0-1 (avoid division by zero)
		const maxEigen = Math.max(...Array.from(centrality.values()), 1);
		centrality.forEach((value, key) => {
			centrality.set(key, value / maxEigen);
		});

		return centrality;
	}

	/**
	 * Calculate closeness centrality
	 * Average distance to all other nodes
	 * Uses harmonic mean to handle disconnected nodes
	 */
	calculateClosenessCentrality(
		nodes: Node[],
		edges: Edge[],
		directed: boolean = false
	): Map<string, number> {
		const centrality = new Map<string, number>();
		const nodeIds = nodes.map((n) => n.id);

		// Build adjacency list
		const adj = new Map<string, string[]>();
		nodeIds.forEach((id) => adj.set(id, []));
		edges.forEach((edge) => {
			if (!adj.get(edge.source)!.includes(edge.target)) {
				adj.get(edge.source)!.push(edge.target);
			}
			if (!directed && !adj.get(edge.target)!.includes(edge.source)) {
				adj.get(edge.target)!.push(edge.source);
			}
		});

		// Calculate shortest paths from each node
		nodeIds.forEach((source) => {
			const dist = new Map<string, number>();
			nodeIds.forEach((v) => dist.set(v, Infinity));
			dist.set(source, 0);

			const queue = [source];
			let qIndex = 0;

			while (qIndex < queue.length) {
				const v = queue[qIndex++];
				adj.get(v)!.forEach((w) => {
					if (dist.get(w)! === Infinity) {
						dist.set(w, dist.get(v)! + 1);
						queue.push(w);
					}
				});
			}

			// Use harmonic mean to handle disconnected nodes
			let harmonicSum = 0;
			let reachableCount = 0;
			nodeIds.forEach((node) => {
				if (node !== source) {
					const d = dist.get(node)!;
					if (d !== Infinity) {
						harmonicSum += 1 / d;
						reachableCount++;
					}
				}
			});

			// Even if node is isolated, give it a small score based on reachability
			const closeness = reachableCount > 0 
				? harmonicSum / (nodeIds.length - 1)
				: 0.001; // Small non-zero value for isolated nodes

			centrality.set(source, closeness);
		});

		// Normalize (avoid division by zero)
		const maxCloseness = Math.max(...Array.from(centrality.values()), 1);
		centrality.forEach((value, key) => {
			centrality.set(key, value / maxCloseness);
		});

		return centrality;
	}

	/**
	 * Calculate PageRank
	 * Based on probability of random walk through the graph
	 */
	calculatePageRank(
		nodes: Node[],
		edges: Edge[],
		damping: number = 0.85,
		iterations: number = 100
	): Map<string, number> {
		const pageRank = new Map<string, number>();
		const nodeIds = nodes.map((n) => n.id);
		const n = nodeIds.length;

		// Initialize
		const initialRank = 1 / n;
		nodeIds.forEach((id) => pageRank.set(id, initialRank));

		// Build outgoing edges map
		const outgoing = new Map<string, string[]>();
		const outgoingWeights = new Map<string, number>();
		nodeIds.forEach((id) => outgoing.set(id, []));

		edges.forEach((edge) => {
			if (!outgoing.get(edge.source)!.includes(edge.target)) {
				outgoing.get(edge.source)!.push(edge.target);
			}
			const key = `${edge.source}->${edge.target}`;
			outgoingWeights.set(key, (outgoingWeights.get(key) || 0) + edge.weight);
		});

		// Calculate out-degree
		const outDegree = new Map<string, number>();
		nodeIds.forEach((id) => {
			const degree = outgoing.get(id)!.reduce((sum, target) => {
				return sum + (outgoingWeights.get(`${id}->${target}`) || 1);
			}, 0);
			outDegree.set(id, degree || 1);
		});

		// PageRank iterations
		for (let iter = 0; iter < iterations; iter++) {
			const newPageRank = new Map<string, number>();

			nodeIds.forEach((node) => {
				let rank = (1 - damping) / n;

				// Find incoming edges
				edges.forEach((edge) => {
					if (edge.target === node) {
						const sourceRank = pageRank.get(edge.source) || 0;
						const sourceDegree = outDegree.get(edge.source) || 1;
						rank += damping * (sourceRank / sourceDegree) * edge.weight;
					}
				});

				newPageRank.set(node, rank);
			});

			pageRank.clear();
			newPageRank.forEach((value, key) => pageRank.set(key, value));
		}

		return pageRank;
	}

	/**
	 * Calculate harmonic centrality
	 * Sum of reciprocals of distances
	 * Handles disconnected nodes gracefully
	 */
	calculateHarmonicCentrality(
		nodes: Node[],
		edges: Edge[],
		directed: boolean = false
	): Map<string, number> {
		const centrality = new Map<string, number>();
		const nodeIds = nodes.map((n) => n.id);

		// Build adjacency list
		const adj = new Map<string, string[]>();
		nodeIds.forEach((id) => adj.set(id, []));
		edges.forEach((edge) => {
			if (!adj.get(edge.source)!.includes(edge.target)) {
				adj.get(edge.source)!.push(edge.target);
			}
			if (!directed && !adj.get(edge.target)!.includes(edge.source)) {
				adj.get(edge.target)!.push(edge.source);
			}
		});

		// Calculate harmonic centrality from each node
		nodeIds.forEach((source) => {
			const dist = new Map<string, number>();
			nodeIds.forEach((v) => dist.set(v, Infinity));
			dist.set(source, 0);

			const queue = [source];
			let qIndex = 0;

			while (qIndex < queue.length) {
				const v = queue[qIndex++];
				adj.get(v)!.forEach((w) => {
					if (dist.get(w)! === Infinity) {
						dist.set(w, dist.get(v)! + 1);
						queue.push(w);
					}
				});
			}

			let harmonic = 0;
			let reachableCount = 0;
			nodeIds.forEach((node) => {
				if (node !== source) {
					const d = dist.get(node)!;
					if (d !== Infinity) {
						harmonic += 1 / d;
						reachableCount++;
					}
				}
			});

			// Normalize by reachable nodes to handle disconnected components
			const result = reachableCount > 0 
				? harmonic / reachableCount
				: 0.001; // Small non-zero value for isolated nodes

			centrality.set(source, result);
		});

		// Normalize (avoid division by zero)
		const maxHarmonic = Math.max(...Array.from(centrality.values()), 1);
		centrality.forEach((value, key) => {
			centrality.set(key, value / maxHarmonic);
		});

		return centrality;
	}

	/**
	 * Calculate clustering coefficient
	 * Measures how much neighbors of a node are connected
	 */
	calculateClusteringCoefficient(
		nodes: Node[],
		edges: Edge[]
	): Map<string, number> {
		const clustering = new Map<string, number>();
		const nodeIds = nodes.map((n) => n.id);

		// Build adjacency set for quick lookup
		const adj = new Map<string, Set<string>>();
		nodeIds.forEach((id) => adj.set(id, new Set()));
		edges.forEach((edge) => {
			adj.get(edge.source)!.add(edge.target);
			adj.get(edge.target)!.add(edge.source);
		});

		// Calculate clustering coefficient for each node
		nodeIds.forEach((node) => {
			const neighbors = Array.from(adj.get(node)!);
			const k = neighbors.length;

			if (k < 2) {
				// Node with 0 or 1 connection: clustering is 0
				clustering.set(node, 0);
			} else {
				let edgeCount = 0;
				for (let i = 0; i < neighbors.length; i++) {
					for (let j = i + 1; j < neighbors.length; j++) {
						if (
							adj.get(neighbors[i])!.has(neighbors[j]) ||
							adj.get(neighbors[j])!.has(neighbors[i])
						) {
							edgeCount++;
						}
					}
				}
				const maxPossibleEdges = (k * (k - 1)) / 2;
				clustering.set(node, maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0);
			}
		});

		return clustering;
	}

	/**
	 * Calculate all centrality metrics at once
	 */
	calculateAllCentrality(
		nodes: Node[],
		edges: Edge[],
		directed: boolean = false
	): CentralityResults {
		return {
			degreeCentrality: this.calculateDegreeCentrality(nodes, edges, directed),
			betweennessCentrality: this.calculateBetweennessCentrality(
				nodes,
				edges,
				directed
			),
			eigenvectorCentrality: this.calculateEigenvectorCentrality(
				nodes,
				edges,
				directed
			),
			closenesssCentrality: this.calculateClosenessCentrality(
				nodes,
				edges,
				directed
			),
			pageRank: this.calculatePageRank(nodes, edges),
			harmonicCentrality: this.calculateHarmonicCentrality(
				nodes,
				edges,
				directed
			),
			clusteringCoefficient: this.calculateClusteringCoefficient(nodes, edges),
		};
	}
}
