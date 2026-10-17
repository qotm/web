/** "1 quote", "2,450 quotes": a count with its noun, grouped as en-US. */
export const count = (n: number, noun: string, plural = `${noun}s`) =>
	`${n.toLocaleString('en-US')} ${n === 1 ? noun : plural}`;
