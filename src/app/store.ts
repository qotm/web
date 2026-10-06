import { makeStore } from '@/shared/api';
import { authReducer } from '@/shared/auth';
import { useDispatch, useSelector } from 'react-redux';

/**
 * The one store. `makeStore` wires the shared RTK Query `baseApi`; slices are
 * added here. Feature endpoint slices do *not* register themselves — they extend
 * `baseApi` via `injectEndpoints`, which needs no change in this file.
 */
export const store = makeStore({
	reducer: {
		auth: authReducer
	}
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
