// Type augmentations for the browser-side helpers injected by HoistPage.initAsync().
// These globals are only available inside `page.evaluate()` callbacks (i.e. inside the browser).

import type {XHApi} from '@xh/hoist/core/XH';

declare global {
    interface Window {
        XH: XHApi;
    }

    /**
     * Strict typed model lookup injected by HoistPage — available within all page.evaluate() calls.
     * Returns the single active model matching `name`, null if none found, or throws if
     * multiple matches exist (indicating a test isolation issue or leaked model).
     *
     * Usage: `await page.evaluate(() => getModel<MyModel>('MyModel').someProperty)`
     */
    function getModel<T = any>(name: string): T;

    /**
     * Typed service lookup injected by HoistPage — available within all page.evaluate() calls.
     * Equivalent to `(window.XH as any)[serviceName]` with proper typing.
     *
     * Usage: `await page.evaluate(() => getSvc<MyService>('myService').someMethod())`
     */
    function getSvc<T = any>(name: string): T;

    /**
     * Async delay for use inside page.evaluate() where Hoist's `wait()` cannot be imported.
     *
     * Usage: `await page.evaluate(async () => { doSomething(); await wait(200); return result; })`
     */
    function wait(ms?: number): Promise<void>;
}
