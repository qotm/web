import { configureStore, type Middleware, type Reducer } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from './base-api';

type MakeStoreOptions = {
	/** App-specific slice reducers (e.g. authSlice, feature UI slices). */
	reducer?: Record<string, Reducer>;
	/** Extra middleware (e.g. the socket middleware). */
	middleware?: Middleware[];
};

/**
 * Create an app store wired with the shared RTK Query API + any app slices.
 * Each app derives its own typed hooks from the returned store, e.g.:
 *   export const useAppDispatch = useDispatch.withTypes<typeof store.dispatch>();
 *   export const useAppSelector = useSelector.withTypes<ReturnType<typeof store.getState>>();
 */
export function makeStore(options: MakeStoreOptions = {}) {
	const store = configureStore({
		reducer: {
			[baseApi.reducerPath]: baseApi.reducer,
			...options.reducer
		},
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
				serializableCheck: {
					// Upload endpoints (see `uploadBaseQuery`) carry a FormData body and an
					// `onProgress` callback in their args. Neither is serializable, and
					// neither is ever persisted or replayed — only read once, in flight.
					ignoredActionPaths: ['meta.arg.originalArgs.body', 'meta.arg.originalArgs.onProgress']
				}
			}).concat(baseApi.middleware, ...(options.middleware ?? []))
	});

	setupListeners(store.dispatch);
	return store;
}

export type AppStore = ReturnType<typeof makeStore>;
