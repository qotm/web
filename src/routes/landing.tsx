import { Link } from 'react-router';
import { Empty, StateScreen } from '@/shared/layouts';
import {
	Button,
	Card,
	Cursor,
	Divider,
	Eyebrow,
	InstallPill,
	Kbd,
	LifecycleSteps,
	PageMeta,
	Prompt,
	ProvenancePanel,
	QuoteCard,
	Skeleton,
	Terminal,
	TextLink,
	glyph,
	lifecycleOf
} from '@/shared/ui';
import { paths } from '@/lib/paths';
import { useQuoteFeedQuery, useQuoteQuery } from '@/features/quotes/api';
import { useQuoteActions } from '@/features/quotes/use-quote-actions';

const section = 'border-t border-border py-section';

/**
 * The hero's terminal: a real curated quote, drawn as `qotm` draws it by
 * default (the CLI's pull quote, cli/src/render.ts): clay marks hanging left
 * of a balanced column, then the credit and the quote's id.
 */
function TerminalDemo({ text, author, id }: { text?: string; author?: string; id?: string }) {
	return (
		<Terminal title="~">
			<div>
				<Prompt /> qotm
			</div>
			{text ? (
				<div className="mt-[1.5em] flex gap-[2ch] pl-[2ch]">
					<span aria-hidden="true" className="w-[5ch] shrink-0 whitespace-pre text-dark-accent">
						{'▄▄ ▄▄\n▀█ ▀█'}
					</span>
					<div className="min-w-0 max-w-[60ch]">
						<div className="font-semibold text-balance">{text}</div>
						<div className="mt-[1.5em] whitespace-pre-wrap text-dark-muted">
							<span className="text-dark-accent">—</span>
							{'  '}
							{author}
							{id ? <span>{`  ·  ${paths.quote(id).slice(1)}`}</span> : null}
						</div>
					</div>
				</div>
			) : (
				<div className="mt-stack mb-1.5">
					<Skeleton lines={2} />
				</div>
			)}
			<div className="mt-4">
				<Prompt /> qotm save
			</div>
			<div className="text-dark-muted">saved to favorites</div>
			<div className="mt-4">
				<Prompt /> qotm open
			</div>
			<div className="text-dark-muted">opening {id ? paths.quote(id).slice(1) : 'q/…'} in your browser</div>
			<div className="mt-4">
				<Prompt />
				<Cursor />
			</div>
		</Terminal>
	);
}

/**
 * The landing page (artboard Main): the hero with the terminal, how it works,
 * the latest curated quotes, a live provenance record, and how to contribute.
 */
