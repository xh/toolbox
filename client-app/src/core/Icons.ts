import {faGithub, faMarkdown, faReact} from '@fortawesome/free-brands-svg-icons';
import {faFaceFrown, faFaceMeh, faFaceSmile, faIcons} from '@fortawesome/pro-regular-svg-icons';
import {Icon} from '@xh/hoist/icon';

/**
 * Custom icons used across Toolbox, beyond Hoist's built-in set. Imported by `Bootstrap.ts`, so
 * they are registered before any app renders. Each also joins the `Icon` catalog, so all of them
 * appear in `IconPicker` and can be resolved by name via `Icon.get()`.
 *
 * Use the exported factories directly - `Icon.github()` would not type-check, as registered names
 * are added to `Icon` at runtime only.
 */

// Brand glyphs are opt-in with FA and render with the `fab` prefix, detected automatically.
export const githubIcon = Icon.register({
    name: 'github',
    displayName: 'GitHub',
    defs: faGithub,
    keywords: ['git', 'repo', 'source']
});

export const markdownIcon = Icon.register({name: 'markdown', defs: faMarkdown});

export const reactIcon = Icon.register({name: 'react', defs: faReact});

export const iconsIcon = Icon.register({name: 'icons', defs: faIcons, keywords: ['glyph']});

export const [faceFrownIcon, faceMehIcon, faceSmileIcon] = Icon.registerAll([
    {name: 'faceFrown', defs: faFaceFrown, keywords: ['feedback', 'sad', 'emoji']},
    {name: 'faceMeh', defs: faFaceMeh, keywords: ['feedback', 'neutral', 'emoji']},
    {name: 'faceSmile', defs: faFaceSmile, keywords: ['feedback', 'happy', 'emoji']}
]);
