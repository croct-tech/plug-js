import {expect, type Page, type Response, test} from '@playwright/test';

type WidgetEvent = Record<string, any>;

test.describe('Preview widget', () => {
    function open(page: Page, params: Record<string, string> = {}): Promise<Response | null> {
        const query = new URLSearchParams();

        for (const [key, value] of Object.entries(params)) {
            query.set(key, value);
        }

        let queryString = query.toString();

        if (queryString !== '') {
            queryString = `?${queryString}`;
        }

        return page.goto(`/widget.html${queryString}`, {waitUntil: 'networkidle'});
    }

    // eslint-disable-next-line no-empty-pattern -- Playwright requires destructuring
    test.beforeEach(({}, testInfo) => {
        // eslint-disable-next-line no-param-reassign -- Need for disabling the suffix
        testInfo.snapshotSuffix = '';
    });

    test('should be initially minimized', async ({page}) => {
        await open(page);

        await expect(page).toHaveScreenshot('widget-minimized.png');
    });

    test('should expand clicking on the widget', async ({page}) => {
        await open(page, {
            previewMode: 'publishedContent',
            experience: 'Experience',
            experiment: 'Experiment',
            audience: 'Audience',
            variant: 'Variant',
            locale: 'en-us',
        });

        const disclosure = page.locator('#disclosure');

        await disclosure.click();

        await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('#minimize-button')).toHaveAttribute('aria-expanded', 'true');

        await expect(page.locator('#preview-experience')).toHaveText('Experience');

        await expect(page.locator('#preview-experiment')).toHaveText('Experiment');

        await expect(page.locator('#preview-audience')).toHaveText('Audience');

        await expect(page.locator('#preview-content')).toHaveText('Variant');

        await expect(page.locator('#preview-locale')).toBeAttached();

        await expect(page.locator('#preview-slot')).not.toBeAttached();

        await expect(page).toHaveScreenshot('widget-expanded.png');
    });

    test('should truncate large names', async ({page}) => {
        await open(page, {
            experience: 'A very very very very long experience name',
            experiment: 'A very very very very long experiment name',
            audience: 'A very very very very long audience name',
            variant: 'A very very very very long variant name',
            locale: 'en-io',
        });

        const disclosure = page.locator('#disclosure');

        await disclosure.click();

        await expect(disclosure).toHaveAttribute('aria-expanded', 'true');

        await expect(page).toHaveScreenshot('widget-truncated.png');
    });

    test('should display the slot when previewing the default content', async ({page}) => {
        await open(page, {
            previewMode: 'slotDefaultContent',
            slot: 'Home banner',
            locale: 'en-us',
        });

        const disclosure = page.locator('#disclosure');

        await disclosure.click();

        await expect(disclosure).toHaveAttribute('aria-expanded', 'true');

        await expect(page.locator('#preview-content')).toHaveText('Default content');

        await expect(page.locator('#preview-slot')).toHaveText('Home banner');

        await expect(page.locator('.options .title')).toHaveText(['Slot', 'Content', 'Locale']);

        await expect(page.locator('#preview-audience')).not.toBeAttached();

        await expect(page.locator('#preview-experience')).not.toBeAttached();

        await expect(page.locator('#preview-experiment')).not.toBeAttached();

        await expect(page).toHaveScreenshot('widget-slot-default-content.png');
    });

    test('should not display the slot if not specified when previewing the default content', async ({page}) => {
        await open(page, {
            previewMode: 'slotDefaultContent',
            locale: 'en-us',
        });

        const disclosure = page.locator('#disclosure');

        await disclosure.click();

        await expect(disclosure).toHaveAttribute('aria-expanded', 'true');

        await expect(page.locator('#preview-content')).toHaveText('Default content');

        await expect(page.locator('#preview-slot')).not.toBeAttached();
    });

    test('should display the slot when previewing the fallback content', async ({page}) => {
        await open(page, {
            previewMode: 'fallbackContent',
            slot: 'Home banner',
            locale: 'en-us',
        });

        const disclosure = page.locator('#disclosure');

        await disclosure.click();

        await expect(disclosure).toHaveAttribute('aria-expanded', 'true');

        await expect(page.locator('#preview-content')).toHaveText('Fallback content');

        await expect(page.locator('#preview-slot')).toHaveText('Home banner');

        await expect(page.locator('.options .title')).toHaveText(['Slot', 'Content', 'Locale']);

        await expect(page.locator('#preview-audience')).not.toBeAttached();

        await expect(page.locator('#preview-experience')).not.toBeAttached();

        await expect(page.locator('#preview-experiment')).not.toBeAttached();
    });

    test('should hide the experience when previewing the fallback content', async ({page}) => {
        await open(page, {
            previewMode: 'fallbackContent',
            slot: 'Home banner',
            experience: 'Experience',
            experiment: 'Experiment',
            audience: 'Audience',
            variant: 'Variant',
            locale: 'en-us',
        });

        const disclosure = page.locator('#disclosure');

        await disclosure.click();

        await expect(disclosure).toHaveAttribute('aria-expanded', 'true');

        await expect(page.locator('#preview-experience')).not.toBeAttached();

        await expect(page.locator('#preview-experiment')).not.toBeAttached();

        await expect(page.locator('#preview-audience')).not.toBeAttached();

        await expect(page.locator('#preview-content')).toHaveText('Fallback content');

        await expect(page.locator('.options .title')).toHaveText(['Slot', 'Content', 'Locale']);
    });

    test('should display the slot along with the experience when previewing the slot timeline', async ({page}) => {
        await open(page, {
            previewMode: 'slotTimeline',
            slot: 'Home banner',
            experience: 'Experience',
            experiment: 'Experiment',
            audience: 'Audience',
            variant: 'Variant',
            locale: 'en-us',
        });

        const disclosure = page.locator('#disclosure');

        await disclosure.click();

        await expect(disclosure).toHaveAttribute('aria-expanded', 'true');

        await expect(page.locator('#preview-slot')).toHaveText('Home banner');

        await expect(page.locator('#preview-experience')).toHaveText('Experience');

        await expect(page.locator('#preview-audience')).toHaveText('Audience');

        await expect(page.locator('#preview-experiment')).toHaveText('Experiment');

        await expect(page.locator('#preview-content')).toHaveText('Variant');
    });

    test('should display the experiment default content if no variant is specified', async ({page}) => {
        await open(page, {
            experience: 'Experience',
            experiment: 'Experiment',
            audience: 'Audience',
            locale: 'en-us',
        });

        const disclosure = page.locator('#disclosure');

        await disclosure.click();

        await expect(disclosure).toHaveAttribute('aria-expanded', 'true');

        await expect(page.locator('#preview-content')).toHaveText('Default content');

        await expect(page).toHaveScreenshot('widget-without-variant.png');
    });

    test('should not display experiment and content if no experiment is specified', async ({page}) => {
        await open(page, {
            experience: 'Experience',
            audience: 'Audience',
            variant: 'Variant',
            locale: 'en-us',
        });

        const disclosure = page.locator('#disclosure');

        await disclosure.click();

        await expect(disclosure).toHaveAttribute('aria-expanded', 'true');

        await expect(page.locator('#preview-experiment')).not.toBeAttached();

        await expect(page.locator('#preview-content')).not.toBeAttached();

        await expect(page).toHaveScreenshot('widget-without-experiment.png');
    });

    test('should not display the locale if not specified', async ({page}) => {
        await open(page, {
            experience: 'Experience',
            experiment: 'Experiment',
            audience: 'Audience',
            variant: 'Variant',
        });

        await page.locator('#disclosure').click();

        await expect(page.locator('#preview-locale')).not.toBeAttached();

        await expect(page).toHaveScreenshot('widget-without-locale.png');
    });

    test('should display the locale code instead of the name if the specified code is invalid', async ({page}) => {
        await open(page, {
            experience: 'Experience',
            experiment: 'Experiment',
            audience: 'Audience',
            variant: 'Variant',
            locale: 'Invalid code',
        });

        await page.locator('#disclosure').click();

        await expect(page.locator('#preview-locale')).toHaveText('Invalid code');

        await expect(page).toHaveScreenshot('widget-invalid-locale.png');
    });

    test('should minimize clicking on the minimize button', async ({page}) => {
        await open(page);

        await page.locator('#disclosure').click();

        const minimizeButton = page.locator('#minimize-button');

        await expect(minimizeButton).toHaveAttribute('aria-expanded', 'true');

        await minimizeButton.click();

        await expect(minimizeButton).toHaveAttribute('aria-expanded', 'false');
        await expect(page.locator('#disclosure')).toHaveAttribute('aria-expanded', 'false');
    });

    test('should minimize pressing escape', async ({page}) => {
        await open(page);

        await page.locator('#disclosure').click();

        const minimizeButton = page.locator('#minimize-button');

        await expect(minimizeButton).toHaveAttribute('aria-expanded', 'true');

        await page.keyboard.press('Escape');

        await expect(minimizeButton).toHaveAttribute('aria-expanded', 'false');
        await expect(page.locator('#disclosure')).toHaveAttribute('aria-expanded', 'false');
    });

    test('should post a message when the widget size changes', async ({page}) => {
        const events: WidgetEvent[] = [];

        await page.exposeFunction('recordEvent', (event: WidgetEvent) => {
            events.push(event);
        });

        await page.addInitScript(
            () => window.addEventListener(
                'message',
                event => window.recordEvent(event.data),
            ),
        );

        await open(page);

        await expect.poll(() => events.length).toBe(1);

        expect(events[0].type).toEqual('croct:preview:resize');
        expect(events[0].width).toBeGreaterThan(100);
        expect(events[0].height).toBeGreaterThan(80);
    });

    test('should post a message leaving the preview', async ({page}) => {
        const events: WidgetEvent[] = [];

        await page.exposeFunction('recordEvent', (event: WidgetEvent) => {
            events.push(event);
        });

        await page.addInitScript(
            () => window.addEventListener(
                'message',
                event => window.recordEvent(event.data),
            ),
        );

        await open(page);

        await page.locator('#disclosure').click();

        await expect(page.locator('#disclosure')).toHaveAttribute('aria-expanded', 'true');

        await page.locator('#leave-button').click();

        const getLeaveEvents = (): WidgetEvent[] => events.filter(event => event.type === 'croct:preview:leave');

        await expect.poll(() => getLeaveEvents().length).toBe(1);

        expect(getLeaveEvents()).toEqual([{type: 'croct:preview:leave'}]);
    });
});
