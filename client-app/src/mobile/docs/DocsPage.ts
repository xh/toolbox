import {filler, hbox, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/mobile/cmp/button';
import {menuButton} from '@xh/hoist/mobile/cmp/menu';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {docContent} from '../../core/docs/DocContent';
import {DocService} from '../../core/svc/DocService';
import {DocsPageModel} from './DocsPageModel';
import './DocsPage.scss';

/**
 * Mobile Navigator page for the in-app documentation reader. Renders a single doc via the shared
 * `docContent` body component. Two stacked header rows sit below the app bar: the source > category
 * breadcrumb on top (the hierarchy "above" the page), then the doc title sharing a bar with the
 * "On this page" section-jump menu. A footer pager steps through the current category. Back
 * navigation is provided automatically by the Navigator for pushed pages.
 */
export const docsPage = hoistCmp.factory({
    displayName: 'DocsPage',
    model: creates(DocsPageModel),

    render({model}) {
        return panel({
            className: 'tb-docs-page',
            headerClassName: 'tb-docs-page__crumb-header',
            title: breadcrumb(),
            mask: 'onLoad',
            tbar: titleBar(),
            item: docContent({model}),
            bbar: pagerBar()
        });
    }
});

/** Footer pager - steps prev/next through the active doc's category siblings. */
const pagerBar = hoistCmp.factory<DocsPageModel>({
    render({model}) {
        const {prevDoc, nextDoc} = model;
        if (!prevDoc && !nextDoc) return null;
        return toolbar({
            className: 'tb-docs-page__pager',
            items: [
                button({
                    className: 'tb-docs-page__pager-btn',
                    minimal: true,
                    omit: !prevDoc,
                    onClick: () => model.navigatePrev(),
                    text: hbox({
                        className: 'tb-docs-page__pager-label',
                        items: [
                            Icon.chevronLeft(),
                            span({className: 'tb-docs-page__pager-title', item: prevDoc?.title})
                        ]
                    })
                }),
                filler(),
                button({
                    className: 'tb-docs-page__pager-btn tb-docs-page__pager-btn--next',
                    minimal: true,
                    omit: !nextDoc,
                    onClick: () => model.navigateNext(),
                    text: hbox({
                        className: 'tb-docs-page__pager-label',
                        items: [
                            span({className: 'tb-docs-page__pager-title', item: nextDoc?.title}),
                            Icon.chevronRight()
                        ]
                    })
                })
            ]
        });
    }
});

/** Top header line: the source > category breadcrumb (the hierarchy above the current doc). */
const breadcrumb = hoistCmp.factory<DocsPageModel>({
    render({model}) {
        const {activeSource, activeCategory} = model;
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
                    : null
            ]
        });
    }
});

/** Lower header line: the doc title sharing the bar with the "On this page" section-jump menu. */
const titleBar = hoistCmp.factory<DocsPageModel>({
    render({model}) {
        const {activeDoc, sections} = model;
        return toolbar({
            className: 'tb-docs-page__title-bar',
            items: [
                span({className: 'tb-docs-page__title-text', item: activeDoc?.title ?? 'Docs'}),
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
            actionFn: () => model.scrollToSection(sec.id)
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
