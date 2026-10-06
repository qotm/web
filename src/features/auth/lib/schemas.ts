import { z } from 'zod';

export const loginSchema = z.object({
	email: z.string().min(1, 'Email is required').email('Enter a valid email'),
	password: z.string().min(1, 'Password is required'),
	remember: z.boolean().optional()
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
	name: z.string().min(1, 'Enter your name'),
	email: z.string().min(1, 'Email is required').email('Enter a valid email'),
	password: z.string().min(8, 'At least 8 characters'),
	// Consent is a gate, not a preference, so it is validated rather than merely
	// displayed. It is stripped before the payload reaches the API — see
	// `SignupRoute`; nothing on the server takes it.
	acceptedTerms: z.boolean().refine((accepted) => accepted, {
		message: 'Please accept the terms to continue'
	})
});
export type SignupValues = z.infer<typeof signupSchema>;

export const forgotSchema = z.object({
	email: z.string().min(1, 'Email is required').email('Enter a valid email')
});
export type ForgotValues = z.infer<typeof forgotSchema>;

export const resetSchema = z
	.object({
		password: z.string().min(8, 'At least 8 characters'),
		confirm: z.string().min(1, 'Confirm your password')
	})
	.refine((values) => values.password === values.confirm, {
		message: "Passwords don't match yet.",
		path: ['confirm']
	});
export type ResetValues = z.infer<typeof resetSchema>;
