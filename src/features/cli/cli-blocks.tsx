import { Fragment, useState } from 'react';
import { Link } from 'react-router';
import { Badge, CopyStatus, Kbd, Notice, Tabs, cn, copyHint, glyph, useCopy } from '@/shared/ui';
import { inline } from '@/features/legal/inline';
import type { CliBlock, CliLine } from './docs';

/** The docs' inline markup: `code` as a key chip, links in the app or out. */
export function Rich({ source }: { source: string }) {
	return (
		<>
			{inline(source).map((part, i) =>
				'strong' in part ? (
					<b key={i} className="font-medium">
						{part.strong}
					</b>
				) : 'code' in part ? (
					<Kbd key={i} className="text-foreground">
						{part.code}
					</Kbd>
				) : 'link' in part ? (
					part.href.startsWith('/') ? (
						<Link key={i} to={part.href} className="text-inherit underline underline-offset-2">
							{part.link}
						</Link>
					) : (
						<a key={i} href={part.href} className="text-inherit underline underline-offset-2">
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

/** The "copy" button on ink, as the kit's CommandBlock draws it. */
function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
	const [state, copy] = useCopy(text);
	return (
		<>
			<button
				type="button"
				onClick={copy}
				aria-label={label}
				className={cn(
					'tap flex-none cursor-pointer rounded-control border border-dark-rule bg-transparent px-2.5 py-1 font-mono text-[13px]/[1.6] text-stone-400 transition-colors duration-[180ms] hover:border-stone-600 hover:text-dark-foreground',
					className
				)}
			>
				{copyHint(state)}
			</button>
			<CopyStatus state={state} text={text} />
		</>
	);
}

const ink = 'rounded-field bg-dark font-mono text-dark-foreground';

/** Commands on ink, a note beside each (under it on a phone). */
function Commands({ lines, copy }: { lines: CliLine[]; copy?: boolean }) {
	const text = lines.map((l) => l.command).join('\n');
	return (
		<div className={cn(ink, 'flex items-start gap-3 py-4 pr-3 pl-[18px]')}>
			<div className="grid min-w-0 flex-1 grid-cols-[auto_auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1.5 overflow-x-auto narrow:grid-cols-[auto_minmax(0,1fr)] narrow:gap-y-0">
				{lines.map((l) => (
					<Fragment key={l.command}>
						<span aria-hidden="true" className="text-[14px]/[22px] text-dark-accent">
							$
						</span>
						<code className="text-[14px]/[22px] whitespace-nowrap">{l.command}</code>
						{l.note ? (
							<span className="pl-4 text-[13px]/[22px] text-dark-muted narrow:col-start-2 narrow:mb-2 narrow:pl-0">
								# {l.note}
							</span>
						) : (
							<span className="narrow:hidden" />
						)}
					</Fragment>
				))}
			</div>
			{copy ? <CopyButton text={text} label={`Copy ${lines.map((l) => l.command).join(' and ')}`} /> : null}
		</div>
	);
}

/** One line per shell, under tabs, with where it goes. */
function Shells({ shells }: { shells: Extract<CliBlock, { shells: unknown }>['shells'] }) {
	const [active, setActive] = useState(shells[0].id);
	const shell = shells.find((s) => s.id === active) ?? shells[0];
	return (
		<div className={ink}>
			<div className="flex items-center gap-3 border-b border-dark-rule pr-3 pl-[18px] pt-3">
				<Tabs
					dark
					label="Shell"
					items={shells.map((s) => ({ id: s.id, label: s.label }))}
					active={shell.id}
					onSelect={setActive}
					className="min-w-0 flex-1 border-b-0 pointer-coarse:[&_[role=tab]]:px-2.5"
				/>
				<CopyButton text={shell.line} label={`Copy the ${shell.label} line`} className="mb-2.5" />
			</div>
			<div role="tabpanel" aria-label={shell.label} className="flex flex-col gap-1.5 px-[18px] pt-4 pb-[18px]">
				<span className="text-[13px]/[20px] text-dark-muted"># the end of {shell.file}</span>
				<code className="overflow-x-auto text-[14px]/[22px] whitespace-nowrap">{shell.line}</code>
			</div>
		</div>
	);
}

/** What a command prints, with what it promises beside it. */
function Output({ block }: { block: Extract<CliBlock, { output: unknown }> }) {
	const { command, lines, result } = block.output;
	return (
		<div className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-5 narrow:grid-cols-1">
			<div className={cn(ink, 'flex flex-col gap-1 px-[18px] py-4', !block.checks && 'col-span-2 narrow:col-span-1')}>
				<div className="flex gap-2.5 pb-1.5">
					<span aria-hidden="true" className="text-[14px]/[22px] text-dark-accent">
						$
					</span>
					<code className="min-w-0 overflow-x-auto text-[14px]/[22px] whitespace-pre">{command}</code>
				</div>
				{result ? <span className="text-[13px]/[21px]">{result}</span> : null}
				{lines.map((line) => (
					<span key={line} className="text-[13px]/[21px] whitespace-pre-wrap text-dark-muted">
						{line}
					</span>
				))}
			</div>
			{block.checks ? (
				<ul className="m-0 flex w-[280px] list-none flex-col gap-3 p-0 py-1 narrow:w-auto">
					{block.checks.map((c) => (
						<li key={c} className="flex gap-2.5 text-[14px]/[21px] text-muted-foreground">
							<span aria-hidden="true" className="w-3.5 flex-none font-mono text-[13px] text-clay-600">
								{glyph('✓')}
							</span>
							{c}
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}

/** A command per row and what it does: two lanes, stacked on a phone. */
function Reference({ rows }: { rows: CliLine[] }) {
	return (
		<dl className="m-0 rounded-card border border-border bg-card">
			{rows.map((r) => (
				<div
					key={r.command}
					className="grid grid-cols-[240px_minmax(0,1fr)] gap-5 border-b border-border px-5 py-[13px] last:border-b-0 narrow:grid-cols-1 narrow:gap-1 narrow:px-4"
				>
					<dt className="font-mono text-[14px]/[22px] text-foreground">{r.command}</dt>
					<dd className="m-0 text-[15px]/[22px] text-muted-foreground">{r.note ? <Rich source={r.note} /> : null}</dd>
				</div>
			))}
		</dl>
	);
}

/** `qotm login`'s code beside qotm.dev/device, where it is approved. */
function Device({ code, handle }: { code: string; handle: string }) {
	return (
		<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3.5 narrow:grid-cols-1">
			<div className={cn(ink, 'flex h-full flex-col gap-2 px-[18px] py-4')}>
				<div className="flex gap-2.5 text-[14px]/[22px]">
					<span aria-hidden="true" className="text-dark-accent">
						$
					</span>
					<code>qotm login</code>
				</div>
				<span className="text-[13px]/[20px] text-dark-muted">open qotm.dev/device and enter:</span>
				<span className="py-1 text-[22px]/[30px] font-semibold tracking-[0.12em]">{code}</span>
				<span className="text-[13px]/[20px] text-dark-muted">waiting for you to approve…</span>
			</div>
			<span aria-hidden="true" className="justify-self-center font-mono text-[18px] text-clay-600 narrow:rotate-90">
				{glyph('→')}
			</span>
			<div className="flex h-full flex-col gap-2.5 rounded-card border border-border bg-card px-[18px] py-4">
				<span className="font-mono text-[12px]/[18px] tracking-[0.14em] text-clay-600 uppercase">qotm.dev/device</span>
				<span className="text-[14px]/[20px]">Your terminal is asking to sign in as @{handle}.</span>
				<span className="rounded-control border border-border bg-background py-2 text-center font-mono text-[18px] tracking-[0.12em]">
					{code}
				</span>
				<span className="flex items-center gap-3 text-[13px]" aria-hidden="true">
					<span className="rounded-control bg-dark px-3 py-[7px] font-medium text-dark-foreground">
						Approve this device
					</span>
					<span className="text-muted-foreground">Deny</span>
				</span>
			</div>
		</div>
	);
}

/** Flags side by side, each with what it does. */
function Options({ rows }: { rows: CliLine[] }) {
	return (
		<dl className="m-0 grid grid-cols-3 gap-6 narrow:grid-cols-1 narrow:gap-4">
			{rows.map((r) => (
				<div key={r.command} className="flex flex-col gap-1">
					<dt className="font-mono text-[13px]/[21px] text-foreground">{r.command}</dt>
					<dd className="m-0 text-[14px]/[21px] text-muted-foreground">{r.note}</dd>
				</div>
			))}
		</dl>
	);
}

/** The four render styles, each as qotm draws it. */
function Styles({ styles }: { styles: Extract<CliBlock, { styles: unknown }>['styles'] }) {
	return (
		<div className="grid grid-cols-2 gap-3 narrow:grid-cols-1">
			{styles.map((s) => (
				<figure key={s.id} className="m-0 flex flex-col gap-2">
					<figcaption className="flex items-center gap-2 font-mono text-[13px]/[20px]">
						{s.id}
						{s.default ? <Badge tone="clay">default</Badge> : null}
					</figcaption>
					<div className={cn(ink, 'flex flex-1 items-center overflow-x-auto p-4')}>
						<pre
							aria-label={`The ${s.id} style`}
							className="m-0 font-mono text-[12px]/[18px] whitespace-pre text-dark-foreground"
						>
							{s.render}
						</pre>
					</div>
				</figure>
			))}
		</div>
	);
}

/** Where the files live, per system. */
function Paths({ rows }: { rows: Extract<CliBlock, { paths: unknown }>['paths'] }) {
	const label = 'font-mono text-[12px]/[18px] tracking-[0.14em] text-muted-foreground uppercase';
	return (
		<table className="w-full border-separate border-spacing-0 rounded-card border border-border bg-card text-left">
			<thead className="narrow:sr-only">
				<tr>
					<th className="w-[84px] px-5 py-2.5 font-normal">
						<span className="sr-only">System</span>
					</th>
					<th className={cn(label, 'px-5 py-2.5 font-normal')}>Settings, session</th>
					<th className={cn(label, 'px-5 py-2.5 font-normal')}>Dataset, favorites, history</th>
				</tr>
			</thead>
			<tbody>
				{rows.map((r) => (
					<tr key={r.os} className="narrow:flex narrow:flex-col narrow:gap-1 narrow:px-4 narrow:py-3">
						<th
							scope="row"
							className="border-t border-border px-5 py-[11px] text-[14px]/[21px] font-medium narrow:border-0 narrow:p-0"
						>
							{r.os}
						</th>
						<td className="border-t border-border px-5 py-[11px] font-mono text-[13px]/[21px] break-all narrow:border-0 narrow:p-0">
							<span className="mr-2 font-sans text-[12px] text-muted-foreground roomy:hidden">settings</span>
							{r.config}
						</td>
						<td className="border-t border-border px-5 py-[11px] font-mono text-[13px]/[21px] break-all narrow:border-0 narrow:p-0">
							<span className="mr-2 font-sans text-[12px] text-muted-foreground roomy:hidden">data</span>
							{r.data}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

/** One block of a section. */
export function CliBlockView({ block }: { block: CliBlock }) {
	if (typeof block === 'string')
		return (
			<p className="m-0 max-w-[620px] text-[16px]/[26px]">
				<Rich source={block} />
			</p>
		);
	if ('commands' in block) return <Commands lines={block.commands} copy={block.copy} />;
	if ('shells' in block) return <Shells shells={block.shells} />;
	if ('output' in block) return <Output block={block} />;
	if ('reference' in block) return <Reference rows={block.reference} />;
	if ('device' in block) return <Device {...block.device} />;
	if ('options' in block) return <Options rows={block.options} />;
	if ('styles' in block) return <Styles styles={block.styles} />;
	if ('paths' in block) return <Paths rows={block.paths} />;
	if ('tip' in block)
		return (
			<p className="m-0 border-l-2 border-clay-100 pl-4 text-[14px]/[22px] text-muted-foreground">
				<Rich source={block.tip} />
			</p>
		);
	return (
		<Notice tone="info">
			<Rich source={block.note} />
		</Notice>
	);
}
