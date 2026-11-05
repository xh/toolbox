/**
 * Temporarily replaces the document's favicon with a live preview, and puts the original back.
 *
 * The first `show()` detaches every `<link rel~="icon">` (leaving e.g. `apple-touch-icon` alone),
 * remembering where each one was. Each `show()` then swaps in a fresh `<link rel="icon">` - a new
 * element, rather than a changed `href`, so browsers reliably repaint the tab. `restore()` removes
 * the preview link and reinserts the originals in their original positions.
 */
export class LiveTabIcon {
    private readonly doc: Document;
    private originals: {el: Element; parent: Node; nextSibling: Node}[] = null;
    private link: HTMLLinkElement = null;

    constructor(doc: Document = document) {
        this.doc = doc;
    }

    /** False when running inside a frame, where the tab icon belongs to the parent page. */
    get canPreview(): boolean {
        try {
            const win = this.doc.defaultView;
            return !!win && win.self === win.top;
        } catch {
            return false;
        }
    }

    /** Show the given image URL as the tab icon. */
    show(href: string): void {
        const {doc} = this;
        if (!this.originals) {
            this.originals = Array.from(doc.querySelectorAll('link[rel~="icon" i]')).map(el => {
                const ret = {el, parent: el.parentNode, nextSibling: el.nextSibling};
                el.remove();
                return ret;
            });
        }

        const link = doc.createElement('link');
        link.rel = 'icon';
        link.type = 'image/svg+xml';
        link.href = href;

        this.link?.remove();
        doc.head.appendChild(link);
        this.link = link;
    }

    /** Remove the preview and put the original icon links back. A no-op if `show` was never called. */
    restore(): void {
        this.link?.remove();
        this.link = null;

        // Reinsert in reverse, so an original whose next sibling was another original finds it.
        const originals = this.originals ?? [];
        for (let i = originals.length - 1; i >= 0; i--) {
            const {el, parent, nextSibling} = originals[i];
            if (nextSibling && nextSibling.parentNode === parent) {
                parent.insertBefore(el, nextSibling);
            } else {
                parent.appendChild(el);
            }
        }
        this.originals = null;
    }
}
