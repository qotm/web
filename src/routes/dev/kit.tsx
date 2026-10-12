import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import type { QuoteCardEntity } from '@/shared/types';
import {
	Avatar,
	ActionBar,
	Attribution,
	Badge,
	QuoteBlock,
	QuoteCard,
	CommandBlock,
	Cursor,
	InstallPill,
	Prompt,
	Terminal,
	Breadcrumbs,
	Pagination,
	SideNav,
	Tabs,
	Button,
	Divider,
	Eyebrow,
	Logo,
	StatusBadge,
	TopicTag,
	Card,
	Checkbox,
	Dialog,
	EmptyState,
	Menu,
	Notice,
	Skeleton,
	Tile,
	Toast,
	Field,
	IconButton,
	Input,
	Kbd,
	PageMeta,
	RadioGroup,
	SearchField,
	Select,
	Switch,
	TextLink,
	Textarea,
	TopicPicker
} from '@/shared/ui';

const TOPICS = [
	'programming',
	'software design',
	'software engineering',
	'unix',
	'open source',
	'databases',
	'distributed systems',
	'security',
	'web development',
	'debugging',
	'simplicity',
	'complexity',
	'engineering leadership',
	'learning',
	'creativity'
];

/** The kit's QuoteCard sample data, as the API returns it. */
const quote = (q: Partial<QuoteCardEntity> & Pick<QuoteCardEntity, 'id' | 'text'>): QuoteCardEntity => ({
	type: 'canonical',
	status: 'PUBLISHED',
	author: null,
	attribution: null,
	work: null,
	year: null,
	contributor: null,
	topics: [],
	counts: { likes: 0, favorites: 0, recommends: 0 },
	publishedAt: null,
	...q
});
const t = (name: string) => ({ slug: name.replace(/\s+/g, '-'), name });
const SAMPLE = {
	dijkstra: quote({
		id: 'q_8f2k1c',
		text: 'Simplicity is prerequisite for reliability.',
		author: { slug: 'dijkstra', name: 'Edsger W. Dijkstra' },
		work: 'EWD 498',
		year: 1975,
		status: 'CURATED',
		topics: [t('simplicity'), t('software design')],
		contributor: { handle: 'kofi' },
		counts: { likes: 412, favorites: 188, recommends: 0 }
	}),
	ada: quote({
		id: 'q_4r8y1p',
		text: 'A green build is a hypothesis, not a proof.',
		type: 'original',
		topics: [t('software engineering')],
		contributor: { handle: 'ada' },
		counts: { likes: 58, favorites: 21, recommends: 14 },
		viewer: { liked: false, favorited: false, recommended: true }
	}),
	karlton: quote({
		id: 'q_6h2w8r',
		text: 'There are only two hard things in Computer Science: cache invalidation and naming things.',
		author: { slug: 'karlton', name: 'Phil Karlton' },
		status: 'NEEDS_EVIDENCE',
		topics: [t('programming')],
		contributor: { handle: 'ada' },
		counts: { likes: 540, favorites: 76, recommends: 0 }
	})
};

/** The kit preview's StatusBadge rows: lifecycle, more lifecycle, types and visibility, roles. */
const STATUS_ROWS = [
	[
		'SUBMITTED',
		'UNDER_REVIEW',
		'NEEDS_EVIDENCE',
		'REJECTED',
		'VERIFIED',
		'CURATION_REVIEW',
		'CURATED',
		'DATASET_RELEASE'
	],
	['ORIGINALITY_CHECK', 'PUBLISHED', 'COMMUNITY_DISCOVERY', 'CURATION_CANDIDATE', 'DISPUTED', 'WITHDRAWN'],
	['CANONICAL', 'ORIGINAL', 'PRIVATE', 'PUBLIC', 'PERSONAL', 'COMMUNITY'],
	['MEMBER', 'VERIFIER', 'MODERATOR', 'ADMIN']
];

/**
 * Dev only (`/_kit`, not in production builds): our kit components laid out
 * as qotm_kit's own preview pages lay them out (e2e/kit/previews), so the
 * component tests can compare them with the kit's render and screenshot
 * both. `?only=Button` shows one section. `data-probe` marks the elements the
 * tests compare.
 */
