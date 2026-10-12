import { getAuthClient } from '@/shared/auth';

/** A terminal's code as `qotm login` prints it: QTM- and four letters or digits (no I, O, 0 or 1). */
export const USER_CODE = /^QTM-[A-HJ-NP-Z2-9]{4}$/;

/** "qtm 7f3k", "QTM7F3K" or "qtm-7f3k" → "QTM-7F3K"; anything else as typed, upper-cased. */
export function normalizeUserCode(input: string) {
	const raw = input.trim().toUpperCase().replace(/[\s-]/g, '');
	return raw.startsWith('QTM') && raw.length === 7 ? `QTM-${raw.slice(3)}` : input.trim().toUpperCase();
}

export type DeviceState =
	| { kind: 'pending'; userCode: string }
	| { kind: 'approved'; userCode: string }
	| { kind: 'denied'; userCode: string }
	| { kind: 'invalid'; userCode: string }
	| { kind: 'expired'; userCode: string }
	| { kind: 'error'; userCode: string; message?: string };

type ApiError = { error?: string; status?: number; message?: string } | null;

function fromError(userCode: string, error: ApiError): DeviceState {
	const code = (error as { error?: string } | null)?.error ?? '';
	if (code === 'expired_token') return { kind: 'expired', userCode };
	if (code === 'invalid_request' || error?.status === 400) return { kind: 'invalid', userCode };
	return { kind: 'error', userCode, message: error?.message };
}

/**
 * Looks the code up while signed in, which ties it to this member (the API
 * requires that before approving), and reports where it stands.
 */
export async function checkDeviceCode(userCode: string): Promise<DeviceState> {
	const { data, error } = await getAuthClient().device({ query: { user_code: userCode } });
	if (error) return fromError(userCode, error as ApiError);
	const status = (data as { status?: string } | null)?.status;
	if (status === 'approved') return { kind: 'approved', userCode };
	if (status === 'denied') return { kind: 'denied', userCode };
	return { kind: 'pending', userCode };
}

/** Approves or denies the terminal; its next poll gets a token or `access_denied`. */
export async function decideDevice(userCode: string, decision: 'approve' | 'deny'): Promise<DeviceState> {
	const client = getAuthClient();
	const { error } =
		decision === 'approve' ? await client.device.approve({ userCode }) : await client.device.deny({ userCode });
	if (error) return fromError(userCode, error as ApiError);
	return decision === 'approve' ? { kind: 'approved', userCode } : { kind: 'denied', userCode };
}
