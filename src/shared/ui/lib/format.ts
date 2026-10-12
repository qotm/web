/** "2.8 MB" from bytes, as the kit writes sizes. */
function fileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	const units = ['KB', 'MB', 'GB'];
	let n = bytes / 1024;
	let i = 0;
	while (n >= 1024 && i < units.length - 1) {
		n /= 1024;
		i++;
	}
	return `${n.toFixed(1)} ${units[i]}`;
}

/** "9f3c2a…7e1b": enough of a digest to compare by eye. */
const shortSha = (sha: string) => (sha.length > 12 ? `${sha.slice(0, 6)}…${sha.slice(-4)}` : sha);

/** A release version as it is shown: "v2026.09.1". */
const releaseVersion = (v: string) => (v.startsWith('v') ? v : `v${v}`);

export { fileSize, releaseVersion, shortSha };
