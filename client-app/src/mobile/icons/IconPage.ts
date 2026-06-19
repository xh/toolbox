import {library} from '@fortawesome/fontawesome-svg-core';
import {faIcons} from '@fortawesome/pro-regular-svg-icons';
import {box, div, placeholder, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, Intent, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {select, textInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';
import {bindable, computed, makeObservable} from '@xh/hoist/mobx';
import {copyToClipboard} from '@xh/hoist/utils/js';
import {isEmpty, without} from 'lodash';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import './IconPage.scss';

// Register a custom icon - not pre-imported by `Icon` - and use it as this example's title icon
// to demonstrate pulling any glyph from Font Awesome into an app.
library.add(faIcons);

export const iconPage = hoistCmp.factory({
    model: creates(() => IconPageModel),

    render({model}) {
        return exampleScreen({
            title: 'Icons',
            icon: Icon.icon({iconName: 'icons'}),
            description: [
                'Hoist bundles the [Font Awesome](https://fontawesome.com/icons) library and exposes',
                'a preselected set of glyphs as element factories on the `Icon` constant - covering',
                'the most common icons plus several finance / trading concepts.',
                '',
                'Apps are not limited to this set: any Font Awesome glyph can be imported directly and',
                "registered, as the icon in this example's title bar demonstrates.",
                '',
                'Filter the built-in set below, and tap any icon to copy its factory call.'
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
                placeholder: 'Filter by name...',
                commitOnChange: true
            })
        }),
        span({className: 'tb-icon-page__count', item: `${model.iconNames.length}`})
    )
);

const gallery = hoistCmp.factory<IconPageModel>(({model}) => {
    const {iconNames} = model;
    if (isEmpty(iconNames)) {
        return placeholder(Icon.search(), `No icons match "${model.query}"`);
    }
    return div({
        className: 'tb-icon-page__gallery',
        items: iconNames.map(name => iconTile({key: name, name}))
    });
});

const iconTile = hoistCmp.factory<IconPageModel>(({model, name}) => {
    const usage = `Icon.${name}()`;
    return div({
        className: 'tb-icon-page__tile',
        onClick: () =>
            copyToClipboard(usage)
                .then(() => XH.successToast(`Copied ${usage}`))
                .catch(() => XH.warningToast(`Could not copy ${usage}`)),
        items: [
            div({
                className: 'tb-icon-page__glyph',
                item: Icon[name]({
                    prefix: model.prefix,
                    size: '2x',
                    intent: model.intent === 'neutral' ? null : model.intent
                })
            }),
            div({className: 'tb-icon-page__name', item: name})
        ]
    });
});

function getAllIconNames(): string[] {
    return without(Object.keys(Icon), 'icon', 'fileIcon', 'placeholder').sort();
}

class IconPageModel extends HoistModel {
    @bindable query = '';
    @bindable prefix: 'far' | 'fas' | 'fal' | 'fat' = 'far';
    @bindable intent: 'neutral' | Intent = 'neutral';

    @computed
    get iconNames(): string[] {
        const query = this.query?.trim().toLowerCase(),
            all = getAllIconNames();
        return query ? all.filter(name => name.toLowerCase().includes(query)) : all;
    }

    constructor() {
        super();
        makeObservable(this);
    }
}
