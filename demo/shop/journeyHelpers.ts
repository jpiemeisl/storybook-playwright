/* DEMO ONLY. Shared steps for the demo shop journeys: roles and accessible names only, no test ids. */
import { expect, userEvent, waitFor, within } from 'storybook/test';

export const canvasOf = (el: HTMLElement) => within(el);
/** Dialogs render in the top layer (showModal) but stay in the canvas; body covers both. */
export const page = (el: HTMLElement) => within(el.ownerDocument.body);

/** Waits for the page's h1. */
export async function expectH1(el: HTMLElement, name: string | RegExp) {
  return waitFor(() => expect(canvasOf(el).getByRole('heading', { level: 1, name })).toBeVisible(), { timeout: 3000 });
}

/** Clicks a link and waits for the next page's h1. After an in-memory navigation, focus is on <main>. */
export async function follow(el: HTMLElement, link: string | RegExp, h1: string | RegExp) {
  await userEvent.click(canvasOf(el).getAllByRole('link', { name: link })[0]!);
  await expectH1(el, h1);
  await waitFor(() => expect(el.ownerDocument.activeElement).toBe(el.ownerDocument.getElementById('main')));
}

export async function clickButton(el: HTMLElement, name: string | RegExp) {
  await userEvent.click(canvasOf(el).getByRole('button', { name }));
}

/** Continues to the next checkout step and waits for its title (focus moves to it). */
export async function continueTo(el: HTMLElement, button: string, title: string) {
  await clickButton(el, button);
  const heading = await canvasOf(el).findByRole('heading', { level: 1, name: title });
  await waitFor(() => expect(heading).toHaveFocus());
}

/** Types into the labelled field (regex: the required marker may follow the label). */
export async function fill(el: HTMLElement, label: RegExp, value: string) {
  const field = canvasOf(el).getByLabelText(label, { selector: 'input, textarea' });
  await userEvent.clear(field);
  await userEvent.type(field, value);
}

/** The checkout information step: email plus a US address (shipping or billing, whichever is shown). */
export async function fillInformation(el: HTMLElement) {
  await fill(el, /^Email(?! me)/, 'robin@example.com');
  await fill(el, /^Full name/, 'Robin Vale');
  await fill(el, /^Address/, '14 Alder Row');
  await fill(el, /^City/, 'Portland');
  await userEvent.selectOptions(canvasOf(el).getByRole('combobox', { name: /^State/ }), 'OR');
  await fill(el, /^ZIP code/, '97201');
}

/** The payment step: a card (the demo provider's fields take no input) and the terms of sale. */
export async function acceptTerms(el: HTMLElement) {
  await userEvent.click(canvasOf(el).getByRole('radio', { name: /^Credit or debit card/ }));
  await userEvent.click(canvasOf(el).getByRole('checkbox', { name: /I agree to the terms of sale/ }));
}

/** Signs in through the header link with the demo customer. */
export async function signIn(el: HTMLElement) {
  await follow(el, 'Sign in', 'Sign in');
  await fill(el, /^Email(?! me)/, 'robin@example.com');
  await userEvent.type(canvasOf(el).getByLabelText(/^Password/, { selector: 'input' }), 'any-password-1');
  await clickButton(el, 'Sign in');
  await expectH1(el, /Your account|Hello/);
}