const Row = ({ children }: { children: ReactNode }) => (
	<div className="flex flex-wrap items-center gap-3">{children}</div>
);

/** The kit preview's own max width, where it sets one. */
const WIDTHS: Record<string, number> = {
	// The kit's .qk-pv is content-box: 680 plus its 24px padding.
	QuoteCard: 728,
	Field: 420,
	Input: 460,
	Textarea: 560,
	Select: 360,
	SearchField: 420,
	TopicPicker: 640
};

const KIT_SECTIONS: Record<string, ReactNode> = {
	QuoteBlock: (
		<>
			<QuoteBlock
				quote="Simplicity is prerequisite for reliability."
				author="Edsger W. Dijkstra"
				cite="EWD 498, 1975"
			/>
			<QuoteBlock size="sm" quote="Talk is cheap. Show me the code." author="Linus Torvalds" />
		</>
	),
	QuoteCard: (
		<>
			<QuoteCard quote={SAMPLE.dijkstra} />
			<QuoteCard quote={SAMPLE.ada} />
			<QuoteCard quote={SAMPLE.karlton} variant="compact" />
		</>
	),
	Attribution: (
		<>
			<Attribution author="Edsger W. Dijkstra" authorSlug="dijkstra" work="EWD 498" year={1975} contributor="kofi" />
			<Attribution type="original" contributor="ada" />
			<Attribution type="private" />
			<div className="rounded-field bg-dark p-4">
				<Attribution
					onDark
					author="Brian W. Kernighan"
					work="The Elements of Programming Style"
					year={1978}
					contributor="kofi"
				/>
			</div>
		</>
	),
	ActionBar: (
		<>
			<ActionBar counts={{ likes: 412, favorites: 188, recommends: 14 }} state={{ favorited: true }} />
			<ActionBar
				size="sm"
				actions={['like', 'favorite', 'share']}
				counts={{ likes: 268, favorites: 120 }}
				state={{ liked: true }}
			/>
		</>
	),
	Terminal: (
		<Terminal title="~/projects">
			<div>
				<Prompt /> qotm --topic simplicity
			</div>
			<div className="mt-stack mb-1.5 text-quote-sm font-semibold">Simplicity is prerequisite for reliability.</div>
			<div className="text-dark-muted">
				<Prompt>—</Prompt>
				{'  '}Edsger W. Dijkstra
			</div>
			<div className="mt-stack">
				<Prompt />
				<Cursor />
			</div>
		</Terminal>
	),
	InstallPill: (
		<Row>
			<InstallPill />
			<InstallPill command="qotm sync" copyable />
			<span className="rounded-card bg-dark p-3.5">
				<InstallPill onDark copyable />
			</span>
		</Row>
	),
	CommandBlock: (
		<>
			<CommandBlock caption="Open this in your terminal" command="qotm open q_8f2k1c" />
			<CommandBlock tone="light" command="qotm --favorites" glyph="~ >" />
		</>
	),
	Tabs: (
		<>
			<Tabs
				data-probe="feed"
				items={[
					{ id: 'discover', label: 'discover' },
					{ id: 'latest', label: 'latest' },
					{ id: 'curated', label: 'curated' }
				]}
				active="discover"
			/>
			<Tabs
				data-probe="counts"
				items={[
					{ id: 'quotes', label: 'quotes', count: 12 },
					{ id: 'contributions', label: 'contributions', count: 31 }
				]}
				active="contributions"
			/>
		</>
	),
	Pagination: (
		<>
			<Pagination page={2} total={12631} />
			<Pagination mode="more" />
		</>
	),
	Breadcrumbs: (
		<Breadcrumbs
			items={[{ label: 'authors', to: '/authors' }, { label: 'dijkstra', to: '/authors/dijkstra' }, 'q_8f2k1c']}
		/>
	),
	SideNav: (
		<SideNav
			active="verification"
			sections={[
				{ items: [{ id: 'dash', label: 'Dashboard' }] },
				{
					title: 'Content',
					items: [
						{ id: 'quotes', label: 'Quotes' },
						{ id: 'subs', label: 'Submissions', count: 23 },
						{ id: 'verification', label: 'Verification queue', count: 12, attention: true },
						{ id: 'curation', label: 'Curation queue', count: 7 },
						{ id: 'reports', label: 'Reports', count: 3, attention: true }
					]
				},
				{
					title: 'Taxonomy',
					items: [
						{ id: 'a', label: 'Authors' },
						{ id: 's', label: 'Sources' },
						{ id: 't', label: 'Topics' }
					]
				},
				{
					title: 'System',
					items: [
						{ id: 'u', label: 'Users' },
						{ id: 'r', label: 'Dataset releases' },
						{ id: 'l', label: 'Audit logs' }
					]
				}
			]}
		/>
	),
	Badge: (
		<Row>
			<Badge data-probe="neutral">v2026.08.3</Badge>
			<Badge data-probe="clay" tone="clay">
				new
			</Badge>
			<Badge data-probe="ink" tone="ink">
				MIT
			</Badge>
			<Badge data-probe="upper" uppercase>
				offline
			</Badge>
			<span className="rounded-control bg-ink p-2">
				<Badge data-probe="dark" tone="dark">
					schema 1
				</Badge>
			</span>
		</Row>
	),
	StatusBadge: (
		<>
			{STATUS_ROWS.map((row) => (
				<Row key={row[0]}>
					{row.map((s) => (
						<StatusBadge key={s} status={s} />
					))}
				</Row>
			))}
		</>
	),
	Eyebrow: (
		<>
			<div>
				<Eyebrow data-probe="muted">Discover</Eyebrow>
				<h1 className="text-h1">What the community is reading.</h1>
			</div>
			<div>
				<Eyebrow data-probe="clay" tone="clay">
					Canonical · verified
				</Eyebrow>
			</div>
		</>
	),
	Divider: (
		<>
			<Divider gap="8px" />
			<Divider variant="graphic" gap="8px" />
			<Divider variant="mark" gap="8px" />
		</>
	),
	Avatar: (
		<Row>
			<Avatar name="Ada Mensah" size={24} />
			<Avatar handle="@kofi" />
			<Avatar name="Mireille Laurent" size={40} />
			<Avatar handle="ada" size={64} />
		</Row>
	),
	TopicTag: (
		<Row>
			<TopicTag>simplicity</TopicTag>
			<TopicTag>software design</TopicTag>
			<TopicTag>debugging</TopicTag>
			<TopicTag selected>unix</TopicTag>
		</Row>
	),
	Logo: (
		<>
			<div className="flex flex-wrap items-center gap-8">
				<Logo lockup="symbol" height={40} />
				<Logo lockup="wordmark" height={32} />
				<Logo lockup="horizontal" height={36} />
				<Logo lockup="stacked" height={72} />
			</div>
			<div className="flex flex-wrap items-center gap-8 rounded-card bg-ink p-5">
				<Logo lockup="symbol" reversed height={32} />
				<Logo lockup="horizontal" reversed height={30} />
			</div>
		</>
	),
	Button: (
		<>
			<Row>
				<Button data-probe="solid">Submit a quote</Button>
				<Button data-probe="accent" variant="accent">
					Publish release
				</Button>
				<Button data-probe="outline" variant="outline">
					Build preview
				</Button>
				<Button data-probe="quiet" variant="quiet">
					Cancel
				</Button>
				<Button data-probe="danger" variant="danger">
					Withdraw
				</Button>
			</Row>
			<Row>
				<Button data-probe="sm" size="sm">
					Save
				</Button>
				<Button data-probe="lg" size="lg">
					Get started
				</Button>
				<Button data-probe="mono-pill" variant="outline" mono pill>
					$ npm i -g qotm
				</Button>
				<Button data-probe="disabled" disabled>
					Disabled
				</Button>
				<Button data-probe="accent-disabled" variant="accent" disabled>
					Publish
				</Button>
			</Row>
		</>
	),
	IconButton: (
		<Row>
			<IconButton data-probe="outline" glyph="❯" label="Open" />
			<IconButton data-probe="ghost" glyph="↗" label="Share" variant="ghost" />
			<IconButton glyph="⋯" label="More" />
			<IconButton data-probe="pressed" glyph="★" label="Favorited" pressed />
			<IconButton data-probe="sm" glyph="✕" label="Close" size="sm" variant="ghost" />
			<IconButton data-probe="solid-lg" glyph="→" label="Next" variant="solid" size="lg" />
			<IconButton data-probe="disabled" glyph="✕" label="Disabled" disabled />
		</Row>
	),
	Link: (
		<p className="m-0">
			Read the{' '}
			<TextLink data-probe="default" href="#">
				verification guidelines
			</TextLink>{' '}
			before you submit.{' '}
			<TextLink data-probe="quiet" href="#" variant="quiet">
				Terms
			</TextLink>{' '}
			·{' '}
			<TextLink data-probe="quiet-mono" href="#" variant="quiet" mono>
				github.com/wesscoby/qotm
			</TextLink>
		</p>
	),
	Field: (
		<Field label="Source URL" optional hint="Where the words were first published." htmlFor="kit-field">
			<Input id="kit-field" mono defaultValue="https://www.cs.utexas.edu/~EWD/" />
		</Field>
	),
	Input: (
		<>
			<Field label="Author" required htmlFor="kit-author">
				<Input id="kit-author" placeholder="Edsger W. Dijkstra" />
			</Field>
			<Field label="Username" hint="Shown on your profile and on quotes you submit." htmlFor="kit-user">
				<Input id="kit-user" mono defaultValue="@ada" />
			</Field>
			<Field label="Year" error="Use a four-digit year." htmlFor="kit-year">
				<Input id="kit-year" defaultValue="19755" aria-invalid />
			</Field>
		</>
	),
	Textarea: (
		<>
			<Field
				label="Quote"
				required
				count="43 / 280"
				hint="The exact words, without quotation marks."
				htmlFor="kit-quote"
			>
				<Textarea
					id="kit-quote"
					display
					rows={3}
					maxLength={280}
					defaultValue="Simplicity is prerequisite for reliability."
				/>
			</Field>
			<Field label="Context" optional htmlFor="kit-context">
				<Textarea id="kit-context" rows={2} placeholder="Where and why it was said." />
			</Field>
		</>
	),
	Select: (
		<Field label="Sort" htmlFor="kit-sort">
			<Select id="kit-sort" options={['Most recent', 'Most favorited', 'Curated first']} />
		</Field>
	),
	Checkbox: (
		<>
			<Checkbox
				label="I wrote this quote and have the right to publish it."
				description="Required for community originals."
				defaultChecked
			/>
			<Checkbox label="Email me when a verifier reviews my submission" />
			<Checkbox label="Disabled option" disabled />
		</>
	),
	RadioGroup: (
		<>
			<RadioGroup
				label="What are you submitting?"
				variant="card"
				defaultValue="canonical"
				options={[
					{
						value: 'canonical',
						label: 'A quote by someone else',
						description: 'Needs a source. Reviewed by a verifier before it can be curated.'
					},
					{
						value: 'original',
						label: 'My own original',
						description: 'Shown as "declared original by @you". Checked for known matches.'
					},
					{
						value: 'private',
						label: 'A private note',
						description: 'Only you see it. Never enters the public dataset.'
					}
				]}
			/>
			<RadioGroup
				label="Reason"
				defaultValue="attr"
				options={[
					{ value: 'attr', label: 'Wrong attribution' },
					{ value: 'dup', label: 'Duplicate' },
					{ value: 'content', label: 'Content concern' }
				]}
			/>
		</>
	),
	Switch: (
		<>
			<Switch label="Show my favorites publicly" defaultChecked />
			<Switch label="Plain output by default" description="Same as qotm --plain." />
		</>
	),
	SearchField: (
		<>
			<SearchField />
			<SearchField size="sm" placeholder="Filter queue" shortcut={null} />
		</>
	),
	TopicPicker: <TopicPicker topics={TOPICS} defaultValue={['simplicity', 'software design']} />,
	Card: (
		<div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-grid">
			<Card data-probe="raised" label="Sounds like">
				<p className="m-0">A thought between commands. Plain verbs, sentence case.</p>
			</Card>
			<Card data-probe="wash" tone="wash" label="Curation">
				<p className="m-0">A verified quote is not automatically curated.</p>
			</Card>
			<Card data-probe="dark" tone="dark" label="Offline">
				<p className="m-0">qotm reads from local SQLite. No network, no account.</p>
			</Card>
		</div>
	),
	Tile: (
		<div className="grid grid-cols-3 gap-grid">
			<Tile data-probe="light" caption="symbol">
				<Logo lockup="symbol" height={48} />
			</Tile>
			<Tile data-probe="dark" caption="reversed" dark>
				<Logo lockup="symbol" reversed height={48} />
			</Tile>
			<Tile caption="divider">
				<Divider variant="mark" gap="0" />
			</Tile>
		</div>
	),
	Dialog: (
		<div className="h-[440px]">
			<Dialog
				inline
				title="Report this quote"
				description="Reports go to moderators. The quote stays up while it is reviewed."
				onClose={() => {}}
				footer={
					<>
						<Button variant="quiet">Cancel</Button>
						<Button>Send report</Button>
					</>
				}
			>
				<RadioGroup
					defaultValue="attr"
					options={[
						{ value: 'attr', label: 'Wrong or missing attribution' },
						{ value: 'dup', label: 'Duplicate of another quote' },
						{ value: 'orig', label: 'Not the submitter’s original' },
						{ value: 'content', label: 'Content concern' }
					]}
				/>
				<Field label="Details" optional htmlFor="kit-details">
					<Textarea id="kit-details" rows={2} placeholder="A link to the real source helps." />
				</Field>
			</Dialog>
		</div>
	),
	Menu: (
		<div className="flex min-h-[282px] flex-col items-end pr-10">
			<Menu
				defaultOpen
				label="Account"
				trigger={
					<span className="flex size-8 items-center justify-center rounded-full border border-border bg-card font-mono text-xs">
						ad
					</span>
				}
				items={[
					{ heading: '@ada · member' },
					{ id: 'p', label: 'Profile' },
					{ id: 'q', label: 'My quotes', hint: '12' },
					{ id: 'f', label: 'Favorites', hint: '48' },
					{ id: 's', label: 'Settings' },
					{ divider: true },
					{ id: 'o', label: 'Sign out' }
				]}
			/>
		</div>
	),
	Toast: (
		<>
			<Toast message="Saved to favorites." action="undo" onClose={() => {}} />
			<Toast glyph="↗" message="Link copied: /q/8f2k1c" />
		</>
	),
	Notice: (
		<>
			<Notice title="Declared original by @ada.">No known matching attribution found.</Notice>
			<Notice
				tone="attention"
				title="Needs evidence"
				action={
					<Button size="sm" variant="outline">
						Add a source
					</Button>
				}
			>
				A verifier could not find where Phil Karlton said this. A primary source would help.
			</Notice>
			<Notice tone="wash" title="This quote is in your personal dataset.">
				It is private. Run qotm submit to send it for community review.
			</Notice>
			<Notice tone="dark">No account needed. qotm works offline from its local dataset.</Notice>
		</>
	),
	EmptyState: (
		<EmptyState
			command="qotm favorites"
			title="No favorites yet."
			action={
				<Button variant="outline" size="sm">
					Browse curated quotes
				</Button>
			}
		>
			Favorite a quote here or run qotm save after one appears in your terminal.
		</EmptyState>
	),
	Skeleton: (
		<Card>
			<Skeleton block height={20} width="85%" />
			<div className="h-3" />
			<Skeleton lines={2} />
		</Card>
	),
	Kbd: (
		<p className="m-0">
			Press <Kbd data-probe="key">/</Kbd> to search. From your terminal, <Kbd>qotm open</Kbd> brings the last quote
			here.
		</p>
	)
};

export function KitRoute() {
	const [params] = useSearchParams();
	const only = params.get('only');
	const names = only ? [only] : Object.keys(KIT_SECTIONS);
	return (
		<main className="min-h-screen bg-background">
			<PageMeta title="Kit" robots="noindex" />
			{names.map((name) => (
				<section
					key={name}
					data-kit={name}
					className="flex flex-col gap-4 p-6"
					style={WIDTHS[name] ? { maxWidth: WIDTHS[name] } : undefined}
				>
					{only ? null : <h2 className="text-label text-muted-foreground">{name}</h2>}
					{KIT_SECTIONS[name]}
				</section>
			))}
		</main>
	);
}
