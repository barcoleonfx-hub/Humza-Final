export const appParams = {
	appId: 'mock-app-id',
	token: null,
	fromUrl: typeof window !== 'undefined' ? window.location.href : '',
	functionsVersion: 'v1',
	appBaseUrl: typeof window !== 'undefined' ? window.location.origin : ''
};
