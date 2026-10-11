import * as React from 'react';
import horizontal from './svg/qotm-horizontal.svg';
import horizontalWhite from './svg/qotm-horizontal-white.svg';
import stacked from './svg/qotm-stacked.svg';
import stackedWhite from './svg/qotm-stacked-white.svg';
import symbol from './svg/qotm-symbol.svg';
import symbolWhite from './svg/qotm-symbol-white.svg';
import wordmark from './svg/qotm-wordmark.svg';
import wordmarkWhite from './svg/qotm-wordmark-white.svg';
import { cn } from '../../lib/utils';

/** Each lockup's [on paper, reversed on ink] artwork, from qotm_kit. */
const LOCKUPS = {
	symbol: [symbol, symbolWhite],
	wordmark: [wordmark, wordmarkWhite],
	horizontal: [horizontal, horizontalWhite],
	stacked: [stacked, stackedWhite]
} as const;

type LogoProps = Omit<React.ComponentProps<'img'>, 'src' | 'height'> & {
	lockup?: keyof typeof LOCKUPS;
	/** The white artwork, for ink surfaces. */
	reversed?: boolean;
	/** Rendered height in px; the width follows the artwork. */
	height?: number;
};

/** qotm_kit Logo: the brand lockups as images (alt "qotm"). */
function Logo({
	lockup = 'horizontal',
	reversed = false,
	height = 32,
	alt = 'qotm',
	className,
	style,
	...props
}: LogoProps) {
	return (
		<img
			src={LOCKUPS[lockup][reversed ? 1 : 0]}
			alt={alt}
			className={cn('block w-auto', className)}
			style={{ height, ...style }}
			{...props}
		/>
	);
}

export { Logo };
export type { LogoProps };
