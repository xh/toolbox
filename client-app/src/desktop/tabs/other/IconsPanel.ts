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
                'Hoist builds on [Font Awesome Pro](https://fontawesome.com/icons) (FA), a commercial',
                'icon library. Each app needs its own FA Pro license, and a license token to install',
                'the Pro packages. The `Icon` singleton exposes a curated set of FA glyphs as element',
                'factories, such as `Icon.check()`. It adds semantic aliases such as `Icon.add()`',
                'and `Icon.refresh()`, plus icons for several finance and trading concepts.',
                '',
                'Apps can add any other FA glyph with `Icon.register()`. Pass the imported',
                "definition, and Hoist adds it to the FA library and to Hoist's icon catalog. The",
                'call returns a factory to export and use:',
                '',
                '```ts',
                'const invoiceIcon = Icon.register({',
                "    name: 'invoice',",
                '    defs: faFileInvoiceDollar',
                '});',
                '```',
                '',
                "The icon in this sidebar's header is registered this way, in `core/Icons.ts`.",
                '',
                '`Icon.get()` renders any icon in the catalog from its name, such as a choice saved',
                'by a user. `IconPicker` lets users make that choice - see its page under Forms +',
                'Inputs. To change an icon that Hoist itself uses, such as `Icon.refresh()`,',
                'register a new icon under that name with `replace: true`.',
                '',
                "Browse the catalog below with `Icon.getCatalog()`: Hoist's built-in set plus",
                "Toolbox's own registrations, badged as app icons. Search matches each icon's",
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
                    notes: "The library behind Hoist's icons. Add any glyph not in Hoist's set with Icon.register()."
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
        items: entries.map(entry => iconTile({key: entry.faName, entry}))
    });
});

const iconTile = hoistCmp.factory<IconsPanelModel>(({model, entry}) => {
    const {name} = entry,
        isAppIcon = entry.source === 'app',
        // Registered names are not typed on `Icon`, so resolve app icons by name.
        usage = isAppIcon ? `Icon.get('${name}')` : `Icon.${name}()`;
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
            div({omit: !isAppIcon, className: 'tb-icons-tile__badge', item: 'app'})
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
