import {compact} from 'lodash';

/**
 * Return a promise that will resolve after the specified amount of time.
 *
 * @param interval - milliseconds to delay (default 0).
 */
export function wait<T>(interval: number = 0): Promise<T> {
    return new Promise(resolve => setTimeout(resolve, interval)) as Promise<T>;
}

/**
 * Utility function for composing testIds.
 * Composes a '-'-separated testId string, ignoring any falsey arguments.
 */
export function mergeTestId(...testIds: Array<string | undefined | null>): string {
    return compact(testIds).join('-');
}
