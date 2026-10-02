import {box, div, placeholder, span} from '@xh/hoist/cmp/layout';
import type {Intent} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import type {IconCatalogEntry} from '@xh/hoist/icon';
import {Icon} from '@xh/hoist/icon';
import {select, textInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';
import {bindable, computed} from '@xh/hoist/mobx';
import {copyToClipboard} from '@xh/hoist/utils/js';
import {isEmpty} from 'lodash';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import './IconPage.scss';
import {iconsIcon} from '../../core/Icons';

export const iconPage = hoistCmp.factory({
    model: creates(() => IconPageModel),

    render({model}) {
        return exampleScreen({
            title: 'Icons',
            icon: iconsIcon(),
            description: [
                'Hoist bundles the [Font Awesome](https://fontawesome.com/icons) library and exposes',
                'a preselected set of glyphs as element factories on the `Icon` constant - covering',
                'the most common icons plus several finance / trading concepts.',
                '',
                'Apps are not limited to this set: pass any imported Font Awesome glyph to',
                "`Icon.register()` to add it to Hoist's icon catalog, as the icon in this example's",
                'title bar demonstrates.',
                '',
                'Filter the catalog below - built-ins plus Toolbox registrations, flagged as custom -',
                'and tap any icon to copy the call that renders it.'
            ],
            options: [
                exampleOption({
                    label: 'Style',
                    control: select({
                        model,
                        bind: 'prefix',
                        width: 130,
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
                exampleOption({
                    label: 'Intent',
                    control: select({
                        model,
                        bind: 'intent',
                        width: 130,
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
            links: [
                {url: '$TB/client-app/src/mobile/icons/IconPage.ts', notes: 'This example.'},
                {url: '$HR/icon/README.md', text: 'Icon docs', notes: 'Icon system guide.'},
                {
                    url: 'https://fontawesome.com/icons',
                    text: 'FontAwesome',
                    notes: 'The underlying glyph library - opens browser.'
                }
            ],
            item: panel({
                className: 'tb-icon-page',
                tbar: tbar(),
                item: gallery()
            })
        });
    }
});

const tbar = hoistCmp.factory<IconPageModel>(({model}) =>
    toolbar(
        box({
            flex: 1,
            item: textInput({
                model,
                bind: 'query',
                leftIcon: Icon.search(),
                enableClear: true,
                placeholder: 'Filter by name or keyword...',
                commitOnChange: true
            })
        }),
        span({className: 'tb-icon-page__count', item: `${model.entries.length}`})
    )
);

const gallery = hoistCmp.factory<IconPageModel>(({model}) => {
    const {entries} = model;
    if (isEmpty(entries)) {
        return placeholder(Icon.search(), `No icons match "${model.query}"`);
    }
    return div({
        className: 'tb-icon-page__gallery',
        items: entries.map(entry => iconTile({key: entry.iconName, entry}))
    });
});

const iconTile = hoistCmp.factory<IconPageModel>(({model, entry}) => {
    const {name, isCustom} = entry,
        // Registered names are not typed on `Icon`, so resolve custom icons by name.
        usage = isCustom ? `Icon.get('${name}')` : `Icon.${name}()`;
    return div({
        className: 'tb-icon-page__tile',
        onClick: () =>
            copyToClipboard(usage)
                .then(() => XH.successToast(`Copied ${usage}`))
                .catch(() => XH.warningToast(`Could not copy ${usage}`)),
        items: [
            div({
                className: 'tb-icon-page__glyph',
                item: entry.factory({
                    prefix: model.prefix,
                    size: '2x',
                    intent: model.intent === 'neutral' ? null : model.intent
                })
            }),
            div({className: 'tb-icon-page__name', item: name}),
            div({omit: !isCustom, className: 'tb-icon-page__badge', item: 'custom'})
        ]
    });
});

function matches(entry: IconCatalogEntry, query: string): boolean {
    const {displayName, names, keywords} = entry;
    return [displayName, ...names, ...keywords].some(it => it.toLowerCase().includes(query));
}

class IconPageModel extends HoistModel {
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
