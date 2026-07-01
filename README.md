# Obsidian Social Network Analysis Plugin

Obsidian plugin for analyzing the social networks within your knowledge base using graph theory metrics and visualization.

## Features

- **Multiple Centrality Measures**: Degree, Betweenness, Eigenvector, Closeness, PageRank, and Harmonic centrality
- **Clustering Analysis**: Calculate clustering coefficients to identify communities
- **Layout Algorithms**: Force-directed, hierarchical, and circular graph layouts
- **Weighted Links**: Optional link weighting based on mention frequency
- **Directional Analysis**: Analyze backlink direction in your graph
- **Auto-Export**: Automatically export analysis results to markdown files
- **Interactive UI**: View results in a dedicated panel with sortable metrics

## Quick Start

### Clone and Setup (No Manual Configuration)

```bash
# Clone the repository
Navigate to your plugins folder under the current Obsidian Vault. If it does not exist yet, click the file folder icon near "Installed plugins" under the "Community plugins" tab to create the folder and navigate to it.
Open a terminal here and git clone https://github.com/fiddlestix27/Obsidian-SNA.git

That's it! The plugin is ready to use in Obsidian.

## Usage

### Opening the Plugin
- Use the command palette (`Cmd/Ctrl + P`) and search for "Open Social Network Analysis"
- Or use the sidebar icon

### Analyzing Your Graph
1. Open the Graph view in Obsidian (Ctrl/Cmd + G)
2. In the Social Network Analysis panel, click "Analyze Graph"
3. View results for all centrality measures
4. Export results with the "Export Results" button

### Available Commands
- **Open Social Network Analysis**: Open the SNA panel
- **Analyze Current Graph**: Run analysis on your current graph
- **Calculate Centrality Measures**: Compute all centrality metrics
- **Export Analysis Results**: Save results to a markdown file

## Settings

### Graph Analysis Options
- **Enable Directional Analysis**: Consider backlink direction (default: ON)
- **Enable Weighted Links**: Weight edges by mention frequency (default: ON)
- **Enable Clustering**: Calculate clustering coefficients (default: ON)
- **Layout Algorithm**: Choose from force-directed, hierarchical, or circular (default: force-directed)
- **Minimum Link Weight**: Filter links below this threshold (default: 1)
- **Auto-Export Results**: Automatically save results after analysis (default: OFF)

### Individual Metrics
Toggle individual centrality measures on/off:
- Closeness Centrality
- Betweenness Centrality
- Eigenvector Centrality
- PageRank
- Harmonic Centrality

## Centrality Measures Explained

### Degree Centrality
Number of direct connections each node has. Nodes with high degree centrality are hubs in your network.

### Betweenness Centrality
Measures how often a node appears on shortest paths between other nodes. High betweenness indicates a node that bridges different parts of your graph.

### Eigenvector Centrality
Importance based on connections to other important nodes. A node is important if it connects to other important nodes.

### Closeness Centrality
Average distance to all other nodes. Nodes with high closeness are well-integrated into the network.

### PageRank
Probability of reaching a node through random walk. Useful for identifying "hub" notes that many others link to.

### Harmonic Centrality
Sum of reciprocals of distances to all other nodes. A more robust alternative to closeness centrality.

### Clustering Coefficient
Measures how much neighbors of a node are connected. High clustering indicates tight-knit communities.

## System Requirements

- Obsidian 0.15.0 or higher
- Node.js 14+ (for building from source)
- npm or yarn

## Technologies Used

- **esbuild**: Ultra-fast TypeScript/JavaScript bundler
- **TypeScript**: Type-safe development
- **Obsidian API**: Plugin framework
- **Graph Algorithms**: Custom implementations of network analysis algorithms

## Performance

The plugin is optimized for networks up to 5,000+ nodes. For very large graphs, analysis may take several seconds depending on your hardware.

## Troubleshooting

### Plugin won't load
- Ensure manifest.json, main.js, and styles.css are in the plugin folder
- Restart Obsidian
- Check Obsidian console for error messages (Settings → About → Open debug console)

### No graph data found
- Open the Graph view first (Ctrl/Cmd + G)
- Ensure your vault has linked notes
- Try clicking "Analyze Graph" again

### Analysis is slow
- Try reducing the number of enabled metrics in settings
- Close other resource-intensive plugins
- Limit analysis to a subset of your graph if possible

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

GNU GPL v3 License

## Support

For issues, feature requests, or questions:
- Open an issue on [GitHub](https://github.com/fiddlestix27/Obsidian-SNA/issues)

## Changelog

### v1.0.0
- Initial release
- All core centrality measures implemented
- Interactive UI panel
- Settings and customization
- Auto-export functionality

## Roadmap

Future features planned:
- Community detection algorithms
- Interactive graph visualization
- Real-time analysis updates
- Export to multiple formats (JSON, CSV)
- Custom metric definitions
- Performance improvements for large graphs
