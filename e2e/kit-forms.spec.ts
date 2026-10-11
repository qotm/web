import { expectMatchesKit } from './kit';
import { expect, test } from './fixtures';

/**
 * QOT-60: the form fields against qotm_kit. One deliberate difference: control
 * borders use --input (#938a76, 3:1) instead of the kit's hairline (QOT-11),
 * so border colours are checked separately.
 */
const CONTROL = [
	'color',
	'background-color',
	'border-top-width',
	'border-top-left-radius',
	'font-family',
	'font-size',
	'font-weight',
	'padding-top',
	'padding-left',
	'height'
];
const TEXT = ['color', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'text-transform'];

test.describe('kit: forms', () => {
	test('Field: mono label, optional marker and hint', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Field',
			[
				['.qk-field__label', 'css:label'],
				['.qk-field__opt', 'css:label span'],
				['.qk-field__msg', 'css:label ~ span'],
				['.qk-control--mono', 'css:input']
			],
			TEXT
		);
	});

	test('Input: control, mono, required marker, error', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Input',
			[
				['.qk-control:not(.qk-control--mono):not([aria-invalid="true"])', 'css:#kit-author'],
				['.qk-control--mono', 'css:#kit-user'],
				['.qk-field__req', 'css:label[for="kit-author"] span'],
				['.qk-field__msg--error', 'css:[role="alert"]']
			],
			CONTROL.filter((p) => p !== 'height')
		);
	});

	test('Textarea: display style and count', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Textarea',
			[
				['.qk-textarea--display', 'css:#kit-quote'],
				['.qk-textarea:not(.qk-textarea--display)', 'css:#kit-context'],
				['.qk-field__count', 'css:label[for="kit-quote"] span:last-child']
			],
			['color', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'padding-top', 'height']
		);
	});

	test('Select: control and caret', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Select',
			[
				['.qk-select .qk-control', 'css:select'],
				['.qk-select__caret', 'css:select + span']
			],
			['color', 'font-family', 'font-size', 'padding-right', 'height']
		);
	});

	test('Checkbox: box, checked fill and description', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Checkbox',
			[
				['.qk-check input:checked + .qk-check__box', 'css:label:first-child input + span'],
				['.qk-check input:not(:checked):not(:disabled) + .qk-check__box', 'css:label:nth-child(2) input + span'],
				['.qk-check__desc', 'css:label:first-child span span'],
				['.qk-check', 'css:label:first-child']
			],
			['color', 'background-color', 'border-top-color', 'border-top-left-radius', 'font-size', 'width', 'height']
		);
	});

	test('RadioGroup: cards, list and dots', async ({ page }) => {
		await expectMatchesKit(
			page,
			'RadioGroup',
			[
				['.qk-radios--card .qk-radio.is-checked', 'css:fieldset:first-child label[data-checked]'],
				['.qk-radios--card .qk-radio:not(.is-checked)', 'css:fieldset:first-child label:not([data-checked])'],
				['.qk-radio.is-checked .qk-radio__dot', 'css:fieldset:first-child label[data-checked] input + span'],
				['.qk-radio__desc', 'css:fieldset:first-child label > span:last-child > span:last-child'],
				['.qk-radios--list .qk-radio', 'css:fieldset:nth-child(2) label']
			],
			['color', 'background-color', 'border-top-color', 'border-top-left-radius', 'font-size', 'padding-top', 'height']
		);
	});

	test('Switch: track and knob, off and on', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Switch',
			[
				['.qk-switch input:checked + .qk-switch__track', 'css:label:first-child input + span'],
				['.qk-switch input:checked + .qk-switch__track .qk-switch__knob', 'css:label:first-child input + span > span'],
				['.qk-switch input:not(:checked) + .qk-switch__track', 'css:label:nth-child(2) input + span']
			],
			['background-color', 'border-top-color', 'border-top-left-radius', 'width', 'height']
		);
	});

	test('SearchField: prompt, input and shortcut', async ({ page }) => {
		await expectMatchesKit(
			page,
			'SearchField',
			[
				['.qk-search:not(.qk-search--sm)', 'css:form:first-child'],
				['.qk-search--sm', 'css:form:nth-child(2)'],
				['.qk-search__glyph', 'css:form span[aria-hidden]'],
				['.qk-search input', 'css:form input']
			],
			['color', 'background-color', 'border-top-left-radius', 'font-family', 'font-size', 'height']
		);
	});

	test('TopicPicker: pills, selected and count', async ({ page }) => {
		await expectMatchesKit(
			page,
			'TopicPicker',
			[
				['.qk-topic.is-on', 'css:button[aria-pressed="true"]'],
				['.qk-topic:not(.is-on)', 'css:button[aria-pressed="false"]'],
				['.qk-field__count', 'css:label span']
			],
			['color', 'background-color', 'border-top-color', 'border-top-left-radius', 'font-family', 'font-size', 'height']
		);
	});

	test('controls carry the 3:1 --input edge, and focus turns it clay', async ({ page }) => {
		await page.goto('/_kit?only=Input');
		const input = page.locator('#kit-author');
		await expect.poll(() => input.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe('rgb(147, 138, 118)');
		await input.focus();
		await expect.poll(() => input.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe('rgb(184, 92, 62)');
		// Tailwind layers empty shadows under ours; the 1px clay ring is the last.
		expect(await input.evaluate((el) => getComputedStyle(el).boxShadow)).toMatch(/rgb\(184, 92, 62\) 0px 0px 0px 1px$/);
	});

	test('checkboxes, radios and switches work from the keyboard', async ({ page }) => {
		await page.goto('/_kit?only=Checkbox');
		const box = page.getByLabel('Email me when a verifier reviews my submission');
		await box.focus();
		await page.keyboard.press('Space');
		await expect(box).toBeChecked();
		const ring = page.locator('label:nth-child(2) input + span');
		await expect.poll(() => ring.evaluate((el) => getComputedStyle(el).outlineColor)).toBe('rgb(184, 92, 62)');

		await page.goto('/_kit?only=RadioGroup');
		await page.getByLabel('My own original').focus();
		await page.keyboard.press('ArrowDown');
		await expect(page.getByLabel('A private note')).toBeChecked();

		await page.goto('/_kit?only=Switch');
		const toggle = page.getByRole('switch', { name: 'Plain output by default' });
		await toggle.focus();
		await page.keyboard.press('Space');
		await expect(toggle).toBeChecked();
	});

	test('"/" focuses search; the picker stops at three topics', async ({ page }) => {
		await page.goto('/_kit?only=SearchField');
		await expect(page.locator('form:first-child input')).toBeVisible();
		await page.mouse.click(5, 5);
		await page.keyboard.press('/');
		await expect(page.locator('form:first-child input')).toBeFocused();

		await page.goto('/_kit?only=TopicPicker');
		await page.getByRole('button', { name: 'unix' }).click();
		await expect(page.getByText('3 / 3')).toBeVisible();
		await expect(page.getByRole('button', { name: 'debugging' })).toBeDisabled();
		await page.getByRole('button', { name: /simplicity/ }).click();
		await expect(page.getByRole('button', { name: 'debugging' })).toBeEnabled();
	});
});
