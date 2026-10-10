import {logInfo} from '@xh/hoist/utils/js';
import {registerFaPacks} from './FaLibrary';

/**
 * The only module that loads the full Font Awesome packs - see `faPacks.d.ts` for why each
 * specifier carries a `?full` query. Kept apart from `FaLibrary.ts` so unit specs never import it.
 */

let loadPromise: Promise<void> = null;

/**
 * Load every glyph in the four Font Awesome Pro packs (solid, regular, light and thin), add them
 * to the FA library and register them in Hoist's `Icon` catalog.
 *
 * Memoized - repeat calls share one load. A failed load clears the memo so it can be retried.
 */
export function loadFaLibraryAsync(): Promise<void> {
    loadPromise ??= doLoadAsync().catch(e => {
        loadPromise = null;
        throw e;
    });
    return loadPromise;
}

//------------------------
// Implementation
//------------------------
async function doLoadAsync(): Promise<void> {
    const start = performance.now(),
        [{far}, {fas}, {fal}, {fat}] = await Promise.all([
            import('@fortawesome/pro-regular-svg-icons/index?full'),
            import('@fortawesome/pro-solid-svg-icons/index?full'),
            import('@fortawesome/pro-light-svg-icons/index?full'),
            import('@fortawesome/pro-thin-svg-icons/index?full')
        ]),
        loaded = performance.now();

    registerFaPacks([far, fas, fal, fat]);

    const done = performance.now();
    logInfo(
        [
            'Loaded Font Awesome packs',
            `import ${Math.round(loaded - start)}ms`,
            `register ${Math.round(done - loaded)}ms`
        ],
        'FaPacks'
    );
}
