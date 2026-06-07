import {library} from '@fortawesome/fontawesome-svg-core';
import {faIcons} from '@fortawesome/pro-regular-svg-icons';
import {div, filler, placeholder, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, Intent, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable, computed, makeObservable} from '@xh/hoist/mobx';
import {copyToClipboard} from '@xh/hoist/utils/js';
import {isEmpty, without} from 'lodash';
import {wrapper} from '../../common';
import './IconsPanel.scss';

// Register a custom icon - not pre-imported by `Icon` - and use it as this tab's title icon
// below to demonstrate pulling any glyph from Font Awesome into an app.
// @see https://www.npmjs.com/package/@fortawesome/react-fontawesome#build-a-library-to-reference-icons-throughout-your-app-more-conveniently
library.add(faIcons);

export const iconsPanel = hoistCmp.factory({
    model: creates(() => IconsPanelModel),
    render() {
        return wrapper({
            title: 'Icons',
            icon: Icon.icon({iconName: 'icons'}),
            description: [
                'Hoist includes the latest version of the ubiquitous [Font',
                'Awesome](https://fontawesome.com/icons) library and its companion project,',
                'react-fontawesome. Hoist exports an `Icon` constant to expose a preselected',
                'set of icons as element factories. This ensures that many of the most common',
                'glyphs are built-in (while also mapping icons to several concepts particular',
                'to finance and trading).',
                '',
                'Apps are not limited to the set of FA icons imported by the framework.',
                'Developers can use any icon from the library, as long as they import those',
                'glyphs directly and register them with FA to include them in the bundled',
                "output. The icon shown in this tab's title is one such custom import.",
                '',
                'Browse the built-in set below, and click any icon to copy its factory call.'
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
                    url: 'https://fontawesome.com/icons',
                    text: 'FontAwesome',
                    notes:
                        'The library used by Hoist to provide enumerated icons. Note that not all icons are included ' +
                        'in the Hoist Icon class, but can be easily added.'
                }
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
            placeholder: 'Filter icons by name...',
            commitOnChange: true,
            flex: 1,
            maxWidth: 320
        }),
        toolbarSep(),
        span('Style:'),
        buttonGroupInput({
            model,
            bind: 'prefix',
            minimal: true,
            outlined: true,
            items: [
                button({text: 'Regular', value: 'far'}),
                button({text: 'Solid', value: 'fas'}),
                button({text: 'Light', value: 'fal'}),
                button({text: 'Thin', value: 'fat'})
            ]
        }),
        toolbarSep(),
        span('Intent:'),
        buttonGroupInput({
            model,
            bind: 'intent',
            minimal: true,
            outlined: true,
            items: [
                button({text: 'Neutral', value: 'neutral'}),
                button({text: 'Primary', value: 'primary', intent: 'primary'}),
                button({text: 'Success', value: 'success', intent: 'success'}),
                button({text: 'Warning', value: 'warning', intent: 'warning'}),
                button({text: 'Danger', value: 'danger', intent: 'danger'})
            ]
        }),
        filler(),
        span({className: 'tb-icons-count', item: `${model.iconNames.length} icons`})
    )
);

const gallery = hoistCmp.factory<IconsPanelModel>(({model}) => {
    const {iconNames} = model;
    if (isEmpty(iconNames)) {
        return placeholder(Icon.search(), `No icons match "${model.query}"`);
    }
    return div({
        className: 'tb-icons-gallery',
        items: iconNames.map(name => iconTile({key: name, name}))
    });
});

const iconTile = hoistCmp.factory<IconsPanelModel>(({model, name}) => {
    const usage = `Icon.${name}()`;
    return div({
        className: 'tb-icons-tile',
        title: `Click to copy ${usage}`,
        onClick: () =>
            copyToClipboard(usage)
                .then(() => XH.successToast(`Copied ${usage}`))
                .catch(() => XH.warningToast(`Could not copy ${usage}`)),
        items: [
            div({
                className: 'tb-icons-tile__glyph',
                item: Icon[name]({
                    prefix: model.prefix,
                    size: '2x',
                    intent: model.intent === 'neutral' ? null : model.intent
                })
            }),
            div({className: 'tb-icons-tile__name', item: name})
        ]
    });
});

function getAllIconNames(): string[] {
    return without(Object.keys(Icon), 'icon', 'fileIcon', 'placeholder').sort();
}

class IconsPanelModel extends HoistModel {
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
