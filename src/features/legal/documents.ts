/**
 * The Terms of Service and the Privacy Policy, as data. Plain (no imports):
 * the web image's server renders them for crawlers too. Inline markup is
 * `**strong**`, `` `code` `` and `[text](href)` only (see `inline.ts`).
 *
 * The privacy policy describes what the code does. When what qotm stores,
 * keeps or shares changes, change it here in the same commit, and move
 * `updated`.
 */

export type LegalBlock = string | { list: string[] };
export type LegalSection = { id: string; heading: string; blocks: LegalBlock[] };
export type LegalDoc = {
	path: string;
	title: string;
	description: string;
	/** ISO date the text last changed. */
	updated: string;
	summary: string[];
	sections: LegalSection[];
};

const CONTACT = '[privacy@qotm.dev](mailto:privacy@qotm.dev)';

export const TERMS: LegalDoc = {
	path: '/terms',
	title: 'Terms of Service',
	description: 'The terms for using qotm: the site, the CLI and the dataset releases.',
	updated: '2026-10-13',
	summary: [
		'Reading quotes, and using the CLI, needs no account.',
		'What you submit stays credited to you. An original you publish stays yours; you let qotm show it and ship it.',
		'Submit only what you have the right to, and say honestly where a quote came from.',
		'Moderators can correct, dispute or withdraw quotes, and accounts that abuse the site can be closed.',
		'qotm is free and comes as it is. These terms are governed by the laws of Ghana.'
	],
	sections: [
		{
			id: 'about',
			heading: 'About these terms',
			blocks: [
				'qotm is a collection of programming quotes: a website at qotm.dev, a command-line tool (`qotm`, on npm) and the dataset releases the tool downloads. It is run by an independent developer based in Ghana, called “we” here.',
				'These terms apply when you use any of them. By creating an account, or by using qotm without one, you agree to them. If you do not agree, do not use qotm.',
				'How we handle personal data is in the [Privacy Policy](/privacy), which is part of these terms.'
			]
		},
		{
			id: 'accounts',
			heading: 'Your account',
			blocks: [
				'You can read every public quote, and use the CLI, without an account. An account lets you submit quotes, save favourites, like and recommend, and report problems.',
				{
					list: [
						'You must be **16 or older** to create an account.',
						'You sign in with a link sent to your email, or with GitHub or Google. There are no passwords. Keep access to that email account and those sign-ins safe: whoever controls them controls your qotm account.',
						'You get a public handle, which you can change in Settings. Old handles stay reserved and redirect to the new one, so nobody else can take them.',
						'One person, one account. Do not use an account to pretend to be someone else.'
					]
				},
				'You can delete your account at any time in Settings. What happens to your contributions when you do is set out in the [Privacy Policy](/privacy#deletion).'
			]
		},
		{
			id: 'submitting',
			heading: 'Submitting quotes',
			blocks: [
				'There are three kinds of quote:',
				{
					list: [
						'**Canonical**: words someone else said or wrote. You give the author and a source. Verifiers check the source before it is shown as verified.',
						'**Original**: words you wrote yourself, published under your handle as “declared original”.',
						'**Private**: kept to your account. Only you can see it, and it never goes into a release.'
					]
				},
				'When you submit, you promise that:',
				{
					list: [
						'the attribution and source of a canonical quote are, to the best of your knowledge, true. Do not invent quotes or put words in someone’s mouth;',
						'an original is your own work, and you have the right to publish it;',
						'it breaks no law and no one else’s rights, and is not spam, advertising, or abusive.'
					]
				},
				'Your handle is shown on what you submit (“submitted by” or “declared original by”), on the quote’s page and in the releases that include it.'
			]
		},
		{
			id: 'your-content',
			heading: 'Who owns what you submit',
			blocks: [
				'**Your originals stay yours.** You keep the copyright in quotes you wrote. By publishing one, you give us a worldwide, free, non-exclusive and permanent licence to show it on qotm, to include it in dataset releases and to let anyone who uses qotm or a release reproduce it, always credited to your handle (or to “a former member” once your account is gone).',
				'The licence is permanent because a release, once published, cannot be changed: copies of it are already on people’s machines. You can still ask a moderator to withdraw a published original from the site and from future releases.',
				'A canonical quote belongs to its author, or nobody: short quotations, credited and sourced, are what qotm is for. Submitting one gives you no rights in it, and gives us only what we need to show it and ship it.',
				'Private quotes are yours alone. We store them so you can read them on the site and in the CLI, and for nothing else.'
			]
		},
		{
			id: 'moderation',
			heading: 'Review and moderation',
			blocks: [
				'Every quote has a public history: when it was submitted, checked, corrected and curated. Verifiers, moderators and curators are members given that role. They can:',
				{
					list: [
						'verify a quote, ask for more evidence, or decline it;',
						'correct the wording of a quote to match its source (the earlier wording is kept in its history);',
						'mark a quote as disputed while a report is looked at, or withdraw it from the site;',
						'decide which quotes go into the next dataset release. Likes and recommendations never decide that on their own.'
					]
				},
				'You can report any quote. Reports go to moderators, who see who sent them; nobody else does.',
				'We can suspend or close an account that breaks these terms: for instance by submitting invented quotes, plagiarised “originals”, spam or abuse, or by trying to get round a decision with more accounts. Where we reasonably can, we tell you why.'
			]
		},
		{
			id: 'corpus',
			heading: 'The collection and the releases',
			blocks: [
				'Most of qotm’s quotes were gathered from [Wikiquote](https://en.wikiquote.org) and [Wikidata](https://www.wikidata.org), then checked and filed by topic. Quote texts and citations drawn from Wikiquote are available under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), credited to Wikiquote’s contributors through each quote’s source. Facts from Wikidata are in the public domain (CC0).',
				'A dataset release is a file of curated quotes, with their authors, sources and contributors’ handles, that the CLI downloads. Releases are public, and a published release is never changed; a newer one replaces it.',
				'The CLI’s code is open source under the MIT licence. The quotes inside it keep the terms above.'
			]
		},
		{
			id: 'acceptable-use',
			heading: 'Using qotm fairly',
			blocks: [
				'Do not:',
				{
					list: [
						'try to get into accounts, data or parts of qotm that are not yours;',
						'overload the site or the API, or get round its rate limits;',
						'scrape the site in bulk. The releases and the public API exist so that you do not have to;',
						'use qotm to harass anyone, or to publish anything unlawful.'
					]
				},
				'Reading and quoting from qotm, linking to it and building on its releases (within the licences above) are all welcome.'
			]
		},
		{
			id: 'no-warranty',
			heading: 'No guarantees',
			blocks: [
				'qotm is free and provided “as is”. We check sources with care, but a quote can still be wrong, misattributed or out of context: check a quote yourself before you rely on it, and report it if it is wrong.',
				'We may change, pause or stop any part of qotm, and we do not promise it will always be available. As far as the law allows, we are not liable for any indirect or consequential loss arising from your use of qotm, and our total liability to you is limited to the amount you have paid us, which is nothing. Nothing here limits a liability the law does not allow us to limit.'
			]
		},
		{
			id: 'changes',
			heading: 'Changes to these terms',
			blocks: [
				'We may update these terms. The date at the top shows when they last changed. If a change matters to members, for instance to what you agree to when you submit, we will also say so on the site before it applies. Using qotm after a change means you accept the new terms.'
			]
		},
		{
			id: 'law',
			heading: 'Law and contact',
			blocks: [
				'These terms are governed by the laws of the Republic of Ghana, and the courts of Ghana decide any dispute about them. If you live somewhere whose law gives you rights that cannot be signed away, you keep them.',
				`Questions about these terms: ${CONTACT}.`
			]
		}
	]
};

