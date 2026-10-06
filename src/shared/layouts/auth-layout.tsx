import type { ReactNode } from 'react';
import { Logo, LogoMark, ThemeToggle } from '@/shared/ui';

/**
 * Brand-panel watermark, per the design system's Watermark guideline: one large
 * mark, offset, clear of all text, never tiled — "felt, not read".
 *
 * Inline SVG (`LogoMark` fills with `currentColor`), so it costs no request and
 * inverts with the theme for free: ink on the sage panel, near-white on the ink
 * one. The DS quotes 6–8% ink, but that assumes a light surface — the dark panel
 * is far darker, so the same alpha reads ~45% stronger against it. Measured in
 * CIELAB against each panel colour and matched: 0.07 light gives ΔE 5.4, 0.05
 * dark gives ΔE 5.6. Don't "simplify" these to one value.
 *
 * `-z-10` under the panel's `isolate` puts it behind the copy while staying above
 * the panel's own background; without `isolate` the negative z-index would sink
 * below it and disappear.
 */
function BrandWatermark() {
	return (
		<div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
			{/*
			 * Size and offset are load-bearing, and every value here came from looking
			 * at it rather than reasoning about it:
			 * - 460px left only a corner fragment on-panel, so it read as stray grey
			 *   rectangles rather than the monogram.
			 * - 300px read correctly at 1280 but the dot poked out past the teaser
			 *   card's right edge; the guideline is explicit that it stays clear.
			 * - 240px clears the card at 1280 — but not at 1024, where the panel is
			 *   only 512px wide. The card is 340px inside 48px padding, so it owns the
			 *   left 388px and *any* legible mark overlaps it horizontally there. The
			 *   only way to clear is vertically, hence the smaller `lg` size that fits
			 *   in the ~155px below the card, going full size from `xl`.
			 *
			 * Sized in CSS, not the `width` prop, so it can be responsive — the classes
			 * override the SVG's width/height attributes and the viewBox keeps the ratio.
			 * Re-check both breakpoints if the card's width or the panel padding changes.
			 */}
			<LogoMark
				width={240}
				className="absolute -bottom-4 -right-4 h-auto w-40 text-foreground opacity-[0.07] dark:opacity-[0.05] xl:w-60"
			/>
		</div>
	);
}

/**
 * Product teaser — the brand panel's signature element. Shows a prospective user
 * what the product does instead of decorating around them, and costs nothing:
 * the sparkline is inline SVG, no image request.
 *
 * Replace the copy and the figure with your own; keep the shape. **The numbers
 * are illustrative, not anyone's data**, which is why the visually-hidden
 * "Example" prefix is here — without it a screen reader announces a fabricated
 * figure as fact.
 *
 * Brand green on the line doesn't conflict with "green is for CTAs": `--primary`
 * is the same hex in both themes, so the card needs no per-theme handling, and
 * the surrounding surfaces do.
 */
const SPARK = 'M0,44 C24,40 40,46 62,38 C86,29 102,34 124,27 C148,19 166,24 190,17 C214,11 236,14 256,9 L280,6';

function ProductTeaser() {
	return (
		<div className="mt-7 max-w-[340px] rounded-[20px] bg-card px-5 py-[18px]">
			<div className="flex items-baseline justify-between gap-2.5">
				<span className="text-[11px] font-semibold uppercase leading-[15px] tracking-[0.07em] text-mute">
					<span className="sr-only">Example: </span>This month
				</span>
				<span className="text-[11.5px] font-semibold leading-4 text-positive">▲ +18.4%</span>
			</div>
			<div className="mt-1.5 text-[26px] font-extrabold leading-8 tracking-[-0.02em] tabular-nums text-foreground">
				42,830.16
			</div>
			<svg viewBox="0 0 280 56" className="mt-2.5 h-14 w-full" aria-hidden="true">
				{/* Area first so the stroke sits on top of it. */}
				<path d={`${SPARK} L280,56 L0,56 Z`} className="fill-primary opacity-12" />
				<path d={SPARK} fill="none" strokeWidth="2.5" className="stroke-primary" />
			</svg>
			<p className="mt-1.5 text-[10.5px] leading-[15px] text-mute">Illustrative figures · replace with your own</p>
		</div>
	);
}

type AuthLayoutProps = {
	children: ReactNode;
	/** Optional brand-panel content (headline / illustration). */
	aside?: ReactNode;
};

/**
 * Split auth shell (Wise pattern): sage brand panel on the left at desktop,
 * form panel on the right; stacked to a single centered column on mobile.
 * No shadows — the form sits on the page/card surface via contrast.
 */
export function AuthLayout({ children, aside }: AuthLayoutProps) {
	return (
		<div className="min-h-screen w-full bg-background lg:grid lg:grid-cols-2">
			{/*
			 * `isolate` so the watermark's -z-10 stays above the panel background.
			 *
			 * `my-auto` on the content block rather than `justify-between` on the panel:
			 * the footer line used to anchor the bottom, so with it gone space-between
			 * would drop the headline to the floor.
			 */}
			<aside className="relative isolate hidden flex-col gap-10 bg-brand-panel p-12 lg:flex">
				<BrandWatermark />
				<Logo />
				<div className="my-auto max-w-md">
					{aside ?? (
						<>
							<h1 className="font-display text-4xl font-black leading-[1.06] tracking-tight text-foreground">
								One line on why you exist.
							</h1>
							<p className="mt-4 max-w-sm text-body">
								A sentence of supporting copy, written for someone who has never heard of this product.
							</p>
							<ProductTeaser />
						</>
					)}
				</div>
			</aside>
			{/*
			 * The auth app has no topbar, so the toggle rides the form panel. Placed
			 * here rather than per-route because every auth screen goes through this
			 * layout. `relative` on the panel keeps it inside the right-hand column at
			 * desktop instead of over the brand panel.
			 */}
			<main className="relative flex min-h-screen items-center justify-center p-6">
				<div className="absolute right-4 top-4">
					<ThemeToggle />
				</div>
				<div className="w-full max-w-md">{children}</div>
			</main>
		</div>
	);
}
