---
name: add-component
description: Add or restyle a component in this app's UI kit (src/shared/ui) — variants with cva, the cn helper, theme tokens only, exported from the kit's index. Use when a screen needs a control or block the kit does not have, when a design system defines a component to implement, or when asked to "add a Badge/Tabs/Avatar component" or "restyle the button to match the design".
---

# Add a UI kit component

The kit is `src/shared/ui/components/ui/`. `button.tsx` is the pattern: read
it first.

1. **Check the kit first.** If an existing component covers it with a new
   variant, add the variant rather than a second component.

2. **Write it** in `src/shared/ui/components/ui/<name>.tsx`:

   ```tsx
   import { cva, type VariantProps } from 'class-variance-authority';
   import { cn } from '../../lib/utils';

   const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', {
   	variants: {
   		tone: {
   			neutral: 'bg-muted text-muted-foreground',
   			accent: 'bg-accent text-accent-foreground'
   		}
   	},
   	defaultVariants: { tone: 'neutral' }
   });

   export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

   export function Badge({ className, tone, ...props }: BadgeProps) {
   	return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
   }
   ```

   - **Theme tokens only**: semantic utilities (`bg-primary`,
     `text-primary-foreground`, `bg-card`, `border-border`, `ring-ring`,
     `bg-scrim`), never hex values or arbitrary colours. A colour the design
     needs that has no token is a token to add in
     `src/shared/ui/styles/globals.css` (both `:root` and `.dark` where the
     app has a dark theme, plus its `@theme inline` line), not a literal.
   - Accept `className` and merge it with `cn()` last, so callers can adjust
     layout.
   - Use Radix primitives (`Slot` for `asChild`, popover, select…) for
     anything interactive with focus or keyboard behaviour.
   - Real elements: `<button>`, `<a>`, `<input>` with a `<label>`;
     `aria-label` on icon-only buttons; a visible focus ring
     (`focus-visible:ring-2 ring-ring`).

3. **Export it** from `src/shared/ui/index.ts`.

4. **Check** with `yarn typecheck && yarn lint`, and look at it in both
   themes (if the app has two) and at phone width in the screen that uses it.

When implementing a design system's component, match its spec (sizes, radii,
states) through the tokens; if the design system's values differ from the
theme, fix the theme tokens once rather than overriding per component.
