import { useState } from 'react';
import { Form, Formik } from 'formik';
import { useNavigate } from 'react-router';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { signOut } from '@/shared/auth';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import type { DeviceEntity } from '@/shared/types';
import {
	Button,
	CommandBlock,
	DataTable,
	Dialog,
	Field,
	FormField,
	FormSwitch,
	FormTextarea,
	Input,
	Notice,
	PageMeta,
	SideNav,
	notify
} from '@/shared/ui';
import {
	useDeleteMeMutation,
	useDevicesQuery,
	useMeQuery,
	useRevokeDeviceMutation,
	useUpdateMeMutation
} from '@/features/account/api';
import {
	lastSync,
	profileChanges,
	profileSchema,
	profileValues,
	type ProfileValues
} from '@/features/account/lib/settings';

const SECTIONS = [
	{ id: 'profile', label: 'Profile' },
	{ id: 'privacy', label: 'Privacy and email' },
	{ id: 'terminals', label: 'Terminals' },
	{ id: 'delete', label: 'Delete account' }
];

const day = (iso: string) => iso.slice(0, 10);
const scrollTo = (id: string) =>
	document.getElementById(`settings-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

function Terminals() {
	const { data, isLoading, isError, refetch } = useDevicesQuery();
	const [revoke] = useRevokeDeviceMutation();
	if (isLoading) return <PageSkeleton />;
	if (isError || !data)
		return (
			<StateScreen compact title="Your terminals did not load." description="Check your connection and try again.">
				<Button variant="outline" onClick={() => void refetch()}>
					Try again
				</Button>
			</StateScreen>
		);
	const active = data.list.filter((d) => !d.revokedAt);
	if (!active.length)
		return (
			<Empty
				title="No terminals signed in."
				description="Run qotm login on a machine to sync your account there."
				command="qotm login"
			/>
		);
	return (
		<DataTable<DeviceEntity>
			dense
			label="Terminals"
			rowKey={(d) => d.id}
			rows={active}
			columns={[
				{
					key: 'label',
					label: 'device',
					render: (d) => (
						<>
							{d.label}
							{d.current ? ' (this one)' : ''}
						</>
					)
				},
				{ key: 'authorizedAt', label: 'authorized', mono: true, render: (d) => day(d.authorizedAt) },
				{ key: 'lastSyncAt', label: 'last sync', mono: true, render: (d) => lastSync(d.lastSyncAt) },
				{ key: 'datasetVersion', label: 'dataset', mono: true, render: (d) => d.datasetVersion ?? '—' },
				{
					key: 'revoke',
					label: '',
					align: 'right',
					render: (d) => (
						<Button
							variant="quiet"
							size="sm"
							aria-label={`Revoke ${d.label}`}
							onClick={() =>
								void revoke(d.id)
									.unwrap()
									.then(() => notify(`${d.label} revoked. Its quotes stay on it; it stops syncing.`))
									.catch(() => notify('That did not revoke. Try again.'))
							}
						>
							Revoke
						</Button>
					)
				}
			]}
		/>
	);
}

function DeleteAccount({ handle }: { handle: string }) {
	const [open, setOpen] = useState(false);
	const [typed, setTyped] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [remove, { isLoading }] = useDeleteMeMutation();
	const navigate = useNavigate();
	const matches = typed.trim().replace(/^@/, '').toLowerCase() === handle;
	return (
		<>
			<Button variant="danger" onClick={() => setOpen(true)}>
				Delete account
			</Button>
			<Dialog
				open={open}
				onClose={() => setOpen(false)}
				role="alertdialog"
				width={480}
				title="Delete your account?"
				description="Your private quotes are deleted. Public contributions stay, credited to “a former member”. This cannot be undone."
				footer={
					<>
						<Button variant="quiet" onClick={() => setOpen(false)}>
							Keep my account
						</Button>
						<Button
							variant="danger"
							disabled={!matches || isLoading}
							onClick={async () => {
								setError(null);
								const res = await remove({ confirm: typed.trim() });
								if ('error' in res) {
									const status = (res.error as { status?: number }).status;
									return setError(
										status === 409 ? 'This account cannot be deleted.' : 'It was not deleted. Try again.'
									);
								}
								// Leave the guarded page first, or the sign-out sends it to /login.
								navigate('/', { replace: true });
								notify('Your account was deleted.');
								await signOut().catch(() => undefined);
							}}
						>
							Delete account
						</Button>
					</>
				}
			>
				{error ? <Notice tone="attention">{error}</Notice> : null}
				<Field label={`Type @${handle} to confirm`} htmlFor="delete-confirm">
					<Input id="delete-confirm" mono autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
				</Field>
			</Dialog>
		</>
	);
}

/**
 * Settings (artboard Settings): the profile (name, handle, bio, email),
 * privacy and email switches, the terminals signed in with `qotm login` with
 * revoke, and deleting the account. The SideNav jumps between sections.
 */
export function SettingsRoute() {
	const { data: me, isLoading, isError, refetch } = useMeQuery();
	const [update] = useUpdateMeMutation();
	const [active, setActive] = useState('profile');

	if (isLoading)
		return (
			<div className="py-page">
				<PageSkeleton />
			</div>
		);
	if (isError || !me)
		return (
			<div className="py-section">
				<StateScreen compact title="Your settings did not load." description="Check your connection and try again.">
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				</StateScreen>
			</div>
		);

	const initial = profileValues(me);
	const section = 'flex flex-col gap-stack border-t border-border pt-7';

	return (
		<div className="grid grid-cols-[240px_minmax(0,1fr)] gap-12 pt-10 pb-14 narrow:grid-cols-1 narrow:gap-card-y">
			<PageMeta title="Settings" robots="noindex" />
			<SideNav
				aria-label="Settings"
				sections={[{ items: SECTIONS }]}
				active={active}
				onSelect={(id) => {
					setActive(id);
					scrollTo(id);
				}}
				className="narrow:w-full"
			/>
			<Formik<ProfileValues>
				initialValues={initial}
				enableReinitialize
				validationSchema={toFormikValidationSchema(profileSchema)}
				onSubmit={async (v, helpers) => {
					const body = profileChanges(me, v);
					if (!Object.keys(body).length) return notify('Nothing to save.');
					const res = await update(body);
					helpers.setSubmitting(false);
					if ('error' in res) {
						const err = res.error as { status?: number; data?: { message?: unknown } };
						if (err.status === 409) return helpers.setFieldError('handle', 'That username is taken.');
						const m = typeof err.data?.message === 'string' ? /^Validation: (\w+): (.+)$/.exec(err.data.message) : null;
						if (m && m[1] in initial) return helpers.setFieldError(m[1], m[2]);
						return notify('Your changes were not saved. Try again.');
					}
					notify(body.handle ? 'Saved. Your old links still work.' : 'Saved.');
				}}
			>
				{({ isSubmitting, dirty, resetForm }) => (
					<Form noValidate className="flex max-w-[720px] flex-col gap-page">
						<h1 className="m-0 text-h1">Settings.</h1>
						<section id="settings-profile" aria-labelledby="h-profile" className="flex scroll-mt-6 flex-col gap-grid">
							<h2 id="h-profile" className="m-0 text-h3">
								Profile
							</h2>
							<div className="grid grid-cols-2 gap-grid narrow:grid-cols-1">
								<FormField name="name" label="Display name" />
								<FormField name="handle" label="Username" mono hint="Changing it keeps your old links working." />
							</div>
							<FormTextarea name="bio" label="Bio" optional rows={2} maxLength={160} />
							<Field label="Email" htmlFor="settings-email" hint="Never shown publicly, never exported to the dataset.">
								<Input id="settings-email" type="email" value={me.email} readOnly />
							</Field>
						</section>
						<section id="settings-privacy" aria-labelledby="h-privacy" className={`${section} scroll-mt-6`}>
							<h2 id="h-privacy" className="m-0 text-h3">
								Privacy and email
							</h2>
							<FormSwitch name="showFavorites" label="Show my favorites on my profile" />
							<FormSwitch name="emailOnReview" label="Email me when a review of my submission finishes" />
						</section>
						<section id="settings-terminals" aria-labelledby="h-terminals" className={`${section} scroll-mt-6`}>
							<h2 id="h-terminals" className="m-0 text-h3">
								Terminals
							</h2>
							<p className="m-0 text-[15px] text-muted-foreground">
								Devices signed in with qotm login. Revoking one keeps its local quotes and dataset; it just stops
								syncing your account.
							</p>
							<Terminals />
							<CommandBlock tone="light" command="qotm logout" />
						</section>
						<section
							id="settings-delete"
							aria-labelledby="h-delete"
							className="flex scroll-mt-6 flex-wrap items-center justify-between gap-4 border-t border-border pt-7"
						>
							<div>
								<h2 id="h-delete" className="m-0 mb-1 text-h3">
									Delete account
								</h2>
								<p className="m-0 text-[15px] text-muted-foreground">
									Your private quotes are deleted. Public contributions stay, credited to “a former member”.
								</p>
							</div>
							<DeleteAccount handle={me.handle} />
						</section>
						<div className="flex justify-end gap-3">
							<Button type="button" variant="quiet" disabled={!dirty} onClick={() => resetForm()}>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								Save changes
							</Button>
						</div>
					</Form>
				)}
			</Formik>
		</div>
	);
}
