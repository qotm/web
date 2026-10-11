import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik, Form } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import { FormCheckbox, FormTextarea, FormTopicPicker } from '../form/form';
import { Field } from './field';
import { Input } from './input';
import { RadioGroup } from './radio-group';
import { SearchField } from './search-field';
import { TopicPicker } from './topic-picker';

describe('Field', () => {
	it('labels the control, marks it required and shows the error over the hint', () => {
		render(
			<Field label="Year" required hint="Four digits." error="Use a four-digit year." htmlFor="y">
				<Input id="y" />
			</Field>
		);
		expect(screen.getByLabelText(/Year/)).toBeInTheDocument();
		expect(screen.getByText('required')).toBeInTheDocument();
		expect(screen.getByRole('alert')).toHaveTextContent('Use a four-digit year.');
		expect(screen.queryByText('Four digits.')).toBeNull();
	});
});

describe('TopicPicker', () => {
	it('picks up to the maximum, then disables the rest until one is dropped', async () => {
		const onChange = vi.fn();
		render(<TopicPicker topics={['a', 'b', 'c', 'd']} max={2} onChange={onChange} />);
		await userEvent.click(screen.getByRole('button', { name: 'a' }));
		await userEvent.click(screen.getByRole('button', { name: 'b' }));
		expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
		expect(screen.getByText('2 / 2')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'c' })).toBeDisabled();
		await userEvent.click(screen.getByRole('button', { name: /a/ }));
		expect(screen.getByRole('button', { name: 'c' })).toBeEnabled();
	});
});

describe('RadioGroup', () => {
	it('moves the choice and reports it', async () => {
		const onChange = vi.fn();
		render(
			<RadioGroup
				label="Reason"
				defaultValue="attr"
				onChange={onChange}
				options={[
					{ value: 'attr', label: 'Wrong attribution' },
					{ value: 'dup', label: 'Duplicate' }
				]}
			/>
		);
		await userEvent.click(screen.getByLabelText('Duplicate'));
		expect(onChange).toHaveBeenCalledWith('dup');
		expect(screen.getByLabelText('Duplicate')).toBeChecked();
	});
});

describe('SearchField', () => {
	it('submits the trimmed query on Enter', async () => {
		const onSubmit = vi.fn();
		render(<SearchField onSubmit={onSubmit} />);
		await userEvent.type(screen.getByRole('searchbox', { name: 'Search' }), '  complexity {Enter}');
		expect(onSubmit).toHaveBeenCalledWith('complexity');
	});
});

describe('Formik fields', () => {
	it('count characters, bind checkboxes and topics, and show errors once touched', async () => {
		const onSubmit = vi.fn();
		render(
			<Formik
				initialValues={{ text: 'Simplicity.', rights: false, topics: [] as string[] }}
				validate={(v) => (v.rights ? {} : { rights: 'Confirm you wrote it.' })}
				onSubmit={onSubmit}
			>
				<Form>
					<FormTextarea name="text" label="Quote" maxLength={280} />
					<FormCheckbox name="rights" label="I wrote this quote." />
					<FormTopicPicker name="topics" topics={['debugging', 'unix']} />
					<button type="submit">Send</button>
				</Form>
			</Formik>
		);
		expect(screen.getByText('11 / 280')).toBeInTheDocument();
		await userEvent.type(screen.getByLabelText(/Quote/), '!');
		expect(screen.getByText('12 / 280')).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Send' }));
		expect(await screen.findByText(/Confirm you wrote it/)).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();

		await userEvent.click(screen.getByLabelText(/I wrote this quote/));
		await userEvent.click(screen.getByRole('button', { name: 'unix' }));
		await userEvent.click(screen.getByRole('button', { name: 'Send' }));
		await vi.waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith({ text: 'Simplicity.!', rights: true, topics: ['unix'] }, expect.anything())
		);
	});
});
