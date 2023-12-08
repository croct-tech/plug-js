import {expect, Page, Response, test} from '@playwright/test';

type WidgetEvent = Record<string, any>;

test.describe('Preview widget', () => {
    function open(page: Page, params: Record<string, string> = {}): Promise<Response|null> {
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
            experience: 'A very very very very long experience name',
            experiment: 'A very very very very long experiment name',
            audience: 'A very very very very long audience name',
            variant: 'A very very very very long variant name',
            locale: 'pt-br',
        });

        const disclosure = await page.locator('#disclosure');

        await disclosure.click();

        await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('#minimize-button')).toHaveAttribute('aria-expanded', 'true');

        await expect(page.locator('#preview-experiment')).toBeVisible();

        await expect(page).toHaveScreenshot('widget-expanded.png');
    });

    test('should display the none audience for the slot default content preview', async ({page}) => {
        await open(page, {
            previewMode: 'slotDefaultContent',
            experience: 'A very very very very long experience name',
            experiment: 'A very very very very long experiment name',
            audience: 'A very very very very long audience name',
            variant: 'A very very very very long variant name',
            locale: 'pt-br',
        });

        const disclosure = await page.locator('#disclosure');

        await disclosure.click();

        await expect(disclosure).toHaveAttribute('aria-expanded', 'true');

        await expect(page.locator('#preview-audience')).toHaveText('None');

        await expect(page.locator('#preview-experience')).not.toBeVisible();

        await expect(page.locator('#preview-experiment')).not.toBeVisible();

        await expect(page.locator('#preview-content')).toHaveText('Default content');

        await expect(page).toHaveScreenshot('widget-slot-default-content.png');
    });

    test('should display the default content with no experiment if no variant is specified', async ({page}) => {
        await open(page, {
            experience: 'A very very very very long experience name',
            experiment: 'A very very very very long experiment name',
            audience: 'A very very very very long audience name',
            locale: 'en-us',
        });

        const disclosure = await page.locator('#disclosure');

        await disclosure.click();

        await expect(disclosure).toHaveAttribute('aria-expanded', 'true');

        await expect(page.locator('#preview-experiment')).not.toBeVisible();

        await expect(page.locator('#preview-content')).toHaveText('Default content');

        await expect(page).toHaveScreenshot('widget-without-experiment.png');
    });

    test('should not display the locale if not specified', async ({page}) => {
        await open(page, {
            experience: 'A very very very very long experience name',
            audience: 'A very very very very long audience name',
        });

        await page.locator('#disclosure').click();

        await expect(await page.getByText('Locale').count()).toBe(0);

        await expect(page).toHaveScreenshot('widget-without-locale.png');
    });

    test('should display the locale code instead locale name if the specified code is invalid', async ({page}) => {
        await open(page, {
            experience: 'A very very very very long experience name',
            audience: 'A very very very very long audience name',
            locale: 'A very very very very long locale name',
        });

        await page.locator('#disclosure').click();

        const previewLocale = await page.locator('#preview-locale');

        await expect(previewLocale).toHaveText('A very very very very long locale name');

        await expect(page).toHaveScreenshot('widget-invalid-locale.png');
    });

    test('should minimize clicking on the minimize button', async ({page}) => {
        await open(page);

        await page.locator('#disclosure').click();

        const minimizeButton = await page.locator('#minimize-button');

        await expect(minimizeButton).toHaveAttribute('aria-expanded', 'true');

        await minimizeButton.click();

        await expect(minimizeButton).toHaveAttribute('aria-expanded', 'false');
        await expect(page.locator('#disclosure')).toHaveAttribute('aria-expanded', 'false');
    });

    test('should minimize pressing escape', async ({page}) => {
        await open(page);

        await page.locator('#disclosure').click();

        const minimizeButton = await page.locator('#minimize-button');

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

        await page.waitForFunction(length => length === 1, events.length);

        expect(events).toHaveLength(1);

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

        await page.waitForFunction(length => length > 0, events.length);

        events.splice(0, events.length);

        await page.locator('#leave-button').click();

        await page.waitForFunction(length => length === 1, events.length);

        expect(events).toHaveLength(1);

        expect(events[0].type).toEqual('croct:preview:leave');
    });
});
