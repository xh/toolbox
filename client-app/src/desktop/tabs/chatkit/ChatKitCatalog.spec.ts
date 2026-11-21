import {describe, expect, it} from 'vitest';
import {CHAT_KIT_GROUPS, CHAT_KIT_PAGES, chatKitPage, chatKitRoute} from './ChatKitCatalog';
import {chatKitRoutes, chatKitTab} from './ChatKitTab';

describe('Chat Kit catalog', () => {
    it('has unique page ids, each in a known group', () => {
        const ids = CHAT_KIT_PAGES.map(it => it.id),
            groups = CHAT_KIT_GROUPS.map(it => it.key);
        expect(new Set(ids).size).toBe(ids.length);
        CHAT_KIT_PAGES.forEach(it => expect(groups).toContain(it.group));
    });

    it('resolves a page and its route by id, and fails fast on a typo', () => {
        expect(chatKitPage('overview').title).toBe('Overview');
        expect(chatKitRoute('genUi')).toBe('default.chatkit.genUi');
        expect(() => chatKitPage('nope')).toThrow('Unknown Chat Kit page: nope');
    });
});

describe('Chat Kit tab', () => {
    it('gives every catalog page a tab with content, in catalog order', () => {
        const {content} = chatKitTab({mode: 'static'}),
            tabs = (content as {tabs: Array<{id: string; group: string; content: unknown}>}).tabs;
        expect(tabs.map(it => it.id)).toEqual(CHAT_KIT_PAGES.map(it => it.id));
        tabs.forEach(it => expect(it.content).toBeTruthy());
    });

    it('routes every page, with the thread id as a param on the workspace page', () => {
        const {children} = chatKitRoutes();
        expect(children.map(it => it.name)).toEqual(CHAT_KIT_PAGES.map(it => it.id));
        expect(children.find(it => it.name === 'workspace').path).toBe('/workspace?threadId');
    });
});
