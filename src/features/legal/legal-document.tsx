import { Fragment, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Card, Eyebrow, PageMeta } from '@/shared/ui';
import type { LegalBlock, LegalDoc } from './documents';
import { inline } from './inline';

function Text({ source }: { source: string }) {
	return (
		<>
			{inline(source).map((part, i) =>
				'strong' in part ? (
					<b key={i} className="font-medium text-foreground">
						{part.strong}
					</b>
				) : 'code' in part ? (
					<code key={i} className="font-mono text-[0.9em] text-foreground">
						{part.code}
					</code>
				) : 'link' in part ? (
					part.href.startsWith('/') ? (
						<Link key={i} to={part.href} className="text-foreground underline underline-offset-2">
							{part.link}
						</Link>
					) : (
						<a key={i} href={part.href} className="text-foreground underline underline-offset-2">
							{part.link}
						</a>
					)
				) : (
					<Fragment key={i}>{part.text}</Fragment>
				)
			)}
		</>
	);
}

function Block({ block }: { block: LegalBlock }) {
	if (typeof block === 'string')
		return (
			<p className="m-0">
				<Text source={block} />
			</p>
		);
	return (
		<ul className="m-0 flex list-disc flex-col gap-2 pl-5 marker:text-stone-400">
			{block.list.map((item, i) => (
				<li key={i}>
					<Text source={item} />
				</li>
			))}
		</ul>
	);
}

const dateLabel = (iso: string) =>
	new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});

/**
 * A legal document: the title and date, the short version, a contents list
 * (beside the text on wide screens, folded above it on narrow ones) and the
 * numbered sections, each an anchor.
 */
export function LegalDocument({ doc }: { doc: LegalDoc }) {
	const { hash } = useLocation();
	// The router leaves `#section` alone: arriving from another page (the footer's
	// guidelines, a link between the two documents), go to the section.
	useEffect(() => {
		if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
	}, [hash, doc]);

	const contents = (
		<ol className="m-0 flex list-none flex-col gap-1.5 p-0 font-mono text-[13px]">
			{doc.sections.map((s, i) => (
				<li key={s.id}>
					<a href={`#${s.id}`} className="tap text-muted-foreground no-underline hover:text-foreground">
						{String(i + 1).padStart(2, '0')} {s.heading}
					</a>
				</li>
			))}
		</ol>
	);

	return (
		<article className="mx-auto flex max-w-(--breakpoint-kit) flex-col gap-page pt-10 pb-section lg:max-w-none">
			<PageMeta title={doc.title} description={doc.description} />
			<header className="flex max-w-[68ch] flex-col gap-3">
				<Eyebrow>Legal</Eyebrow>
				<h1 className="m-0 text-h1">{doc.title}.</h1>
				<p className="m-0 font-mono text-[13px] text-muted-foreground">Last updated {dateLabel(doc.updated)}</p>
			</header>

			<div className="grid items-start gap-page lg:grid-cols-[220px_minmax(0,68ch)] lg:gap-section">
				<nav aria-label="Contents" className="max-lg:hidden lg:sticky lg:top-[calc(var(--spacing-header)+24px)]">
					<Eyebrow className="mb-3">Contents</Eyebrow>
					{contents}
				</nav>

				<div className="flex min-w-0 flex-col gap-page text-body text-muted-foreground">
					<Card label="The short version">
						<ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-ui text-foreground marker:text-clay-600">
							{doc.summary.map((line, i) => (
								<li key={i}>
									<Text source={line} />
								</li>
							))}
						</ul>
					</Card>

					<details className="rounded-card border border-border bg-card px-card-x py-3 lg:hidden">
						<summary className="tap cursor-pointer font-mono text-[12px] tracking-[0.12em] text-stone-600 uppercase">
							Contents
						</summary>
						<div className="pt-3">{contents}</div>
					</details>

					{doc.sections.map((s, i) => (
						<section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="flex scroll-mt-24 flex-col gap-4">
							<h2 id={`${s.id}-h`} className="m-0 text-h2 text-foreground">
								<span className="mr-2.5 font-mono text-[15px] font-normal text-clay-600">
									{String(i + 1).padStart(2, '0')}
								</span>
								{s.heading}
							</h2>
							{s.blocks.map((b, j) => (
								<Block key={j} block={b} />
							))}
						</section>
					))}
				</div>
			</div>
		</article>
	);
}
