import type {IconPack} from '@fortawesome/fontawesome-svg-core';

/**
 * The only module that loads the full Font Awesome packs - see `faPacks.d.ts` for why each
 * specifier carries a `?full` query. Kept apart from `GlyphService` so its spec can swap in a
 * single small pack.
 */
export async function loadFaPacksAsync(): Promise<IconPack[]> {
    const [{fas}, {far}, {fal}, {fat}] = await Promise.all([
        import('@fortawesome/pro-solid-svg-icons/index?full'),
        import('@fortawesome/pro-regular-svg-icons/index?full'),
        import('@fortawesome/pro-light-svg-icons/index?full'),
        import('@fortawesome/pro-thin-svg-icons/index?full')
    ]);
    return [fas, far, fal, fat];
}
