import { useEffect, useState } from 'react';
import { Form, Formik } from 'formik';
import { useSearchParams } from 'react-router';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { useMeQuery } from '@/features/account/api';
import { DeviceCode, SignInAside } from '@/features/auth/components/sign-in-aside';
import {
	USER_CODE,
	checkDeviceCode,
	decideDevice,
	normalizeUserCode,
	type DeviceState
} from '@/features/auth/lib/device';
import { Button, Card, FormField, Notice, PageMeta, Skeleton } from '@/shared/ui';

const codeSchema = z.object({
	code: z.string().trim().transform(normalizeUserCode).pipe(z.string().regex(USER_CODE, 'Codes look like QTM-7F3K'))
});

/** Enter the code by hand: for a terminal that could not open this page itself. */
function CodeForm({ onCode }: { onCode: (code: string) => void }) {
	return (
		<Formik
			initialValues={{ code: '' }}
			validationSchema={toFormikValidationSchema(codeSchema)}
			onSubmit={(values) => onCode(normalizeUserCode(values.code))}
		>
			<Form className="flex flex-col gap-grid" noValidate>
				<FormField
					name="code"
					label="Code from your terminal"
					placeholder="QTM-7F3K"
					autoComplete="off"
					spellCheck={false}
				/>
				<Button type="submit">Continue</Button>
			</Form>
		</Formik>
	);
}

/**
 * Approve a terminal's `qotm login` (artboard SignIn, the device card;
 * BUILD-PLAN gaps 1–2). Behind a session: signing in returns here with the
 * code. Looking the code up ties it to this member; approving gives the
 * terminal its token on its next poll.
 */
export function DeviceRoute() {
	const [params, setParams] = useSearchParams();
	const userCode = params.get('user_code') ? normalizeUserCode(params.get('user_code')!) : null;
	const { data: me } = useMeQuery();
	const [state, setState] = useState<DeviceState | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (!userCode) return;
		let live = true;
		void checkDeviceCode(userCode).then((s) => live && setState(s));
		return () => {
			live = false;
		};
	}, [userCode]);

	const decide = async (decision: 'approve' | 'deny') => {
		if (!userCode) return;
		setBusy(true);
		setState(await decideDevice(userCode, decision));
		setBusy(false);
	};
	const enter = (code: string) => {
		setState(null);
		setParams({ user_code: code });
	};
	const shown = state?.userCode === userCode ? state : null;
	const handle = me ? `@${me.handle}` : 'your account';

	let body: React.ReactNode;
	if (!userCode) {
		body = (
			<>
				<p className="m-0 text-[15px]">
					Enter the code your terminal printed after <code>qotm login</code>.
				</p>
				<CodeForm onCode={enter} />
			</>
		);
	} else if (!shown) {
		body = (
			<div aria-busy="true" aria-label="Checking the code" className="flex flex-col gap-4">
				<Skeleton lines={1} />
				<Skeleton block height={96} />
			</div>
		);
	} else if (shown.kind === 'pending') {
		body = (
			<>
				<p className="m-0 text-[15px]">
					Your terminal is asking to sign in as <b>{handle}</b>. Check that the code matches the one it printed.
				</p>
				<DeviceCode code={userCode} />
				<div className="flex gap-3">
					<Button disabled={busy} onClick={() => void decide('approve')}>
						Approve this device
					</Button>
					<Button variant="quiet" disabled={busy} onClick={() => void decide('deny')}>
						Deny
					</Button>
				</div>
			</>
		);
	} else if (shown.kind === 'approved') {
		body = (
			<Notice title="Approved." role="status">
				Your terminal is signed in as {handle}. Go back to it: it picks this up within a few seconds.
			</Notice>
		);
	} else if (shown.kind === 'denied') {
		body = (
			<Notice tone="attention" title="Denied." role="status">
				The terminal was not signed in. If that was you after all, run <code>qotm login</code> again.
			</Notice>
		);
	} else {
		const message =
			shown.kind === 'expired'
				? 'That code expired: codes last 15 minutes. Run qotm login again for a new one.'
				: shown.kind === 'invalid'
					? 'No terminal is waiting on that code. Check the code your terminal printed.'
					: (shown.kind === 'error' && shown.message) || 'Could not check the code. Try again.';
		body = (
			<>
				<Notice
					tone="attention"
					title={shown.kind === 'expired' ? 'This code has expired.' : 'That code did not work.'}
				>
					{message}
				</Notice>
				<CodeForm onCode={enter} />
			</>
		);
	}

	return (
		<div className="grid grid-cols-2 items-start gap-page py-[72px] narrow:grid-cols-1 narrow:py-section">
			<PageMeta title="Connect your terminal" robots="noindex" />
			<Card label="Connect your terminal">
				<div className="flex flex-col gap-4">{body}</div>
			</Card>
			<SignInAside caption="Started it from the terminal with" />
		</div>
	);
}
