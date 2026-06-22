import {div} from '@xh/hoist/cmp/layout';
import {markdown} from '@xh/hoist/cmp/markdown';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import React, {useCallback, useEffect, useRef} from 'react';
import {DocViewModel} from './DocViewModel';
import './DocContent.scss';

/**
 * Shared, platform-neutral document body: renders the active doc's markdown, assigns slug ids to
 * H2 headings, tracks the active section on scroll, intercepts in-content link clicks (anchor
 * scroll / internal doc navigation / external open), and adds a tap-to-copy control to each fenced
 * code block. Rendered by both the desktop Docs tab and the mobile Docs page inside their own shells.
 */
export const docContent = hoistCmp.factory<DocViewModel>({
    displayName: 'DocContent',
    model: uses(DocViewModel),
    className: 'tb-doc-content',

    render({model, className}) {
        const {content, activeDoc, pendingScrollSection} = model,
            scrollRef = useRef<HTMLDivElement>(null);

        // Scroll to top when the active doc changes.
        useEffect(() => {
            scrollRef.current?.scrollTo(0, 0);
        }, [activeDoc]);

        // After content renders: assign H2 slug ids, wire scroll-spy, and add copy buttons.
        useEffect(() => {
            const container = scrollRef.current;
            if (!container || !content) return;

            // Assign IDs to H2s from the model's parsed sections, ensuring 1:1 correspondence.
            const headings = container.querySelectorAll('h2'),
                secs = model.sections;
            headings.forEach((h2, i) => {
                if (i < secs.length) h2.id = secs[i].id;
            });

            const cleanups = addCopyButtons(container);

            // Track active section based on scroll position - the last H2 that has
            // scrolled past the top of the container is considered "active".
            let ticking = false;
            const onScroll = () => {
                if (ticking) return;
                ticking = true;
                window.requestAnimationFrame(() => {
                    const containerTop = container.getBoundingClientRect().top;
                    let activeId: string = null;
                    container.querySelectorAll('h2[id]').forEach(h2 => {
                        if (h2.getBoundingClientRect().top <= containerTop + 60) activeId = h2.id;
                    });
                    if (activeId !== model.activeSection) model.setActiveSection(activeId);
                    ticking = false;
                });
            };
            container.addEventListener('scroll', onScroll, {passive: true});

            return () => {
                container.removeEventListener('scroll', onScroll);
                cleanups.forEach(fn => fn());
            };
        }, [model, content]);

        // Honor a deep-link's requested section: once content has rendered (so the H2 IDs assigned
        // above exist), scroll to the matching heading and clear the request. Keyed on the pending
        // section too, so same-doc section links re-scroll without a content reload.
        useEffect(() => {
            if (!content || !pendingScrollSection) return;
            window.requestAnimationFrame(() => {
                const target = document.getElementById(pendingScrollSection);
                if (target) {
                    target.scrollIntoView({block: 'start'});
                    model.setActiveSection(pendingScrollSection);
                }
                model.clearPendingScrollSection();
            });
        }, [model, content, pendingScrollSection]);

        // Handle clicks on links within the rendered markdown.
        const handleLinkClick = useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                const anchor = (e.target as HTMLElement).closest('a');
                if (!anchor) return;

                const href = anchor.getAttribute('href');
                if (!href) return;

                // Anchor-only links: scroll to the section within the current doc.
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const sectionId = href.slice(1),
                        el = document.getElementById(sectionId);
                    if (el) {
                        el.scrollIntoView({behavior: 'smooth', block: 'start'});
                        model.setActiveSection(sectionId);
                    }
                    return;
                }

                // Try to resolve as an internal doc link.
                if (model.activeDoc && !href.startsWith('http')) {
                    e.preventDefault();
                    const target = model.resolveContentLink(href);
                    if (target) model.navigateToDoc(target.id, target.source);
                    // Unresolved relative links (e.g. .ts source files) are silently consumed to
                    // prevent the browser from navigating away from the SPA.
                    return;
                }

                // External links: open in new tab.
                if (href.startsWith('http')) {
                    e.preventDefault();
                    window.open(href, '_blank', 'noopener');
                }
            },
            [model]
        );

        if (!content) return null;

        return div({
            className,
            ref: scrollRef,
            onClick: handleLinkClick,
            item: div({
                className: 'tb-doc-content__inner',
                item: markdown({content, lineBreaks: false})
            })
        });
    }
});

/**
 * Inject a copy button into each fenced code block. This is deliberately imperative DOM work: the
 * `markdown` component renders opaque HTML that is not addressable from React, so the buttons are
 * appended directly to the rendered `<pre>` elements after each content render. Returns cleanup fns
 * to remove listeners; guards against double-injection by checking for an existing button on the pre.
 */
function addCopyButtons(container: HTMLElement): Array<() => void> {
    const cleanups: Array<() => void> = [];
    container.querySelectorAll('pre').forEach(pre => {
        if (pre.querySelector('.tb-doc-content__copy')) return;
        const code = pre.querySelector('code');
        if (!code) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tb-doc-content__copy';
        btn.setAttribute('aria-label', 'Copy code');
        btn.textContent = 'Copy';
        const onClick = (e: MouseEvent) => {
            e.stopPropagation();
            copyTextToClipboard(code.textContent ?? '').then(
                () => {
                    btn.textContent = 'Copied';
                    XH.toast({message: 'Copied to clipboard', intent: 'success'});
                    window.setTimeout(() => (btn.textContent = 'Copy'), 1500);
                },
                () => XH.toast({message: 'Copy failed', intent: 'danger'})
            );
        };
        btn.addEventListener('click', onClick);
        pre.appendChild(btn);
        cleanups.push(() => btn.removeEventListener('click', onClick));
    });
    return cleanups;
}

/**
 * Copy text to the clipboard. Prefers the async Clipboard API, but falls back to a hidden-textarea
 * `execCommand('copy')` when it is unavailable - notably when the app is served over plain HTTP on a
 * LAN IP (e.g. on-device testing), where the Clipboard API is gated behind a secure context. The
 * fallback must run inside the user's tap (a trusted gesture) and uses a Range-based selection so it
 * also works on iOS Safari, where `textarea.select()` alone does not enable the copy command.
 */
function copyTextToClipboard(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);

        const selection = document.getSelection(),
            range = document.createRange();
        range.selectNodeContents(ta);
        selection.removeAllRanges();
        selection.addRange(range);
        ta.setSelectionRange(0, text.length);

        try {
            document.execCommand('copy') ? resolve() : reject(new Error('Copy command rejected'));
        } catch (e) {
            reject(e);
        } finally {
            selection.removeAllRanges();
            document.body.removeChild(ta);
        }
    });
}
