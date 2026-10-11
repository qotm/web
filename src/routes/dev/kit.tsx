import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { Button, IconButton, Kbd, PageMeta, TextLink } from '@/shared/ui';

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

const KIT_SECTIONS: Record<string, ReactNode> = {
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
				<section key={name} data-kit={name} className="flex flex-col gap-4 p-6">
					{only ? null : <h2 className="text-label text-muted-foreground">{name}</h2>}
					{KIT_SECTIONS[name]}
				</section>
			))}
		</main>
	);
}
