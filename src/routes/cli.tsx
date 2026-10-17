import { useEffect, useState } from 'react';
import { CLI_DOC, eyebrowOf } from '@/features/cli/docs';
import { CliBlockView } from '@/features/cli/cli-blocks';
import { Cursor, Eyebrow, InstallPill, PageMeta, Prompt, Terminal, TextLink, cn, glyph } from '@/shared/ui';
import { paths } from '@/lib/paths';

const sections = CLI_DOC.sections;

/** The section being read: the last one whose top has passed near the top of the window. */
function useCurrentSection() {
	const [current, setCurrent] = useState<string>(sections[0].id);
	useEffect(() => {
		let frame = 0;
		const update = () => {
			frame = 0;
			let at = sections[0].id;
			for (const s of sections) {
				const el = document.getElementById(s.id);
				if (el && el.getBoundingClientRect().top <= 140) at = s.id;
			}
			setCurrent(at);
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		update();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			window.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(frame);
		};
	}, []);
	return current;
}

/** The hero's terminal: installing, then the first quote, drawn as `qotm` draws it. */
function FirstRun() {
	const { text, author, id } = CLI_DOC.sample;
	return (
		<Terminal title="~" className="narrow:hidden">
			<div>
				<Prompt /> npm i -g qotm
			</div>
			<div className="text-dark-muted">added 1 package in 2s</div>
			<div className="mt-4">
				<Prompt /> qotm
			</div>
			<div className="mt-[1.5em] flex gap-[2ch] pl-[2ch]">
				<span aria-hidden="true" className="w-[5ch] shrink-0 whitespace-pre text-dark-accent">
					{'▄▄ ▄▄\n▀█ ▀█'}
				</span>
				<div className="min-w-0 max-w-[60ch]">
					<div className="font-semibold text-balance">{text}</div>
					<div className="mt-[1.5em] whitespace-pre-wrap text-dark-muted">
						<span className="text-dark-accent">—</span>
						{`  ${author}  ·  ${paths.quote(id).slice(1)}`}
					</div>
				</div>
			</div>
			<div className="mt-4">
				<Prompt />
				<Cursor />
			</div>
		</Terminal>
	);
}

