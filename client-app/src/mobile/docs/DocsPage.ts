import {filler, hbox, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {menuButton} from '@xh/hoist/mobile/cmp/menu';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {docContent} from '../../core/docs/DocContent';
import {DocService} from '../../core/svc/DocService';
import {DocsPageModel} from './DocsPageModel';
import './DocsPage.scss';

/**
 * Mobile Navigator page for the in-app documentation reader. Renders a single doc via the shared
 * `docContent` body component, with a breadcrumb context row and an "On this page" section-jump
 * menu in a top toolbar. Back navigation is provided automatically by the Navigator for pushed pages.
 */
export const docsPage = hoistCmp.factory({
    displayName: 'DocsPage',
    model: creates(DocsPageModel),

    render({model}) {
        const {activeDoc, loadContentTask} = model;
        return panel({
            className: 'tb-docs-page',
            title: activeDoc?.title ?? 'Docs',
            icon: Icon.book(),
            mask: loadContentTask,
            tbar: breadcrumbBar(),
            item: docContent({model})
        });
    }
});

/** Lightweight context row: source name > category, plus an "On this page" section-jump menu. */
const breadcrumbBar = hoistCmp.factory<DocsPageModel>({
    render({model}) {
        const {activeSource, activeCategory, sections} = model;
        if (!activeSource) return null;
        const sourceLabel = DocService.instance.getSourceLabel(activeSource);
        return hbox({
            className: 'tb-docs-page__crumb',
            items: [
                span({className: 'tb-docs-page__crumb-src', item: sourceLabel}),
                activeCategory
                    ? span({className: 'tb-docs-page__crumb-sep', item: Icon.chevronRight()})
                    : null,
                activeCategory
                    ? span({className: 'tb-docs-page__crumb-cat', item: activeCategory.title})
                    : null,
                filler(),
                onThisPageButton({omit: !sections.length})
            ]
        });
    }
});

/**
 * "On this page" button that opens a mobile menu listing the doc's H2 sections. Selecting a section
 * scrolls the rendered body to the matching heading and updates the active-section tracker.
 */
const onThisPageButton = hoistCmp.factory<DocsPageModel>({
    render({model}) {
        const menuItems = model.sections.map(sec => ({
            text: sec.title,
            actionFn: () => {
                const el = document.getElementById(sec.id);
                if (el) {
                    el.scrollIntoView({block: 'start'});
                    model.setActiveSection(sec.id);
                }
            }
        }));

        return menuButton({
            icon: Icon.list(),
            text: 'On this page',
            minimal: true,
            menuItems,
            menuPosition: 'bottom-right'
        });
    }
});