export function LandingRoute() {
	const curated = useQuoteFeedQuery({ feed: 'curated', limit: 2 });
	const featured = curated.data?.list[0];
	const detail = useQuoteQuery(featured?.id ?? '', { skip: !featured });
	const act = useQuoteActions();
	const name = (q?: { author: { name: string } | null; attribution: string | null }) =>
		q?.author?.name ?? q?.attribution ?? '';

	return (
		<>
			<PageMeta
				title="qotm — a thought between commands"
				exact
				description="qotm prints one considered programming quote in your terminal. The community checks where every one of them came from."
			/>
			<section className="grid grid-cols-2 items-center gap-12 pt-[88px] pb-[72px] narrow:grid-cols-1 narrow:pt-section">
				<div>
					<Eyebrow>Open source · offline-first</Eyebrow>
					<h1 className="m-0 mb-card-y text-display">A thought between commands.</h1>
					<p className="text-[17px] text-muted-foreground">
						qotm prints one considered programming quote in your terminal. The community checks where every one of them
						came from.
					</p>
					<div className="mt-tile flex flex-wrap items-center gap-stack">
						<InstallPill copyable />
						<TextLink to={paths.discover} mono>
							browse the quotes {glyph('→')}
						</TextLink>
					</div>
					<p className="mt-4 mb-0 font-mono text-[13px] text-muted-foreground">
						No account. No network on the default path.
					</p>
				</div>
				<TerminalDemo text={featured?.text} author={name(featured)} id={featured?.id} />
			</section>

			<section className={section}>
				<Eyebrow>How it works</Eyebrow>
				<h2 className="m-0 mb-tile text-h1">Terminal first. Community behind it.</h2>
				<div className="grid grid-cols-3 gap-grid narrow:grid-cols-1">
					<Card label="1 · read">
						<p className="m-0">
							Run <Kbd>qotm</Kbd>. A curated quote from the local dataset, instantly and offline.
						</p>
					</Card>
					<Card label="2 · open">
						<p className="m-0">
							Run <Kbd>qotm open</Kbd> to see its source, its context and who verified it.
						</p>
					</Card>
					<Card label="3 · contribute">
						<p className="m-0">
							Submit a quote with its source. Approved ones ship in the next <Kbd>qotm sync</Kbd>.
						</p>
					</Card>
				</div>
			</section>

			<section className={section}>
				<div className="mb-card-y flex flex-wrap items-end justify-between gap-4">
					<div>
						<Eyebrow>Curated this week</Eyebrow>
						<h2 className="m-0 text-h1">Recently added to the dataset.</h2>
					</div>
					<TextLink to={paths.curated} mono>
						all curated {glyph('→')}
					</TextLink>
				</div>
				{curated.isLoading ? (
					<div className="grid grid-cols-2 gap-grid narrow:grid-cols-1">
						{[0, 1].map((i) => (
							<Card key={i}>
								<Skeleton lines={4} />
							</Card>
						))}
					</div>
				) : curated.isError ? (
					<StateScreen compact title="The quotes did not load." description="Check your connection and try again.">
						<Button variant="outline" onClick={() => void curated.refetch()}>
							Try again
						</Button>
					</StateScreen>
				) : curated.data?.list.length ? (
					<div className="grid grid-cols-2 items-start gap-grid narrow:grid-cols-1">
						{curated.data.list.map((q) => (
							<QuoteCard key={q.id} quote={q} onAction={act(q.id)} />
						))}
					</div>
				) : (
					<Empty
						title="Nothing curated yet."
						description="The first dataset release is on its way."
						command="qotm sync"
					/>
				)}
			</section>

			<section className={`${section} grid grid-cols-2 items-start gap-12 narrow:grid-cols-1`}>
				<div>
					<Eyebrow>Provenance</Eyebrow>
					<h2 className="m-0 mb-grid text-h1">Every canonical quote has a source.</h2>
					<p>
						A quote attributed to someone needs evidence that they said or wrote it. Verifiers check the source;
						curators decide whether it ships to every install. Those are two decisions, made by people.
					</p>
					<p>
						Popularity never publishes anything. Author credit and contributor credit stay separate: submitting a
						Dijkstra quote doesn’t make it yours.
					</p>
					{featured ? <TextLink to={paths.quote(featured.id)}>See a full quote record {glyph('→')}</TextLink> : null}
				</div>
				{detail.data ? (
					<ProvenancePanel quote={detail.data} />
				) : (
					<Card>
						<Skeleton lines={6} />
					</Card>
				)}
			</section>

			<section className={section}>
				<div className="grid grid-cols-2 items-center gap-12 narrow:grid-cols-1">
					<div>
						<Eyebrow>Contribute</Eyebrow>
						<h2 className="m-0 mb-grid text-h1">From your terminal to everyone’s.</h2>
						<p>
							Keep private quotes with <Kbd>qotm add</Kbd>. Send one for review with <Kbd>qotm submit</Kbd>, or submit
							on the web. Approved quotes go out in the next dataset release.
						</p>
						<div className="mt-card-y flex flex-wrap gap-3">
							<Button asChild>
								<Link to={paths.submit}>Submit a quote</Link>
							</Button>
							<Button asChild variant="outline">
								<Link to={paths.login}>Create an account</Link>
							</Button>
						</div>
					</div>
					<Card>
						{detail.data ? (
							<LifecycleSteps {...lifecycleOf(detail.data)} orientation="vertical" />
						) : (
							<LifecycleSteps current="CURATED" orientation="vertical" />
						)}
					</Card>
				</div>
			</section>
			<Divider variant="graphic" gap="0 0 48px" />
		</>
	);
}
