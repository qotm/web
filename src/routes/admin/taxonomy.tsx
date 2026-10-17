import { useState } from 'react';
import { Form, Formik } from 'formik';
import {
	useAdminAuthorsQuery,
	useAdminSourcesQuery,
	useAdminTopicsQuery,
	useCreateAuthorMutation,
	useCreateSourceMutation,
	useCreateTopicMutation,
	useUpdateAuthorMutation,
	useUpdateSourceMutation,
	useUpdateTopicMutation
} from '@/features/admin/api';
import {
	apiFieldError,
	bodyOf,
	validate,
	valuesOf,
	type FieldSpec,
	type FormValues
} from '@/features/admin/lib/taxonomy';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import type { AdminAuthorEntity, AdminSourceEntity, AdminTopicEntity } from '@/shared/types';
import {
	Button,
	DataTable,
	Dialog,
	Field,
	FormField,
	FormTextarea,
	Notice,
	PageMeta,
	Pagination,
	SearchField,
	Select,
	notify
} from '@/shared/ui';

type Row = { id: string };
type Page<T> = { list: T[]; total: number; pageSize: number; lastPage: number };
type ListResult<T> = {
	data?: Page<T>;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	refetch: () => unknown;
};
type SaveResult = PromiseLike<{ data?: unknown; error?: unknown }>;
type Column<T> = Parameters<typeof DataTable<T>>[0]['columns'][number];

type TaxonomyConfig<T extends Row> = {
	title: string;
	singular: string;
	lede: string;
	searchPlaceholder?: string;
	columns: Column<T>[];
	fields: FieldSpec[];
	/** The form's starting values for a row (defaults to the row's own fields). */
	toForm?: (row: T) => Record<string, unknown>;
	// Method syntax: the RTK hooks' wider argument types fit without casts.
	useList(args: { search?: string; page: number; limit: number }): ListResult<T>;
	useCreate(): readonly [(body: never) => SaveResult, ...unknown[]];
	useUpdate(): readonly [(arg: never) => SaveResult, ...unknown[]];
	pageSize: number;
	dense?: boolean;
};

const SOURCE_KINDS = ['BOOK', 'PAPER', 'MANUSCRIPT', 'LECTURE', 'TALK', 'POST'] as const;

/** Author slugs to suggest in a source's author field, as the admin types. */
function AuthorOptions({ id, search }: { id: string; search: string }) {
	const q = useDebouncedValue(search.trim(), 250);
	const { data } = useAdminAuthorsQuery({ search: q, limit: 8 });
	return (
		<datalist id={id}>
			{data?.list.map((a) => (
				<option key={a.slug} value={a.slug}>
					{a.name}
				</option>
			))}
		</datalist>
	);
}

