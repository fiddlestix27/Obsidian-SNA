import { Node, Edge } from './SNACalculator';

export interface LayoutResult {
	[nodeId: string]: { x: number; y: number };
}

export class LayoutEngine {
	/**
	 * Force-directed layout using Fruchterman-Reingold algorithm
	 */
	forceDirectedLayout(
		nodes: Node[],
		edges: Edge[],
		iterations: number = 100,
		k: number = 5
	): LayoutResult {
		const result: LayoutResult = {};
		const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();

		// Initialize random positions
		nodes.forEach((node) => {
			positions.set(node.id, {
				x: Math.random() * 100,
				y: Math.random() * 100,
				vx: 0,
				vy: 0,
			});
		});

		const width = 100;
		const height = 100;
		const maxDisplacement = Math.sqrt(width * width + height * height) / 10;

		for (let iter = 0; iter < iterations; iter++) {
			const temperature = maxDisplacement * (1 - iter / iterations);

			// Reset forces
			nodes.forEach((node) => {
				const pos = positions.get(node.id)!;
				pos.vx = 0;
				pos.vy = 0;
			});

			// Repulsive forces
			for (let i = 0; i < nodes.length; i++) {
				for (let j = i + 1; j < nodes.length; j++) {
					const pos1 = positions.get(nodes[i].id)!;
					const pos2 = positions.get(nodes[j].id)!;

					const dx = pos2.x - pos1.x;
					const dy = pos2.y - pos1.y;
					const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;

					const force = (k * k) / dist;
					const fx = (dx / dist) * force;
					const fy = (dy / dist) * force;

					pos1.vx -= fx;
					pos1.vy -= fy;
					pos2.vx += fx;
					pos2.vy += fy;
				}
			}

			// Attractive forces
			edges.forEach((edge) => {
				const pos1 = positions.get(edge.source)!;
				const pos2 = positions.get(edge.target)!;

				const dx = pos2.x - pos1.x;
				const dy = pos2.y - pos1.y;
				const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;

				const force = (dist * dist) / k / edge.weight;
				const fx = (dx / dist) * force;
				const fy = (dy / dist) * force;

				pos1.vx += fx;
				pos1.vy += fy;
				pos2.vx -= fx;
				pos2.vy -= fy;
			});

			// Update positions
			nodes.forEach((node) => {
				const pos = positions.get(node.id)!;
				const disp = Math.sqrt(pos.vx * pos.vx + pos.vy * pos.vy);

				if (disp > 0) {
					const delta = Math.min(disp, temperature) / disp;
					pos.x += pos.vx * delta;
					pos.y += pos.vy * delta;

					// Bound to canvas
					pos.x = Math.max(0, Math.min(width, pos.x));
					pos.y = Math.max(0, Math.min(height, pos.y));
				}
			});
		}

		// Convert to result format
		nodes.forEach((node) => {
			const pos = positions.get(node.id)!;
			result[node.id] = { x: pos.x, y: pos.y };
		});

		return result;
	}

	/**
	 * Hierarchical layout (top-down tree-like)
	 */
	hierarchicalLayout(nodes: Node[], edges: Edge[]): LayoutResult {
		const result: LayoutResult = {};

		// Find root nodes (no incoming edges)
		const inDegree = new Map<string, number>();
		nodes.forEach((node) => inDegree.set(node.id, 0));
		edges.forEach((edge) => {
			inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
		});

		const roots = nodes.filter((node) => inDegree.get(node.id) === 0);
		const visited = new Set<string>();
		const levels = new Map<string, number>();

		// BFS to assign levels
		const queue: string[] = [];
		roots.forEach((root) => {
			queue.push(root.id);
			levels.set(root.id, 0);
		});

		while (queue.length > 0) {
			const nodeId = queue.shift()!;
			visited.add(nodeId);

			edges.forEach((edge) => {
				if (edge.source === nodeId && !visited.has(edge.target)) {
					const currentLevel = levels.get(nodeId) || 0;
					levels.set(edge.target, currentLevel + 1);
					queue.push(edge.target);
				}
			});
		}

		// Position nodes by level
		const levelCounts = new Map<number, number>();
		const levelPositions = new Map<number, number>();

		nodes.forEach((node) => {
			const level = levels.get(node.id) || 0;
			levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
		});

		nodes.forEach((node) => {
			const level = levels.get(node.id) || 0;
			const count = levelCounts.get(level) || 1;
			const position = (levelPositions.get(level) || 0) + 1;
			levelPositions.set(level, position);

			const x = (position / count) * 80 + 10;
			const y = level * 20 + 10;

			result[node.id] = { x, y };
		});

		return result;
	}

	/**
	 * Circular layout
	 */
	circularLayout(nodes: Node[]): LayoutResult {
		const result: LayoutResult = {};
		const n = nodes.length;
		const radius = 40;
		const centerX = 50;
		const centerY = 50;

		nodes.forEach((node, index) => {
			const angle = (2 * Math.PI * index) / n;
			const x = centerX + radius * Math.cos(angle);
			const y = centerY + radius * Math.sin(angle);

			result[node.id] = { x, y };
		});

		return result;
	}
}
