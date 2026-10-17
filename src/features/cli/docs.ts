/**
 * The CLI's documentation (/cli, canvas "CLI docs"), as data. Plain (no
 * imports): the web image's server renders it for crawlers too. Inline markup
 * is the legal documents' (`**strong**`, `` `code` ``, `[text](href)`; see
 * `features/legal/inline.ts`).
 *
 * The CLI's README (qotm/cli) is the full reference; this is the friendlier
 * tour of it. When a command, a flag or what the CLI prints changes there,
 * change it here in the same release. Every output shown is what qotm 2.0
 * prints.
 */

/** One command line: `$ command  # note`. */
export type CliLine = { command: string; note?: string };

export type CliBlock =
	/** A paragraph. */
	| string
	/** Commands on ink, their notes in a lane beside them; `copy` copies the commands. */
	| { commands: CliLine[]; copy?: boolean }
	/** A command and what it prints; `checks` beside it. */
	| { output: { command: string; lines: string[]; result?: string }; checks?: string[] }
	/** A command per row with what it does, on a card. */
	| { reference: CliLine[] }
	/** A line for each shell's startup file. */
	| { shells: { id: string; label: string; file: string; line: string }[] }
	/** The terminal's code beside the browser's approval. */
	| { device: { code: string; handle: string } }
	/** Flags side by side. */
	| { options: CliLine[] }
	/** The render styles, as qotm draws them. */
	| { styles: { id: string; render: string; default?: boolean }[] }
	/** Where the files live. */
	| { paths: { os: string; config: string; data: string }[] }
	/** A quieter aside, with a clay rule. */
	| { tip: string }
	/** A boxed note. */
	| { note: string };

export type CliSection = {
	id: string;
	/** The index's label and the eyebrow's ("01 · Install"). */
	label: string;
	heading: string;
	blocks: CliBlock[];
};