/** Add or edit one record: the config's fields, the API's errors on the field they name. */
function EditDialog<T extends Row>({
	config,
	row,
	open,
	onClose
}: {
	config: TaxonomyConfig<T>;
	row: T | null;
	open: boolean;
	onClose: () => void;
}) {
	const [create] = config.useCreate();
	const [update] = config.useUpdate();
	const [error, setError] = useState<string | null>(null);
	const was = row ? valuesOf(config.fields, config.toForm?.(row) ?? (row as Record<string, unknown>)) : undefined;
	const close = () => {
		setError(null);
		onClose();
	};
	const idOf = (name: string) => `${config.singular.toLowerCase()}-${name}`;
	return (
		<Formik<FormValues>
			initialValues={was ?? valuesOf(config.fields)}
			enableReinitialize
			validate={(v) => validate(config.fields, v)}
			onSubmit={async (v, helpers) => {
				setError(null);
				const body = bodyOf(config.fields, v, was);
				if (row && !Object.keys(body).length) {
					helpers.setSubmitting(false);
					return close();
				}
				const res = row ? await update({ id: row.id, body } as never) : await create(body as never);
				helpers.setSubmitting(false);
				if ('error' in res && res.error) {
					const status = (res.error as { status?: number }).status;
					if (status === 409) return helpers.setFieldError('slug', 'That slug is taken.');
					const field = apiFieldError(res.error);
					if (field && config.fields.some((f) => f.name === field[0])) return helpers.setFieldError(field[0], field[1]);
					return setError('It was not saved. Try again.');
				}
				notify(row ? `${config.singular} saved.` : `${config.singular} added.`);
				close();
			}}
		>
			{({ isSubmitting, submitForm, values, setFieldValue }) => (
				<Dialog
					open={open}
					onClose={close}
					width={560}
					title={row ? `Edit ${config.singular.toLowerCase()}` : `Add ${config.singular.toLowerCase()}`}
					description="Kept in the audit log with your name."
					footer={
						<>
							<Button variant="quiet" onClick={close}>
								Cancel
							</Button>
							<Button disabled={isSubmitting} onClick={() => void submitForm()}>
								{row ? 'Save' : `Add ${config.singular.toLowerCase()}`}
							</Button>
						</>
					}
				>
					<Form className="grid grid-cols-2 gap-grid narrow:grid-cols-1" noValidate>
						{error ? (
							<Notice tone="attention" className="col-span-full">
								{error}
							</Notice>
						) : null}
						{config.fields.map((f) =>
							f.kind === 'textarea' ? (
								<FormTextarea
									key={f.name}
									name={f.name}
									id={idOf(f.name)}
									label={f.label}
									hint={f.hint}
									optional={!f.required}
									maxLength={f.max}
									rows={2}
									className="col-span-full"
								/>
							) : f.kind === 'select' ? (
								<Field
									key={f.name}
									label={f.label}
									htmlFor={idOf(f.name)}
									className={f.half ? undefined : 'col-span-full'}
								>
									<Select
										id={idOf(f.name)}
										options={f.options ?? []}
										value={values[f.name]}
										onChange={(e) => void setFieldValue(f.name, e.target.value)}
									/>
								</Field>
							) : (
								<div key={f.name} className={f.half ? undefined : 'col-span-full'}>
									<FormField
										name={f.name}
										id={idOf(f.name)}
										label={f.label}
										hint={f.hint}
										required={f.required}
										optional={!f.required}
										mono={f.kind === 'slug' || f.kind === 'url' || f.authors}
										inputMode={f.kind === 'year' ? 'numeric' : undefined}
										list={f.authors ? `${idOf(f.name)}-options` : undefined}
										autoComplete="off"
									/>
									{f.authors && open ? <AuthorOptions id={`${idOf(f.name)}-options`} search={values[f.name]} /> : null}
								</div>
							)
						)}
					</Form>
				</Dialog>
			)}
		</Formik>
	);
}

