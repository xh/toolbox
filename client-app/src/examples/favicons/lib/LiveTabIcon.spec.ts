import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {LiveTabIcon} from './LiveTabIcon';

describe('LiveTabIcon', () => {
    let doc: Document;

    beforeEach(() => {
        doc = document.implementation.createHTMLDocument('test');
        doc.head.innerHTML = [
            '<meta charset="utf-8">',
            '<link id="ico" rel="icon" href="/favicon.ico" sizes="32x32">',
            '<link id="svg" rel="icon" type="image/svg+xml" href="/favicon.svg">',
            '<link id="apple" rel="apple-touch-icon" href="/apple-touch-icon.png">',
            '<link id="shortcut" rel="shortcut icon" href="/legacy.ico">',
            '<title>Test</title>'
        ].join('');
    });

    afterEach(() => (doc = null));

    const ids = () => Array.from(doc.head.children).map(el => el.id || el.tagName.toLowerCase());
    const iconLinks = () => Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));

    it('detaches rel=icon links but keeps apple-touch-icon', () => {
        const tabIcon = new LiveTabIcon(doc);
        tabIcon.show('data:image/svg+xml,a');

        expect(doc.getElementById('ico')).toBeNull();
        expect(doc.getElementById('svg')).toBeNull();
        expect(doc.getElementById('shortcut')).toBeNull();
        expect(doc.getElementById('apple')).not.toBeNull();

        const links = iconLinks();
        expect(links).toHaveLength(1);
        expect(links[0].getAttribute('rel')).toBe('icon');
        expect(links[0].getAttribute('type')).toBe('image/svg+xml');
        expect(links[0].getAttribute('href')).toBe('data:image/svg+xml,a');
    });

    it('leaves one live link after repeated shows, replacing the element', () => {
        const tabIcon = new LiveTabIcon(doc);
        tabIcon.show('data:image/svg+xml,a');
        const first = iconLinks()[0];
        tabIcon.show('data:image/svg+xml,b');

        const links = iconLinks();
        expect(links).toHaveLength(1);
        expect(links[0]).not.toBe(first);
        expect(links[0].getAttribute('href')).toBe('data:image/svg+xml,b');
    });

    it('restores the originals in their positions', () => {
        const before = ids(),
            tabIcon = new LiveTabIcon(doc);

        tabIcon.show('data:image/svg+xml,a');
        tabIcon.show('data:image/svg+xml,b');
        tabIcon.restore();

        expect(ids()).toEqual(before);
        expect(iconLinks().map(it => it.getAttribute('href'))).toEqual([
            '/favicon.ico',
            '/favicon.svg',
            '/legacy.ico'
        ]);
    });

    it('can show again after a restore', () => {
        const before = ids(),
            tabIcon = new LiveTabIcon(doc);
        tabIcon.show('data:image/svg+xml,a');
        tabIcon.restore();
        tabIcon.show('data:image/svg+xml,b');
        expect(iconLinks()).toHaveLength(1);
        tabIcon.restore();
        expect(ids()).toEqual(before);
    });

    it('makes restore a no-op before any show', () => {
        const before = ids();
        new LiveTabIcon(doc).restore();
        expect(ids()).toEqual(before);
    });

    it('reports canPreview for a top-level window only', () => {
        expect(new LiveTabIcon(document).canPreview).toBe(true);
        // A document with no window (e.g. created via DOMImplementation) cannot preview.
        expect(new LiveTabIcon(doc).canPreview).toBe(false);
    });
});
