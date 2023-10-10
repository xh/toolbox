/**
 * Return a promise that will resolve after the specified amount of time.
 *
 * This method serves as a lightweight way to start a promise chain for any code.
 *
 * @param interval - milliseconds to delay (default 0). Note that the actual delay will be subject
 *      to the minimum delay for `setTimeout()` in the browser.
 */
export function wait<T>(interval: number = 0): Promise<T> {
    return new Promise(resolve => setTimeout(resolve, interval)) as Promise<T>;
}
