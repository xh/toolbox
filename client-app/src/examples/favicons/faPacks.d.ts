/**
 * Ambient declarations for the full Font Awesome packs, loaded on demand by `lib/FaPacks.ts`.
 *
 * The `?full` query gives each pack its own module identity, so the bundler emits it to an async
 * chunk rather than merging it with the per-glyph imports Hoist and Toolbox make statically - which
 * would land the entire pack in every entry's initial chunk.
 *
 * This file must stay a global script (no top-level import or export), so these declarations
 * remain ambient. Type imports live inside each `declare module` block for that reason.
 */

declare module '@fortawesome/pro-solid-svg-icons/index?full' {
    import type {IconPack} from '@fortawesome/fontawesome-svg-core';
    export const fas: IconPack;
}

declare module '@fortawesome/pro-regular-svg-icons/index?full' {
    import type {IconPack} from '@fortawesome/fontawesome-svg-core';
    export const far: IconPack;
}

declare module '@fortawesome/pro-light-svg-icons/index?full' {
    import type {IconPack} from '@fortawesome/fontawesome-svg-core';
    export const fal: IconPack;
}

declare module '@fortawesome/pro-thin-svg-icons/index?full' {
    import type {IconPack} from '@fortawesome/fontawesome-svg-core';
    export const fat: IconPack;
}
