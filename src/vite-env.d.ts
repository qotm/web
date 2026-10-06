/// <reference types="vite/client" />

interface ImportMetaEnv {
	VITE_APP_API_URL: string;
	VITE_APP_ALLOWED_HOSTS: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
