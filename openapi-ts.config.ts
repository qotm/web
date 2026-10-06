import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
	input: 'openapi.json',
	output: {
		format: 'prettier',
		path: 'src/shared/types/api',
		lint: 'eslint'
	},
	exportCore: false,
	client: '@hey-api/client-fetch',
	experimentalParser: true,
	plugins: [
		{
			name: 'zod'
		},
		{
			name: '@hey-api/typescript',
			enums: 'typescript'
		}
	]
});
