import { useState } from 'react';
import { useAdminUsersQuery, useSetUserRoleMutation } from '@/features/admin/api';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import type { AdminUserEntity, AdminUsersIdRoleData } from '@/shared/types';
import {
	Button,
	DataTable,
	Dialog,
	Notice,
	PageMeta,
	Pagination,
	RadioGroup,
	SearchField,
	Select,
	StatusBadge,
	notify
} from '@/shared/ui';
import { refusal } from '@/features/admin/lib/refusal';

type Role = AdminUsersIdRoleData['body']['role'];

const PAGE_SIZE = 15;

/** The roles an admin assigns, and what each may do (BUILD-PLAN §5). */
const ROLES: { value: Role; label: string; description: string }[] = [
	{ value: 'member', label: 'Member', description: 'Submits, likes, favorites and reports quotes.' },
	{
		value: 'verifier',
		label: 'Verifier',
		description: 'Checks provenance: verifies, corrects wording, links authors.'
	},
	{ value: 'moderator', label: 'Moderator', description: 'Answers reports and the submissions queue.' },
	{
		value: 'admin',
		label: 'Admin',
		description: 'Everything above, plus curation, taxonomy, releases, users and the audit log.'
	}
];

const ROLE_FILTER = [{ value: '', label: 'Any role' }, ...ROLES.map((r) => ({ value: r.value, label: r.label }))];

/** The role a row shows: the highest one held, the superuser as admin. */
const roleOf = (u: Pick<AdminUserEntity, 'role'>): Role => {
	const roles = (u.role ?? 'member').split(',');
	if (roles.includes('superuser') || roles.includes('admin')) return 'admin';
	return (['moderator', 'verifier'] as const).find((r) => roles.includes(r)) ?? 'member';
};

/** Change a user's role, after saying what the new one may do. */
function RoleDialog({ user, onClose }: { user: AdminUserEntity; onClose: () => void }) {
	const current = roleOf(user);
	const [role, setRole] = useState<Role>(current);
	const [error, setError] = useState<string | null>(null);
	const [save, { isLoading }] = useSetUserRoleMutation();
	return (
		<Dialog
			open
			onClose={onClose}
			width={520}
			title={`Change @${user.handle}’s role`}
			description={`${user.name || `@${user.handle}`} is a ${current} now. The change is audited and takes effect on their next request.`}
			footer={
				<>
					<Button variant="quiet" onClick={onClose}>
						Cancel
					</Button>
					<Button
						disabled={role === current || isLoading}
						onClick={async () => {
							setError(null);
							const res = await save({ id: user.id, role });
							if ('error' in res) return setError(refusal(res.error, 'The role was not changed. Try again.'));
							notify(`@${user.handle} is now a ${role}.`);
							onClose();
						}}
					>
						{role === current ? 'Change role' : `Make ${ROLES.find((r) => r.value === role)?.label.toLowerCase()}`}
					</Button>
				</>
			}
		>
			{error ? <Notice tone="attention">{error}</Notice> : null}
			<RadioGroup
				label="Role"
				name="role"
				variant="card"
				value={role}
				onChange={(v) => setRole(v as Role)}
				options={ROLES.map((r) => ({ value: r.value, label: r.label, description: r.description }))}
			/>
		</Dialog>
	);
}

/**
 * Admin users (artboard AdminUsers): members and staff, searched by handle,
 * name or email and filtered by role, with their contributions. A row opens
 * the role change, confirmed in a dialog. Roles are only ever assigned here.
 */
export function AdminUsersRoute() {
	const [search, setSearch] = useState('');
	const q = useDebouncedValue(search.trim(), 300);
	const [role, setRole] = useState('');
	const [page, setPage] = useState(1);
	const { data, isLoading, isFetching, isError, refetch } = useAdminUsersQuery({
		...(q ? { search: q } : {}),
		...(role ? { role } : {}),
		page,
		limit: PAGE_SIZE
	});
	const [changing, setChanging] = useState<AdminUserEntity | null>(null);

	return (
		<div className="flex flex-col gap-card-y">
			<PageMeta title="Users" robots="noindex" />
			<header>
				<h1 className="m-0 text-h1">Users.</h1>
				<p className="mt-2 mb-0 text-[15px] text-muted-foreground">
					Roles are assigned by admins. There is no automatic promotion in V1.
				</p>
			</header>
			<div className="flex flex-wrap items-end gap-3" role="search" aria-label="Filter users">
				<SearchField
					size="sm"
					shortcut={null}
					placeholder="Search handle or email"
					aria-label="Search handle or email"
					className="min-w-[240px] flex-1"
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
				/>
				<Select
					size="sm"
					aria-label="Role"
					options={ROLE_FILTER}
					value={role}
					onChange={(e) => {
						setRole(e.target.value);
						setPage(1);
					}}
				/>
			</div>
			{isLoading ? (
				<PageSkeleton />
			) : isError || !data ? (
				<StateScreen compact title="The users did not load." description="Check your connection and try again.">
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				</StateScreen>
			) : !data.list.length ? (
				<Empty title="No users match." description="Try another handle or email, or any role." />
			) : (
				<>
					<DataTable<AdminUserEntity>
						label="Users"
						className={isFetching ? 'opacity-70' : undefined}
						rows={data.list}
						rowKey={(u) => u.id}
						onRowClick={setChanging}
						rowLabel={(u) => `Change @${u.handle}’s role`}
						columns={[
							{ key: 'handle', label: 'handle', mono: true, render: (u) => `@${u.handle}` },
							{ key: 'name', label: 'name' },
							{ key: 'role', label: 'role', render: (u) => <StatusBadge status={roleOf(u)} /> },
							{ key: 'joined', label: 'joined', mono: true, render: (u) => u.createdAt.slice(0, 10) },
							{ key: 'contributions', label: 'contributions', align: 'right' },
							{ key: 'curated', label: 'curated', align: 'right' }
						]}
					/>
					{data.lastPage > 1 ? (
						<Pagination page={page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
					) : null}
				</>
			)}
			{changing ? <RoleDialog user={changing} onClose={() => setChanging(null)} /> : null}
		</div>
	);
}
