import * as React from 'react';
import dividerSvg from '../brand/svg/divider.svg';
import markSvg from '../brand/svg/between-commands.svg';
import { cn } from '../../lib/utils';

type DividerProps = {
	/** `rule`: a hairline. `graphic`: the brand's divider. `mark`: the between-commands mark, centred. */
	variant?: 'rule' | 'graphic' | 'mark';
	/** Space above and below (any CSS length); the kit's default is 32px. */
	gap?: string;
	className?: string;
	style?: React.CSSProperties;
};

/** qotm_kit Divider. Decorative: hidden from assistive tech. */
function Divider({ variant = 'rule', gap = 'var(--spacing-page)', className, style }: DividerProps) {
	if (variant === 'rule')
		return <hr className={cn('border-0 border-t border-border', className)} style={{ margin: `${gap} 0`, ...style }} />;
	const graphic = variant === 'graphic';
	return (
		<img
			src={graphic ? dividerSvg : markSvg}
			alt=""
			className={cn('block', graphic ? 'w-full' : 'h-6', className)}
			style={{ margin: `${gap} ${graphic ? '0' : 'auto'}`, ...style }}
		/>
	);
}

export { Divider };
export type { DividerProps };
