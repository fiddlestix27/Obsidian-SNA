import { ItemView, WorkspaceLeaf } from 'obsidian';
import SNAPlugin from '../main';
import { CentralityResults, NormalizationOptions } from '../utils/SNACalculator';

export const VIEW_TYPE_SNA = 'sna-view';

export class SNAView extends ItemView {
	plugin: SNAPlugin;
	currentNormalizationOptions: NormalizationOptions;

	constructor(leaf: WorkspaceLeaf, plugin: SNAPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.currentNormalizationOptions = { ...plugin.settings.normalizationOptions };
	}

	getViewType(): string {
		return VIEW_TYPE_SNA;
	}

	getDisplayText(): string {
		return 'Social Network Analysis';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		const content = container.createDiv({ cls: 'sna-container' });

		// Header
		content.createEl('h1', { text: 'Social Network Analysis' });

		// Description
		content.createEl('p', {
			text: 'Analyze the structure and relationships in your Obsidian graph.',
		});

		// Button container
		const buttonContainer = content.createDiv({ cls: 'button-container' });

		// Analyze button
		const analyzeBtn = buttonContainer.createEl('button', {
			text: 'Analyze Graph',
		});
		analyzeBtn.addEventListener('click', async () => {
			const results = await this.plugin.graphAnalyzer.analyzeCurrentGraph(
				this.currentNormalizationOptions
			);
			if (results) {
				this.displayResults(content, results);
			}
		});

		// Export button
		const exportBtn = buttonContainer.createEl('button', {
			text: 'Export Results',
		});
		exportBtn.addEventListener('click', async () => {
			await this.plugin.graphAnalyzer.exportResults();
		});

		// Normalization toggle section
		const normalizationDiv = content.createDiv({ cls: 'normalization-toggles' });
		normalizationDiv.createEl('h3', { text: 'Normalization Options' });
		normalizationDiv.createEl('p', {
			text: 'Toggle normalization on/off for each metric to compare raw vs normalized values:',
		});

		const togglesContainer = normalizationDiv.createDiv({ cls: 'toggles-grid' });

		// Create toggle for each metric
		const metrics: Array<{ key: keyof NormalizationOptions; label: string }> = [
			{ key: 'degreeCentrality', label: 'Degree Centrality' },
			{ key: 'betweennessCentrality', label: 'Betweenness Centrality' },
			{ key: 'eigenvectorCentrality', label: 'Eigenvector Centrality' },
			{ key: 'closenessCentrality', label: 'Closeness Centrality' },
			{ key: 'pageRank', label: 'PageRank' },
			{ key: 'harmonicCentrality', label: 'Harmonic Centrality' },
			{ key: 'clusteringCoefficient', label: 'Clustering Coefficient' },
		];

		metrics.forEach(({ key, label }) => {
			const toggleDiv = togglesContainer.createDiv({ cls: 'toggle-item' });
			toggleDiv.createEl('label', {
				text: label,
				cls: 'toggle-label',
			});

			const checkbox = toggleDiv.createEl('input', {
				type: 'checkbox',
				cls: 'toggle-checkbox',
			});
			checkbox.checked = this.currentNormalizationOptions[key] ?? true;
			checkbox.addEventListener('change', () => {
				this.currentNormalizationOptions[key] = checkbox.checked;
			});

			const statusSpan = toggleDiv.createEl('span', {
				text: checkbox.checked ? 'Normalized' : 'Raw',
				cls: 'toggle-status',
			});

			checkbox.addEventListener('change', () => {
				statusSpan.textContent = checkbox.checked ? 'Normalized' : 'Raw';
			});
		});

		// Settings info
		const settingsDiv = content.createDiv({ cls: 'settings-info' });
		settingsDiv.createEl('h3', { text: 'Current Settings' });
		const settings = settingsDiv.createEl('ul');
		settings.createEl('li', {
			text: `Directional Analysis: ${
				this.plugin.settings.enableDirectional ? 'Enabled' : 'Disabled'
			}`,
		});
		settings.createEl('li', {
			text: `Weighted Links: ${
				this.plugin.settings.enableWeightedLinks ? 'Enabled' : 'Disabled'
			}`,
		});
		settings.createEl('li', {
			text: `Clustering: ${
				this.plugin.settings.enableClustering ? 'Enabled' : 'Disabled'
			}`,
		});
		settings.createEl('li', {
			text: `Layout Algorithm: ${this.plugin.settings.layoutAlgorithm}`,
		});
	}

	private displayResults(container: HTMLElement, results: CentralityResults) {
		// Remove old results if they exist
		const oldResults = container.querySelector('.results-container');
		if (oldResults) {
			oldResults.remove();
		}

		const resultsDiv = container.createDiv({ cls: 'results-container' });
		resultsDiv.createEl('h2', { text: 'Analysis Results' });

		const tabs = resultsDiv.createDiv({ cls: 'tabs' });

		// Degree Centrality
		this.createResultTab(
			tabs,
			'Degree Centrality',
			results.degreeCentrality
		);

		// Betweenness Centrality
		this.createResultTab(
			tabs,
			'Betweenness Centrality',
			results.betweennessCentrality
		);

		// Eigenvector Centrality
		this.createResultTab(
			tabs,
			'Eigenvector Centrality',
			results.eigenvectorCentrality
		);

		// Closeness Centrality
		this.createResultTab(
			tabs,
			'Closeness Centrality',
			results.closenessCentrality
		);

		// PageRank
		this.createResultTab(tabs, 'PageRank', results.pageRank);

		// Harmonic Centrality
		this.createResultTab(
			tabs,
			'Harmonic Centrality',
			results.harmonicCentrality
		);

		// Clustering Coefficient
		this.createResultTab(
			tabs,
			'Clustering Coefficient',
			results.clusteringCoefficient
		);
	}

	private createResultTab(
		container: HTMLElement,
		title: string,
		data: Map<string, number>
	) {
		const tabDiv = container.createDiv({ cls: 'result-tab' });
		tabDiv.createEl('h3', { text: title });

		const table = tabDiv.createEl('table');
		const header = table.createTHead().insertRow();
		header.insertCell(0).textContent = 'Node';
		header.insertCell(1).textContent = 'Score';

		const sorted = Array.from(data.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 15);

		const tbody = table.createTBody();
		sorted.forEach(([node, value]) => {
			const row = tbody.insertRow();
			row.insertCell(0).textContent = node;
			row.insertCell(1).textContent = value.toFixed(4);
		});
	}

	async onClose() {
		// Cleanup
	}
}
