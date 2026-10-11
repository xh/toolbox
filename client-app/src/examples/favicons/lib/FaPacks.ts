import {registerFaPacks} from './FaLibrary';

/**
 * The only module that loads the full Font Awesome packs - see `faPacks.d.ts` for why each
 * specifier carries a `?full` query. Kept apart from `FaLibrary.ts` so unit specs never import it.
 */

/**
 * Load every glyph in the four Font Awesome Pro packs (solid, regular, light and thin), add them
 * to the FA library and register them in Hoist's `Icon` catalog.
 */
export async function loadFaLibraryAsync(): Promise<void> {
    const [{far}, {fas}, {fal}, {fat}] = await Promise.all([
        import('@fortawesome/pro-regular-svg-icons/index?full'),
        import('@fortawesome/pro-solid-svg-icons/index?full'),
        import('@fortawesome/pro-light-svg-icons/index?full'),
        import('@fortawesome/pro-thin-svg-icons/index?full')
    ]);
    registerFaPacks([far, fas, fal, fat]);
}