/** One taxonomy table: search, paging, and add / edit in a dialog. */
function TaxonomyPage<T extends Row>({ config }: { config: TaxonomyConfig<T> }) {
	const [search, setSearch] = useState('');
	const q = useDebouncedValue(search.trim(), 300);
	const [page, setPage] = useState(1);
	const { data, isLoading, isFetching, isError, refetch } = config.useList({
		...(q ? { search: q } : {}),
		page,
		limit: config.pageSize
	});
	const [editing, setEditing] = useState<T | null>(null);
	const [adding, setAdding] = useState(false);

	return (
		<div className="flex flex-col gap-card-y">
			<PageMeta title={config.title} robots="noindex" />
			<header className="flex flex-wrap items-end justify-between gap-6">
				<div>
					<h1 className="m-0 text-h1">{config.title}.</h1>
					<p className="mt-2 mb-0 text-[15px] text-muted-foreground">{config.lede}</p>
				</div>
				<Button size="sm" onClick={() => setAdding(true)}>
					Add {config.singular.toLowerCase()}
				</Button>
			</header>
			{config.searchPlaceholder ? (
				<div className="flex items-end gap-3">
					<SearchField
						size="sm"
						shortcut={null}
						placeholder={config.searchPlaceholder}
						aria-label={config.searchPlaceholder}
						className="max-w-[420px] flex-1"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
					/>
				</div>
			) : null}
			{isLoading ? (
				<PageSkeleton />
			) : isError || !data ? (
				<StateScreen
					compact
					title={`The ${config.title.toLowerCase()} did not load.`}
					description="Check your connection and try again."
				>
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				</StateScreen>
			) : !data.list.length ? (
				q ? (
					<Empty title={`No ${config.title.toLowerCase()} match.`} description="Try other words." />
				) : (
					<Empty
						title={`No ${config.title.toLowerCase()} yet.`}
						description={`Add the first ${config.singular.toLowerCase()}.`}
					/>
				)
			) : (
				<>
					<DataTable<T>
						label={config.title}
						dense={config.dense}
						className={isFetching ? 'opacity-70' : undefined}
						rows={data.list}
						rowKey={(r) => r.id}
						onRowClick={setEditing}
						rowLabel={(r) =>
							`Edit ${String((r as Record<string, unknown>).name ?? (r as Record<string, unknown>).title)}`
						}
						columns={config.columns}
					/>
					{data.lastPage > 1 ? (
						<Pagination page={page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
					) : null}
				</>
			)}
			<EditDialog config={config} row={null} open={adding} onClose={() => setAdding(false)} />
			{editing ? <EditDialog config={config} row={editing} open onClose={() => setEditing(null)} /> : null}
		</div>
	);
}

const AUTHORS: TaxonomyConfig<AdminAuthorEntity> = {
	title: 'Authors',
	singular: 'Author',
	lede: 'External authors quotes are attributed to. Never qotm members.',
	searchPlaceholder: 'Search authors',
	pageSize: 15,
	useList: useAdminAuthorsQuery,
	useCreate: useCreateAuthorMutation,
	useUpdate: useUpdateAuthorMutation,
	columns: [
		{ key: 'name', label: 'name' },
		{ key: 'slug', label: 'slug', mono: true },
		{ key: 'dates', label: 'dates', mono: true },
		{ key: 'quotes', label: 'quotes', align: 'right' },
		{ key: 'curated', label: 'curated', align: 'right' }
	],
	fields: [
		{ name: 'name', label: 'Name', kind: 'text', required: true, max: 160 },
		{ name: 'slug', label: 'Slug', kind: 'slug', max: 80, hint: 'Made from the name if left empty.' },
		{ name: 'bornYear', label: 'Born', kind: 'year', half: true },
		{ name: 'diedYear', label: 'Died', kind: 'year', half: true },
		{ name: 'description', label: 'Description', kind: 'textarea', max: 80, hint: 'A few words: “computer scientist”.' }
	]
};

const SOURCES: TaxonomyConfig<AdminSourceEntity> = {
	title: 'Sources',
	singular: 'Source',
	lede: 'Books, papers, talks and posts that quotes are verified against.',
	searchPlaceholder: 'Search sources',
	pageSize: 15,
	useList: useAdminSourcesQuery,
	useCreate: useCreateSourceMutation,
	useUpdate: useUpdateSourceMutation,
	toForm: (s) => ({ ...s, author: s.author?.slug ?? null }),
	columns: [
		{ key: 'title', label: 'source' },
		{ key: 'author', label: 'author', render: (s) => s.author?.name ?? '—' },
		{ key: 'year', label: 'year', mono: true, render: (s) => s.year ?? '—' },
		{ key: 'kind', label: 'kind', mono: true, render: (s) => s.kind.toLowerCase() },
		{ key: 'quotes', label: 'quotes', align: 'right' }
	],
	fields: [
		{ name: 'title', label: 'Title', kind: 'text', required: true, max: 300 },
		{ name: 'author', label: 'Author', kind: 'text', authors: true, hint: 'An author’s slug.', max: 80 },
		{ name: 'year', label: 'Year', kind: 'year', half: true },
		{
			name: 'kind',
			label: 'Kind',
			kind: 'select',
			required: true,
			half: true,
			options: SOURCE_KINDS.map((k) => ({ value: k, label: k.toLowerCase() }))
		},
		{ name: 'url', label: 'Link', kind: 'url', max: 2048 }
	]
};

const TOPICS: TaxonomyConfig<AdminTopicEntity> = {
	title: 'Topics',
	singular: 'Topic',
	lede: 'The controlled taxonomy. Members pick from it; they can’t add to it.',
	pageSize: 100,
	dense: true,
	useList: useAdminTopicsQuery,
	useCreate: useCreateTopicMutation,
	useUpdate: useUpdateTopicMutation,
	columns: [
		{ key: 'name', label: 'topic' },
		{ key: 'slug', label: 'slug', mono: true },
		{ key: 'quotes', label: 'quotes', align: 'right' },
		{ key: 'curated', label: 'curated', align: 'right' }
	],
	fields: [
		{ name: 'name', label: 'Name', kind: 'text', required: true, max: 60, hint: 'Lowercase, as members see it.' },
		{ name: 'slug', label: 'Slug', kind: 'slug', max: 60, hint: 'Made from the name if left empty.' },
		{ name: 'description', label: 'Description', kind: 'textarea', max: 200 }
	]
};

/** Authors (artboard AdminAuthors). */
export const AdminAuthorsRoute = () => <TaxonomyPage config={AUTHORS} />;
/** Sources (artboard AdminSources). */
export const AdminSourcesRoute = () => <TaxonomyPage config={SOURCES} />;
/** Topics (artboard AdminTopics). */
export const AdminTopicsRoute = () => <TaxonomyPage config={TOPICS} />;
