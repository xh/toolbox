import {div, filler, img, placeholder, vframe} from '@xh/hoist/cmp/layout';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {storeCountLabel, storeFilterField} from '@xh/hoist/cmp/store';
import {hoistCmp, uses} from '@xh/hoist/core';
import {dataView} from '@xh/hoist/cmp/dataview';
import {button} from '@xh/hoist/desktop/cmp/button';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtCompactDate} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {compact, uniq} from 'lodash';
// @ts-ignore
import stockPhoto from '../../core/img/stock-news.png';
import {NewsPanelModel} from './NewsPanelModel';
import './NewsPanelItem.scss';

export const newsPanel = hoistCmp.factory({
    model: uses(NewsPanelModel),
    render() {
        return panel({
            className: 'tb-news-panel',
            width: '100%',
            height: '100%',
            mask: 'onLoad',
            // Lay the list + detail side-by-side by making the Panel's own content frame a row,
            // rather than nesting them in an explicit hframe.
            contentBoxProps: {flexDirection: 'row'},
            items: [
                panel({
                    item: dataView({
                        // Allow standard OS-level selection of text within the DataView.
                        // Works along with AppSpec config `showBrowserContextMenu: true` in news.ts.
                        agOptions: {enableCellTextSelection: true}
                    }),
                    bbar: bbar()
                }),
                newsDetailPanel({className: 'xh-border-left'})
            ]
        });
    }
});

const bbar = hoistCmp.factory<NewsPanelModel>({
    render({model}) {
        const {store} = model.viewModel;
        return toolbar(
            storeFilterField({
                store,
                includeFields: model.SEARCH_FIELDS,
                placeholder: 'Filter by title...'
            }),
            select({
                bind: 'sourceFilterValues',
                options: model.sourceOptions,
                enableMulti: true,
                placeholder: 'Filter by source...',
                menuPlacement: 'top',
                width: 380
            }),
            filler(),
            storeCountLabel({store, unit: 'stories'})
        );
    }
});

//------------------------
// Master-detail reading pane
//------------------------
const newsDetailPanel = hoistCmp.factory<NewsPanelModel>({
    render({model, className}) {
        const record = model.viewModel.selectedRecord;
        return panel({
            className,
            collapsedTitle: 'Story',
            collapsedIcon: Icon.news(),
            compactHeader: true,
            modelConfig: {
                side: 'right',
                defaultSize: 400,
                minSize: 320,
                maxSize: 640,
                resizable: true,
                collapsible: true
            },
            item: record
                ? newsDetail({record})
                : placeholder(Icon.detail(), 'Select a story to read more.')
        });
    }
});

const newsDetail = hoistCmp.factory<NewsPanelModel>({
    model: uses(NewsPanelModel),
    render({model, record}) {
        const {title, text, imageUrl, source, author, published} = record.data,
            meta = uniq(compact([source, fmtCompactDate(published), author])).join('  •  ');

        return vframe({
            className: 'tb-news-detail',
            items: [
                div({
                    className: 'tb-news-detail__hero',
                    item: img({
                        src: imageUrl || stockPhoto,
                        alt: '',
                        onError: e => {
                            const el = e.target as HTMLImageElement;
                            el.onerror = null;
                            el.src = stockPhoto;
                        }
                    })
                }),
                div({
                    className: 'tb-news-detail__content',
                    items: [
                        div({className: 'tb-news-detail__meta', item: meta}),
                        div({className: 'tb-news-detail__title', item: title}),
                        div({className: 'tb-news-detail__body', item: text}),
                        div({
                            className: 'tb-news-detail__actions',
                            item: button({
                                text: 'Open original article',
                                icon: Icon.openExternal(),
                                intent: 'primary',
                                outlined: true,
                                onClick: () => model.openStory(record)
                            })
                        })
                    ]
                })
            ]
        });
    }
});