export const CLI_DOC = {
	path: '/cli',
	title: 'The CLI',
	heading: 'qotm in your terminal.',
	description:
		'How to install qotm, show a quote in every new terminal, keep favorites, sync releases, sign in and submit quotes from the command line.',
	lede: 'Everything the command does, from the first quote to submitting your own. It reads a local copy of the curated dataset, so the default path needs no account and no network.',
	requirements: 'Node 22.16+ or 24 · macOS, Linux, Windows · MIT',
	repo: 'https://github.com/qotm/cli',
	/** ISO date the text last changed: the sitemap's lastmod. */
	updated: '2026-10-17',
	/** The hero terminal's quote: one in the current release, as `qotm` prints it. */
	sample: { text: 'Software gets slower faster than hardware gets faster.', author: 'Niklaus Wirth', id: 'q_7yiikl' },
	sections: [
		{
			id: 'install',
			label: 'Install',
			heading: 'One command, then it’s yours.',
			blocks: [
				'qotm needs Node.js 22.16 or later, or 24. It installs as one file with nothing to build, and ships with a copy of the curated dataset, so the first quote works offline.',
				{
					commands: [
						{ command: 'npm i -g qotm', note: 'pnpm and bun work too' },
						{ command: 'qotm', note: 'your first quote' }
					],
					copy: true
				},
				{
					note: 'Upgrading from qotm 1.x? The same command installs 2.0, a rewrite: the commands below replace the old ones.'
				}
			]
		},
		{
			id: 'every-terminal',
			label: 'Every new terminal',
			heading: 'A thought between commands.',
			blocks: [
				'Add one line to your shell’s startup file and every new terminal opens with a quote. It reads the local copy, so it costs no network and no wait, and it avoids the last 50 you saw.',
				{
					shells: [
						{ id: 'zsh', label: 'zsh', file: '~/.zshrc', line: 'command -v qotm >/dev/null && qotm' },
						{
							id: 'bash',
							label: 'bash',
							file: '~/.bashrc',
							line: '[[ $- == *i* ]] && command -v qotm >/dev/null && qotm'
						},
						{
							id: 'fish',
							label: 'fish',
							file: '~/.config/fish/config.fish',
							line: 'status is-interactive; and type -q qotm; and qotm'
						},
						{
							id: 'powershell',
							label: 'PowerShell',
							file: '$PROFILE',
							line: 'if (Get-Command qotm -ErrorAction SilentlyContinue) { qotm }'
						}
					]
				},
				{
					tip: 'The guard skips it where qotm isn’t installed, so the line is safe in shared dotfiles. Prefer it quieter? `qotm config set style slab` draws a lighter panel, and `--plain` prints just the words.'
				}
			]
		},
		{
			id: 'reading',
			label: 'Reading quotes',
			heading: 'Narrow it down, or go back.',
			blocks: [
				{
					reference: [
						{ command: 'qotm', note: 'A quote you haven’t seen lately.' },
						{ command: 'qotm --topic debugging', note: 'From one topic. The slugs are on [qotm.dev/topics](/topics).' },
						{ command: 'qotm --author dijkstra', note: 'By one author.' },
						{ command: 'qotm --source', note: 'With where it comes from: the work, the year, the link.' },
						{ command: 'qotm last', note: 'The previous quote again.' },
						{ command: 'qotm open', note: 'Its page on qotm.dev: the source, the context, who checked it.' },
						{ command: 'qotm search complexity', note: 'Search your copy, offline. `--web` searches qotm.dev.' }
					]
				}
			]
		},
		{
			id: 'favorites',
			label: 'Favorites',
			heading: 'Keep the ones that stay with you.',
			blocks: [
				'Favorites and private quotes live on this machine and work offline. Sign in and they follow you: a save goes up straight away, and favorites from qotm.dev come down with the next sync.',
				{
					commands: [
						{ command: 'qotm save', note: 'the quote you just saw' },
						{ command: 'qotm favorites', note: 'list them' },
						{ command: 'qotm --favorites', note: 'a quote from them' },
						{ command: 'qotm add "Name things twice." --author Ada', note: 'a private quote' }
					]
				}
			]
		},
		{
			id: 'sync',
			label: 'Staying current',
			heading: 'New quotes arrive in releases.',
			blocks: [
				'Curators publish a dataset release when a batch of quotes has been checked. `qotm sync` fetches the latest; your copy never changes behind your back.',
				{
					output: {
						command: 'qotm sync',
						lines: ['synced v2026.11.1: 540 quotes', '(+41 new, ~2 corrected, −3 withdrawn)']
					},
					checks: [
						'Checked against the release’s size and sha256 before it’s used.',
						'Swapped in one step: an interrupted download changes nothing.',
						'Already current? One small request, nothing downloaded.'
					]
				}
			]
		},
		{
			id: 'account',
			label: 'Your account',
			heading: 'Sign in without a password.',
			blocks: [
				'An account syncs favorites and lets you submit. The terminal never sees a password: `qotm login` prints a code, and you approve it on qotm.dev, where you’re already signed in.',
				{ device: { code: 'QTM-7F3K', handle: 'ada' } },
				{
					tip: '`qotm logout` signs out and revokes this terminal; your local quotes and favorites stay. Every signed-in terminal is listed under [Settings › Terminals](/settings).'
				}
			]
		},
		{
			id: 'submitting',
			label: 'Submitting',
			heading: 'Found one? Send it with its source.',
			blocks: [
				'Someone else’s words go to a verifier, who checks the source. Your own words get an originality check. Curators then pick what ships in the next release.',
				{
					output: {
						command:
							'qotm submit \\\n  "Fancy algorithms are slow when n is small, and n is usually small." \\\n  --author "Rob Pike" --source "Notes on Programming in C" \\\n  --year 1989 --topic software-design',
						result: 'submitted q_3vd1k8 (submitted)',
						lines: ['A verifier checks the source; you get an email when they have decided. https://qotm.dev/my-quotes']
					}
				},
				{
					options: [
						{ command: '--check', note: 'Only asks whether qotm has it already. Nothing is sent.' },
						{ command: '--original --rights', note: 'Your own words, credited to your handle.' },
						{ command: 'qotm submit p_…', note: 'Turns one of your private quotes into an original.' }
					]
				}
			]
		},
		{
			id: 'settings',
			label: 'Settings & files',
			heading: 'Four ways to draw a quote.',
			blocks: [
				'Pick one with `qotm config set style`, or try one once with `--style`. Piped output is always plain text: the words and the credit.',
				{
					styles: [
						{
							id: 'pull',
							default: true,
							render:
								'▄▄ ▄▄  Software gets slower faster\n▀█ ▀█  than hardware gets faster.\n\n       —  Niklaus Wirth  ·  q/7yiikl'
						},
						{
							id: 'card',
							render:
								'╭─────────────────────────────────────╮\n│     Software gets slower faster     │\n│     than hardware gets faster.      │\n│                 ──                  │\n│            Niklaus Wirth            │\n╰─ q/7yiikl ────────────── ✓ curated ─╯'
						},
						{
							id: 'slab',
							render:
								'▌   Software gets slower faster\n▌   than hardware gets faster.\n▌\n▌   — Niklaus Wirth\n  software engineering · ✓ curated · q/7yiikl'
						},
						{
							id: 'bubble',
							render:
								'╭─────────────────────────────────╮\n│   Software gets slower faster   │\n│   than hardware gets faster.    │\n│               — Niklaus Wirth   │\n╰──┬──────────────────────────────╯\n   │\n    ▄▄▄▄▄\n  ▄▀     ▀▄\n  █       █\n  ▀▄     ▄█\n    ▀▀▀▀▀ █\n          ▀▄▄'
						}
					]
				},
				'Everything else lives in two folders. `qotm config` shows and changes the settings; `QOTM_HOME` puts both folders in one place.',
				{
					paths: [
						{ os: 'Linux', config: '~/.config/qotm', data: '~/.local/share/qotm' },
						{ os: 'macOS', config: '~/Library/Preferences/qotm', data: '~/Library/Application Support/qotm' },
						{ os: 'Windows', config: '%APPDATA%\\qotm\\Config', data: '%LOCALAPPDATA%\\qotm\\Data' }
					]
				}
			]
		},
		{
			id: 'doctor',
			label: 'When something’s off',
			heading: 'Ask the doctor.',
			blocks: [
				'It checks Node, both folders, your copy’s sha256 and the API, and names whatever is wrong. Paste its output into an issue and we’ll know where to look.',
				{
					output: {
						command: 'qotm doctor',
						lines: [
							'✓ node          v24.16.0',
							'✓ config folder ~/.config/qotm',
							'✓ data folder   ~/.local/share/qotm',
							'✓ dataset       v2026.11.1, 540 quotes, sha256 ok',
							'✓ api           https://api.qotm.dev answers'
						],
						result: 'all good'
					}
				}
			]
		}
	] satisfies CliSection[]
};

/** "01 · Install". */
export const eyebrowOf = (index: number, section: CliSection) =>
	`${String(index + 1).padStart(2, '0')} · ${section.label}`;
