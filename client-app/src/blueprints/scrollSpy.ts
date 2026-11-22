import {useEffect} from 'react';

/**
 * The anchor of the first `[data-anchor]` element at or below the top of a scrolled container, or
 * the last one once the container is scrolled to its end, so every anchor can be reached.
 */
export function topAnchor(container: HTMLElement): string {
    if (!container) return null;
    const top = container.getBoundingClientRect().top,
        els = Array.from(container.querySelectorAll<HTMLElement>('[data-anchor]')),
        atEnd = container.scrollTop + container.clientHeight >= container.scrollHeight - 2,
        el = atEnd
            ? els.at(-1)
            : (els.find(it => it.getBoundingClientRect().bottom > top + 32) ?? els.at(-1));
    return el?.dataset.anchor ?? null;
}

/** Props that mark an element as an anchor for {@link topAnchor} and {@link useScrollTarget}. */
export function anchorProps(prefix: string, anchor: string): {id: string} {
    return {id: anchorDomId(prefix, anchor), ...({'data-anchor': anchor} as {})};
}

/**
 * Scrolls an anchor into view once it has rendered, then calls `onDone`, as when a link or an index
 * entry names an anchor further down the page.
 */
export function useScrollTarget(prefix: string, target: string, onDone: () => void) {
    useEffect(() => {
        if (!target) return;
        const el = document.getElementById(anchorDomId(prefix, target));
        if (!el) return;
        el.scrollIntoView({block: 'start'});
        onDone();
    });
}

function anchorDomId(prefix: string, anchor: string): string {
    return `${prefix}-${anchor.replace(':', '-')}`;
}
