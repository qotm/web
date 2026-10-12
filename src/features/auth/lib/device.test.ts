import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => {
	const device = Object.assign(vi.fn(), { approve: vi.fn(), deny: vi.fn() });
	return { device };
});
vi.mock('@/shared/auth', () => ({ getAuthClient: () => client }));

import { USER_CODE, checkDeviceCode, decideDevice, normalizeUserCode } from './device';
import { linkError } from './auth-actions';

beforeEach(() => vi.clearAllMocks());

describe('normalizeUserCode', () => {
	it.each([
		['QTM-7F3K', 'QTM-7F3K'],
		['qtm-7f3k', 'QTM-7F3K'],
		['qtm 7f3k', 'QTM-7F3K'],
		[' QTM7F3K ', 'QTM-7F3K'],
		['hello', 'HELLO']
	])('%s → %s', (input, out) => {
		expect(normalizeUserCode(input)).toBe(out);
	});

	it('matches only the codes the API issues (no I, O, 0 or 1)', () => {
		expect(USER_CODE.test('QTM-7F3K')).toBe(true);
		expect(USER_CODE.test('QTM-7F3I')).toBe(false);
		expect(USER_CODE.test('QTM-7F30')).toBe(false);
	});
});

describe('the device flow', () => {
	it('reads a pending, approved or denied code', async () => {
		client.device.mockResolvedValueOnce({ data: { user_code: 'QTM-7F3K', status: 'pending' }, error: null });
		expect(await checkDeviceCode('QTM-7F3K')).toEqual({ kind: 'pending', userCode: 'QTM-7F3K' });
		client.device.mockResolvedValueOnce({ data: { status: 'approved' }, error: null });
		expect((await checkDeviceCode('QTM-7F3K')).kind).toBe('approved');
		client.device.mockResolvedValueOnce({ data: { status: 'denied' }, error: null });
		expect((await checkDeviceCode('QTM-7F3K')).kind).toBe('denied');
		expect(client.device).toHaveBeenLastCalledWith({ query: { user_code: 'QTM-7F3K' } });
	});

	it('tells an expired code from an unknown one', async () => {
		client.device.mockResolvedValueOnce({ data: null, error: { status: 400, error: 'expired_token' } });
		expect((await checkDeviceCode('QTM-7F3K')).kind).toBe('expired');
		client.device.mockResolvedValueOnce({ data: null, error: { status: 400, error: 'invalid_request' } });
		expect((await checkDeviceCode('QTM-2222')).kind).toBe('invalid');
		client.device.mockResolvedValueOnce({ data: null, error: { status: 500, message: 'down' } });
		expect(await checkDeviceCode('QTM-2222')).toEqual({ kind: 'error', userCode: 'QTM-2222', message: 'down' });
	});

	it('approves or denies', async () => {
		client.device.approve.mockResolvedValueOnce({ data: { success: true }, error: null });
		expect((await decideDevice('QTM-7F3K', 'approve')).kind).toBe('approved');
		expect(client.device.approve).toHaveBeenCalledWith({ userCode: 'QTM-7F3K' });
		client.device.deny.mockResolvedValueOnce({ data: { success: true }, error: null });
		expect((await decideDevice('QTM-7F3K', 'deny')).kind).toBe('denied');
		client.device.approve.mockResolvedValueOnce({ data: null, error: { status: 400, error: 'expired_token' } });
		expect((await decideDevice('QTM-7F3K', 'approve')).kind).toBe('expired');
	});
});

describe('linkError', () => {
	it('explains a used or expired link, and nothing without an error', () => {
		expect(linkError(null)).toBeNull();
		expect(linkError('INVALID_TOKEN')).toMatch(/expired or was already used/);
		expect(linkError('failed_to_create_session')).toMatch(/did not sign you in/);
	});
});