/** The desktop index: sticky beside the docs, the current section marked. */
function Index({ current }: { current: string }) {
	return (
		<nav aria-label="On this page" className="sticky top-6 self-start pt-1 narrow:hidden">
			<Eyebrow>On this page</Eyebrow>
			<ol className="m-0 flex list-none flex-col border-l border-border p-0">
				{sections.map((s, i) => {
					const on = s.id === current;
					return (
						<li key={s.id}>
							<a
								href={`#${s.id}`}
								aria-current={on ? 'location' : undefined}
								className={cn(
									'tap -ml-px flex gap-2.5 border-l-2 border-transparent py-1.5 pl-3.5 text-[14px]/[20px] no-underline',
									on ? 'border-clay-600 font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
								)}
							>
								<span
									className={cn('w-5 flex-none font-mono text-[12px]/[20px]', on ? 'text-clay-600' : 'text-stone-400')}
								>
									{String(i + 1).padStart(2, '0')}
								</span>
								{s.label}
							</a>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

/** A phone's index: a bar at the top of the window naming the section, opening the list. */
function JumpMenu({ current }: { current: string }) {
	const [open, setOpen] = useState(false);
	const index = sections.findIndex((s) => s.id === current);
	return (
		<nav
			aria-label="On this page"
			className="sticky top-0 z-20 -mx-page border-y border-border bg-background px-page py-2.5 roomy:hidden"
		>
			<button
				type="button"
				aria-expanded={open}
				aria-controls="cli-jump"
				onClick={() => setOpen(!open)}
				className="flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-field border border-border bg-card px-3.5 text-left"
			>
				<span className="font-mono text-[12px] tracking-[0.14em] text-muted-foreground uppercase">On this page</span>
				<span className="font-mono text-[12px] text-clay-600">{String(index + 1).padStart(2, '0')}</span>
				<span className="min-w-0 flex-1 truncate text-[14px] font-medium">{sections[index].label}</span>
				<span aria-hidden="true" className={cn('font-mono text-[13px] text-muted-foreground', open && 'rotate-180')}>
					{glyph('⌄')}
				</span>
			</button>
			{open ? (
				<ol id="cli-jump" className="m-0 mt-2 flex list-none flex-col rounded-field border border-border bg-card p-1.5">
					{sections.map((s, i) => (
						<li key={s.id}>
							<a
								href={`#${s.id}`}
								onClick={() => setOpen(false)}
								aria-current={s.id === current ? 'location' : undefined}
								className="tap flex gap-2.5 rounded-[6px] px-2.5 py-2.5 text-[15px]/[1.4] text-foreground no-underline hover:bg-background"
							>
								<span className="w-5 flex-none font-mono text-[12px]/[21px] text-stone-600">
									{String(i + 1).padStart(2, '0')}
								</span>
								{s.label}
							</a>
						</li>
					))}
				</ol>
			) : null}
		</nav>
	);
}

/**
 * /cli (canvas "CLI docs"): the command-line tool, from installing it to
 * submitting a quote. Its text is `features/cli/docs.ts`, which the web
 * server also renders for crawlers; the CLI's README is the full reference.
 */
export function CliRoute() {
	const current = useCurrentSection();
	return (
		<>
			<PageMeta title={CLI_DOC.title} description={CLI_DOC.description} />
			<section className="grid grid-cols-[minmax(0,1fr)_456px] items-start gap-12 pt-section pb-14 narrow:grid-cols-1 narrow:pt-9 narrow:pb-7">
				<div className="flex flex-col gap-5 pt-1.5">
					<Eyebrow className="mb-0">The CLI · qotm 2.0</Eyebrow>
					<h1 className="m-0 text-display narrow:text-[38px]/[1.05]">{CLI_DOC.heading}</h1>
					<p className="m-0 max-w-[440px] text-[17px] text-muted-foreground">{CLI_DOC.lede}</p>
					<div className="flex flex-col gap-3 pt-2">
						<div className="flex flex-wrap items-center gap-3.5">
							<InstallPill copyable />
							<TextLink href={CLI_DOC.repo} mono>
								on GitHub {glyph('↗')}
							</TextLink>
						</div>
						<p className="m-0 font-mono text-[13px] text-muted-foreground">{CLI_DOC.requirements}</p>
					</div>
				</div>
				<FirstRun />
			</section>

			<JumpMenu current={current} />

			<div className="grid grid-cols-[200px_minmax(0,1fr)] gap-16 border-t border-border pt-12 pb-24 narrow:grid-cols-1 narrow:border-t-0 narrow:pt-8">
				<Index current={current} />
				<div className="flex min-w-0 flex-col gap-14">
					{sections.map((s, i) => (
						<section
							key={s.id}
							id={s.id}
							aria-labelledby={`${s.id}-heading`}
							className="flex scroll-mt-6 flex-col gap-4 narrow:scroll-mt-24"
						>
							<Eyebrow tone="clay" className="mb-0">
								{eyebrowOf(i, s)}
							</Eyebrow>
							<h2
								id={`${s.id}-heading`}
								className="m-0 text-[28px]/[34px] font-semibold tracking-[-0.01em] font-display narrow:text-h2"
							>
								{s.heading}
							</h2>
							{s.blocks.map((b, j) => (
								<CliBlockView key={j} block={b} />
							))}
						</section>
					))}
					<aside className="flex items-center gap-4 rounded-card bg-clay-100 px-[22px] py-5 narrow:flex-col narrow:items-start narrow:gap-2">
						<div className="flex flex-1 flex-col gap-0.5">
							<span className="text-[15px]/[22px] font-medium">Something here not matching what you see?</span>
							<span className="text-[14px]/[21px] text-clay-700">
								The CLI is open source. Issues and fixes are welcome.
							</span>
						</div>
						<TextLink href={`${CLI_DOC.repo}/issues`} mono className="text-clay-700">
							github.com/qotm/cli {glyph('↗')}
						</TextLink>
					</aside>
				</div>
			</div>
		</>
	);
}