export const PRIVACY: LegalDoc = {
	path: '/privacy',
	title: 'Privacy Policy',
	description: 'What qotm stores about you, why, how long for, and who else sees it.',
	updated: '2026-10-13',
	summary: [
		'Reading qotm needs no account, and what you read is not tied to you.',
		'With an account we keep your email (never shown), your handle, name, picture and bio (public), and what you submit and save.',
		'Visits are counted with Umami, which uses no cookies. Errors and slow pages are reported to our own monitoring.',
		'No advertising, no selling or sharing data for marketing, no tracking across other sites.',
		'Delete your account in Settings at any time. Write to [privacy@qotm.dev](mailto:privacy@qotm.dev) for a copy of your data or anything else here.'
	],
	sections: [
		{
			id: 'who',
			heading: 'Who we are',
			blocks: [
				'qotm (the website at qotm.dev, its API, the `qotm` CLI and its dataset releases) is run by an independent developer based in Ghana, who is responsible for your data (the “data controller”). Reach us at ' +
					CONTACT +
					'.',
				'This policy covers personal data. The [Terms of Service](/terms) cover everything else.'
			]
		},
		{
			id: 'collect',
			heading: 'What we collect',
			blocks: [
				'**When you only read.** No account, nothing about you. Like every website, our servers see your IP address and browser when you connect; see [Logs and security](#logs) for what is kept.',
				'**When you create an account:**',
				{
					list: [
						'your **email address**, used to sign you in and, if you want, to tell you when a review finishes. It is never shown to anyone and never in a release;',
						'from GitHub or Google, if you sign in with them: your name, email and profile picture, plus the sign-in tokens they give us. We ask only for your basic profile and email address, never access to your repositories or other data;',
						'your **handle** (made from your email at first, and yours to change), and earlier handles, kept so links to them still work;',
						'your **name, picture and bio**, if you add or keep them;',
						'your settings: whether your favourites are public, and whether to email you about reviews.'
					]
				},
				'**What you do with an account:** the quotes you submit and their sources and evidence; your likes, favourites and recommendations; the reports you send; and the terminals you connect (named after the computer and shell, e.g. “laptop · zsh”), with when each last synced and which release it has.',
				'**Sign-in sessions:** for each place you are signed in, the IP address and browser it was opened from, so that you, and we, can spot one that is not yours.'
			]
		},
		{
			id: 'public',
			heading: 'What is public',
			blocks: [
				'qotm is a public collection, so some of what you do is shown to everyone, and to search engines:',
				{
					list: [
						'your profile: handle, name, picture, bio, role (member, verifier, moderator or admin), when you joined, and what you have contributed;',
						'your handle on each public quote you submitted (“submitted by”, “declared original by”), and on quotes you verified;',
						'each quote’s history: when it was submitted, checked, corrected and curated;',
						'how many likes, favourites and recommendations a quote has. **Who** liked or favourited it is never shown, except that your favourites list is public if you turn that on in Settings;',
						'the dataset releases, which carry each curated quote with its contributor’s handle.'
					]
				},
				'Never public: your email, private quotes, submissions still in review, reports you send, your sessions and terminals.'
			]
		},
		{
			id: 'use',
			heading: 'How we use it, and why',
			blocks: [
				{
					list: [
						'**To run your account and show your contributions**, because you asked us to (our agreement with you, under the [Terms](/terms)).',
						'**To send you sign-in links and review emails.** Sign-in links are needed to sign in. Review emails are optional: turn them off in Settings. We send no newsletters or marketing.',
						'**To review quotes and keep the collection honest**, including handling reports and stopping spam and abuse (our legitimate interest in a trustworthy collection).',
						'**To keep qotm secure and working**: rate limits, logs and error reports (our legitimate interest, and yours, in a service that works).',
						'**To understand how qotm is used**: counts of page views and actions, never tied to who you are (our legitimate interest).'
					]
				},
				'We do not sell personal data, show advertising, or use your data to make automated decisions about you. Whether a quote is published is decided by people (an original with no close match in the collection publishes on its own).'
			]
		},
		{
			id: 'cookies',
			heading: 'Cookies and analytics',
			blocks: [
				'qotm sets very few cookies, and none for advertising:',
				{
					list: [
						'**Sign-in** (`qotm-api.session_token`): keeps you signed in. It lasts up to 7 days, renewed while you use qotm, and goes when you sign out. Only set once you sign in.',
						'**Monitoring** (`_oo_s`): groups the error and performance reports from one visit (see below). It holds a random id, and it can last up to a year.'
					]
				},
				'**Umami** counts visits without cookies and without storing your IP address. It records which public page was viewed, where you came from (the site, not the full address), your browser, device type and country. For account pages it records only which kind of page it was, never ids, and it never records search terms or anything in the address after `?` or `#`. It also counts a few actions, like copying a link or submitting a quote, with no detail about you or the quote.',
				'**OpenObserve** collects error reports and performance measures from the site: pages loaded, how long they took, what failed and the clicks leading up to it. Text you type is masked, and it does not record your screen. If you are signed in, a report carries your account’s internal id, so that we can fix a problem you hit.'
			]
		},
		{
			id: 'sharing',
			heading: 'Who else sees it',
			blocks: [
				'We run most of qotm ourselves: the database, the email server, file storage, analytics (Umami) and monitoring (OpenObserve) are on servers we operate, rented from hosting providers who store, but do not use, the data. Beyond them:',
				{
					list: [
						'**GitHub and Google**, if you sign in with them: they see that you are signing in to qotm.',
						'**Google Fonts**: the emails we send load their fonts from Google, so your email app contacts Google when it shows one.',
						'**IndexNow** (Bing and other search engines): told when a public page changes, by its address only.',
						'**Moderators and admins**, who see what they need for their role: submissions in review, reports and who sent them, the review history. Admins can see account details to deal with abuse and support requests.'
					]
				},
				'We disclose personal data to authorities only when the law requires it.',
				'Our servers may be outside the country you live in. Wherever they are, your data gets the protection this policy describes.'
			]
		},
		{
			id: 'cli',
			heading: 'The CLI',
			blocks: [
				'The `qotm` command-line tool keeps everything on your computer: the downloaded release, the last 50 quotes it showed you, your local favourites and personal quotes. It sends nothing about you, and no usage statistics.',
				'Signed out, it only downloads releases. When you connect it with `qotm login`, it stores a sign-in token on your computer (readable only by your user) and syncs your favourites and private quotes with your account. Each connected terminal is listed in Settings, where you can disconnect it; `qotm logout` does the same.'
			]
		},
		{
			id: 'retention',
			heading: 'How long we keep it',
			blocks: [
				{
					list: [
						'**Your account and its data**: until you delete the account.',
						'**Sign-in links**: 10 minutes, deleted once expired. **CLI sign-in codes**: 15 minutes, deleted a day later.',
						'**Sessions**: up to 7 days after last use; a connected terminal until you disconnect it.',
						'**Server logs**: kept only as long as needed to run and debug the service, then deleted.',
						'**The review history** of a quote, and the record of what moderators and admins did, are kept as long as the quote is, so the collection can show how each quote was checked.'
					]
				}
			]
		},
		{
			id: 'deletion',
			heading: 'Deleting your account',
			blocks: [
				'Delete your account in Settings (type your handle to confirm). Straight away:',
				{
					list: [
						'your email, name, picture, bio, settings, sessions, connected terminals and sign-in links with GitHub or Google are deleted;',
						'your private quotes are deleted;',
						'your likes, favourites and recommendations are removed, and the counts go down;',
						'your handle is released.'
					]
				},
				'Your **public contributions stay**, credited to “a former member”: the collection depends on them. If you want a quote you published removed as well, ask a moderator, or write to us, before or after you go.',
				'Two records keep your old handle: the moderators’ internal record of who did what (if you held a role), and **dataset releases already published**, which cannot be changed. Releases made after you leave do not name you.'
			]
		},
		{
			id: 'rights',
			heading: 'Your rights',
			blocks: [
				'Under Ghana’s Data Protection Act, 2012, and laws such as the GDPR if they apply to you, you can ask us:',
				{
					list: [
						'for a copy of the personal data we hold about you;',
						'to correct it (most of it you can change yourself in Settings);',
						'to delete it (or do it yourself, above);',
						'to stop or limit using it, or object to how we use it.'
					]
				},
				`Write to ${CONTACT} from the email on your account. We reply within a month. If you are not satisfied, you can complain to Ghana’s [Data Protection Commission](https://www.dataprotection.org.gh), or to the data protection authority where you live.`
			]
		},
		{
			id: 'logs',
			heading: 'Logs and security',
			blocks: [
				'Our servers log requests (the address asked for, the response, when) to find faults and stop abuse, and count requests per IP address to enforce rate limits. Sign-in cookies and tokens are kept out of the logs.',
				'Connections to qotm are encrypted (HTTPS). Access to the servers and the database is limited to the operator. No system is perfectly secure: if a breach puts your data at risk, we will tell you, and the authorities, as the law requires.'
			]
		},
		{
			id: 'children',
			heading: 'Children',
			blocks: [
				'Anyone can read qotm. Accounts are for people 16 or older, and we do not knowingly hold data about anyone younger. If you think a child has an account, write to us and we will delete it.'
			]
		},
		{
			id: 'changes',
			heading: 'Changes to this policy',
			blocks: [
				'When what we collect or how we use it changes, we update this page and the date at the top. If a change matters to members, we will also say so on the site, or by email, before it applies.'
			]
		}
	]
};
