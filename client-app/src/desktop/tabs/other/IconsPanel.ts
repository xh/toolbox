import {div, filler, placeholder, span} from '@xh/hoist/cmp/layout';
import type {Intent} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {select, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import type {IconCatalogEntry} from '@xh/hoist/icon';
import {Icon} from '@xh/hoist/icon';
import {bindable, computed} from '@xh/hoist/mobx';
import {copyToClipboard} from '@xh/hoist/utils/js';
import {isEmpty} from 'lodash';
import {wrapper, wrapperOption} from '../../common/Wrapper';
import './IconsPanel.scss';
import {iconsIcon} from '../../../core/Icons';

export const iconsPanel = hoistCmp.factory({
    model: creates(() => IconsPanelModel),
    render({model}) {
        return wrapper({
            title: 'Icons',
            icon: iconsIcon(),
            description: [
                'Hoist includes the latest version of the ubiquitous [Font',
                'Awesome](https://fontawesome.com/icons) library and its companion project,',
                'react-fontawesome. Hoist exports an `Icon` constant to expose a preselected',
                'set of icons as element factories. This ensures that many of the most common',
                'glyphs are built-in (while also mapping icons to several concepts particular',
                'to finance and trading).',
                '',
                'Apps are not limited to the set of FA icons imported by the framework. Pass any',
                "imported FA definition to `Icon.register()` to add it to Hoist's icon catalog and",
                "get back a factory for it. The icon shown in this tab's title is one such custom",
                'registration - see `core/Icons.ts` in Toolbox.',
                '',
                "Browse the catalog below via `Icon.getCatalog()` - Hoist's built-in set plus",
                "Toolbox's own registrations, flagged as custom. Search matches each icon's",
                'aliases and keywords. Click any icon to copy the call that renders it.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/IconsPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/icon/README.md',
                    text: 'Icon docs',
                    notes: 'Icon system guide.'
                },
                {
                    url: '$TB/client-app/src/core/Icons.ts',
                    notes: 'Toolbox custom icon registrations.'
                },
                {
                    url: 'https://fontawesome.com/icons',
                    text: 'FontAwesome',
                    notes:
                        'The library used by Hoist to provide enumerated icons. Note that not all icons are included ' +
                        'in the Hoist Icon class, but can be easily added.'
                }
            ],
            options: [
                wrapperOption({
                    label: 'Style',
                    propName: 'IconProps.prefix',
                    control: select({
                        model,
                        bind: 'prefix',
                        width: 150,
                        enableFilter: false,
                        hideSelectedOptionCheck: true,
                        options: [
                            {value: 'far', label: 'Regular'},
                            {value: 'fas', label: 'Solid'},
                            {value: 'fal', label: 'Light'},
                            {value: 'fat', label: 'Thin'}
                        ]
                    })
                }),
                wrapperOption({
                    label: 'Intent',
                    propName: 'IconProps.intent',
                    control: select({
                        model,
                        bind: 'intent',
                        width: 150,
                        enableFilter: false,
                        hideSelectedOptionCheck: true,
                        options: [
                            {value: 'neutral', label: 'Neutral'},
                            {value: 'primary', label: 'Primary'},
                            {value: 'success', label: 'Success'},
                            {value: 'warning', label: 'Warning'},
                            {value: 'danger', label: 'Danger'}
                        ]
                    })
                })
            ],
            item: panel({
                className: 'tb-icons-panel',
                tbar: tbar(),
                item: gallery()
            })
        });
    }
});

const tbar = hoistCmp.factory<IconsPanelModel>(({model}) =>
    toolbar(
        textInput({
            model,
            bind: 'query',
            leftIcon: Icon.search(),
            enableClear: true,
            placeholder: 'Filter by name, alias or keyword...',
            commitOnChange: true,
            flex: 1,
            maxWidth: 320
        }),
        filler(),
        span(`${model.entries.length} icons`)
    )
);

const gallery = hoistCmp.factory<IconsPanelModel>(({model}) => {
    const {entries} = model;
    if (isEmpty(entries)) {
        return placeholder(Icon.search(), `No icons match "${model.query}"`);
    }
    return div({
        className: 'tb-icons-gallery',
        items: entries.map(entry => iconTile({key: entry.iconName, entry}))
    });
});

const iconTile = hoistCmp.factory<IconsPanelModel>(({model, entry}) => {
    const {name, isCustom} = entry,
        // Registered names are not typed on `Icon`, so resolve custom icons by name.
        usage = isCustom ? `Icon.get('${name}')` : `Icon.${name}()`;
    return div({
        className: 'tb-icons-tile',
        title: `${entry.displayName}\nAliases: ${entry.names.join(', ')}\n\nClick to copy ${usage}`,
        onClick: () =>
            copyToClipboard(usage)
                .then(() => XH.successToast(`Copied ${usage}`))
                .catch(() => XH.warningToast(`Could not copy ${usage}`)),
        items: [
            div({
                className: 'tb-icons-tile__glyph',
                item: entry.factory({
                    prefix: model.prefix,
                    size: '2x',
                    intent: model.intent === 'neutral' ? null : model.intent
                })
            }),
            div({className: 'tb-icons-tile__name', item: name}),
            div({omit: !isCustom, className: 'tb-icons-tile__badge', item: 'custom'})
        ]
    });
});

function matches(entry: IconCatalogEntry, query: string): boolean {
    const {displayName, names, keywords} = entry;
    return [displayName, ...names, ...keywords].some(it => it.toLowerCase().includes(query));
}

class IconsPanelModel extends HoistModel {
    @bindable accessor query = '';
    @bindable accessor prefix: 'far' | 'fas' | 'fal' | 'fat' = 'far';
    @bindable accessor intent: 'neutral' | Intent = 'neutral';

    @computed
    get entries(): IconCatalogEntry[] {
        const query = this.query?.trim().toLowerCase(),
            all = Icon.getCatalog();
        return query ? all.filter(it => matches(it, query)) : all;
    }
}
