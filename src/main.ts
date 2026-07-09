import { Plugin, PluginSettingTab, App, Setting } from 'obsidian';
import { SNAView, VIEW_TYPE_SNA } from './views/SNAView';
import { SNACalculator } from './utils/SNACalculator';
import { GraphAnalyzer } from './utils/GraphAnalyzer';
import { SNASettings, DEFAULT_SETTINGS } from './settings';

export default class SNAPlugin extends Plugin {
	settings: SNASettings;
	snaCalculator: SNACalculator;
	graphAnalyzer: GraphAnalyzer;

	async onload() {
		await this.loadSettings();

		this.snaCalculator = new SNACalculator();
		this.graphAnalyzer = new GraphAnalyzer(this, this.snaCalculator);

		// Register view
		this.registerView(VIEW_TYPE_SNA, (leaf) => new SNAView(leaf, this));

		// Add commands
		this.addCommand({
			id: 'open-sna-view',
			name: 'Open',
			callback: () => {
				void this.activateSNAView();
			},
		});

		this.addCommand({
			id: 'analyze-graph',
			name: 'Analyze Graph',
			callback: () => {
				void this.graphAnalyzer.analyzeCurrentGraph();
			},
		});

		this.addCommand({
			id: 'calculate-centrality',
			name: 'Calculate Centrality Measures',
			callback: () => {
				void this.graphAnalyzer.calculateAllCentrality();
			},
		});

		this.addCommand({
			id: 'export-analysis',
			name: 'Export Results',
			callback: () => {
				void this.graphAnalyzer.exportResults();
			},
		});

		// Add settings tab
		this.addSettingTab(new SNASettingTab(this.app, this));
	}

	onunload() {
		// Cleanup
	}

	async loadSettings() {
		const data = (await this.loadData()) as SNASettings | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async activateSNAView() {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_SNA).length > 0
			? workspace.getLeavesOfType(VIEW_TYPE_SNA)[0]
			: workspace.getLeaf(false);

		await leaf.setViewState({
			type: VIEW_TYPE_SNA,
		});

		workspace.revealLeaf(leaf);
	}
}

class SNASettingTab extends PluginSettingTab {
	plugin: SNAPlugin;

	constructor(app: App, plugin: SNAPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Plugin Options')
			.setHeading();

		new Setting(containerEl)
			.setName('Enable Directional Analysis')
			.setDesc('Calculate directional metrics based on backlink direction')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableDirectional)
					.onChange(async (value) => {
						this.plugin.settings.enableDirectional = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Enable Weighted Links')
			.setDesc('Weight links based on number of mentions')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableWeightedLinks)
					.onChange(async (value) => {
						this.plugin.settings.enableWeightedLinks = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Enable Clustering')
			.setDesc('Calculate clustering coefficients')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableClustering)
					.onChange(async (value) => {
						this.plugin.settings.enableClustering = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Layout Algorithm')
			.setDesc('Select graph layout algorithm')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('force-directed', 'Force-Directed')
					.addOption('hierarchical', 'Hierarchical')
					.addOption('circular', 'Circular')
					.setValue(this.plugin.settings.layoutAlgorithm)
					.onChange(async (value: string) => {
						this.plugin.settings.layoutAlgorithm = value as 'force-directed' | 'hierarchical' | 'circular';
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Minimum Link Weight')
			.setDesc('Minimum number of mentions to show a link (when weighted)')
			.addSlider((slider) =>
				slider
					.setLimits(1, 10, 1)
					.setValue(this.plugin.settings.minLinkWeight)
					.onChange(async (value) => {
						this.plugin.settings.minLinkWeight = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Auto-Export Results')
			.setDesc('Automatically export analysis results after calculation')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoExport)
					.onChange(async (value) => {
						this.plugin.settings.autoExport = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Metrics')
			.setHeading();

		new Setting(containerEl)
			.setName('Enable Closeness Centrality')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableCloseness)
					.onChange(async (value) => {
						this.plugin.settings.enableCloseness = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Enable Betweenness Centrality')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableBetweenness)
					.onChange(async (value) => {
						this.plugin.settings.enableBetweenness = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Enable Eigenvector Centrality')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableEigenvector)
					.onChange(async (value) => {
						this.plugin.settings.enableEigenvector = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Enable PageRank')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enablePageRank)
					.onChange(async (value) => {
						this.plugin.settings.enablePageRank = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Enable Harmonic Centrality')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableHarmonic)
					.onChange(async (value) => {
						this.plugin.settings.enableHarmonic = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
