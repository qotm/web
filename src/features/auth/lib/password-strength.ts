export type PasswordStrength = {
	/** 0 (empty/too short) … 3 (strong) */
	score: 0 | 1 | 2 | 3;
	label: string;
};

/** Lightweight strength heuristic driving the 3-bar meter on the signup screen. */
export function scorePassword(password: string): PasswordStrength {
	if (!password) {
		return { score: 0, label: 'Use 8+ characters with a mix of letters and numbers.' };
	}
	let points = 0;
	if (password.length >= 8) points += 1;
	if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
	if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) points += 1;

	const score = Math.min(points, 3) as 0 | 1 | 2 | 3;
	const labels = ['Too short', 'Weak — add more variety', 'Getting there', 'Strong password'];
	return { score, label: labels[score] };
}
