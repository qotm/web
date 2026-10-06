import 'dotenv/config';
import ti from 'tiny-invariant';
import axios from 'axios';
import fs from 'fs/promises';

const loadSchema = async () => {
	const apiDocUrl = process.env.API_DOC_URL;
	const username = process.env.API_DOC_USER;
	const password = process.env.API_DOC_PASSWORD;

	ti(apiDocUrl, 'API_DOC_URL is required');
	ti(username, 'API_DOC_USER is required');
	ti(password, 'API_DOC_PASSWORD is required');

	const response = await axios.get(apiDocUrl, {
		auth: {
			username,
			password
		}
	});

	return response.data;
};

(async () => {
	const schema = await loadSchema();
	await fs.writeFile('openapi.json', JSON.stringify(schema), 'utf-8');
	console.log('💾 Wrote openapi.json');
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
