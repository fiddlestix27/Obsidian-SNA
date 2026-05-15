export interface SNASettings {
	enableDirectional: boolean;
	enableWeightedLinks: boolean;
	enableClustering: boolean;
	layoutAlgorithm: 'force-directed' | 'hierarchical' | 'circular';
	minLinkWeight: number;
	autoExport: boolean;
	enableCloseness: boolean;
	enableBetweenness: boolean;
	enableEigenvector: boolean;
	enablePageRank: boolean;
	enableHarmonic: boolean;
}

export const DEFAULT_SETTINGS: SNASettings = {
	enableDirectional: true,
	enableWeightedLinks: true,
	enableClustering: true,
	layoutAlgorithm: 'force-directed',
	minLinkWeight: 1,
	autoExport: false,
	enableCloseness: true,
	enableBetweenness: true,
	enableEigenvector: true,
	enablePageRank: true,
	enableHarmonic: true,
};
