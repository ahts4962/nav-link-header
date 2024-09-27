export default {
	extensionsToTreatAsEsm: [".ts"],
	moduleNameMapper: {
		"^src/(.+)$": "<rootDir>/src/$1",
		obsidian: "<rootDir>/test/mock/obsidian.ts",
	},
	testEnvironment: "node",
	transform: {
		"^.+.tsx?$": ["ts-jest", { useESM: true }],
	},
};
