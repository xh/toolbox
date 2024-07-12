import {library} from '@fortawesome/fontawesome-svg-core';
import {faIcons} from '@fortawesome/pro-regular-svg-icons';
import {creates, hoistCmp, HoistModel, Intent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {div, fragment, hspacer, table, tbody, td, th, thead, tr} from '@xh/hoist/cmp/layout';
import {startCase, without} from 'lodash';
import React from 'react';
import {wrapper} from '../../common';
import './IconsPanel.scss';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';

// Register a custom icon - used within this app / not pre-imported by `Icon` - imported above.
// @see https://www.npmjs.com/package/@fortawesome/react-fontawesome#build-a-library-to-reference-icons-throughout-your-app-more-conveniently
library.add(faIcons);

export const iconsPanel = hoistCmp.factory({
    model: creates(() => IconsPanelModel),
    render() {
        return wrapper({
            description: [
                <p>
                    Hoist includes the latest version of the ubiquitous{' '}
                    <a href="https://fontawesome.com/icons" target="_blank">
                        Font Awesome
                    </a>{' '}
                    library and its companion project, react-fontawesome. Hoist exports an{' '}
                    <code>Icon</code> constant to expose a preselected set of icons as element
                    factories. This ensures that many of the most common glyphs are built-in (while
                    also mapping icons to several concepts particular to finance and trading).
                </p>,
                <p>
                    Apps are not limited to the set of FA icons imported by the framework.
                    Developers can use any icon from the library, as long as they import those
                    glyphs directly and register them with FA to include them in the bundled output.
                    The icon used in the panel header below provides an example of this usage.
                </p>
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/IconsPanel.tsx',
                    notes: 'This example.'
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
                title: 'Icons (regular, solid, and light variants)',
                icon: Icon.icon({iconName: 'icons'}),
                className: 'tb-icons-panel',
                items: [
                    tbar(),
                    div({
                        className: 'tb-icons-table-scroller',
                        items: [
                            table(
                                thead(tr(th('Icon'), th('far'), th('fas'), th('fal'), th('fat'))),
                                tbody(getAllIconNames().map(iconName => iconRow({iconName})))
                            )
                        ]
                    })
                ]
            })
        });
    }
});

const tbar = hoistCmp.factory(({model}) =>
    fragment(
        toolbar(
            'Font Size:',
            hspacer(5),
            buttonGroupInput({
                model,
                bind: 'fontSize',
                minimal: true,
                outlined: true,
                items: [
                    sizeButton('small', {className: 'font-size--small'}),
                    sizeButton('default', {className: 'font-size--default'}),
                    sizeButton('large', {className: 'font-size--large'})
                ]
            }),
            hspacer(30),
            'Intent:',
            hspacer(5),
            buttonGroupInput({
                model,
                bind: 'intent',
                minimal: true,
                outlined: true,
                items: [
                    intentButton('neutral'),
                    intentButton('primary'),
                    intentButton('success'),
                    intentButton('warning'),
                    intentButton('danger')
                ]
            })
        ),
        toolbar(
            'Icon Size:',
            hspacer(5),
            buttonGroupInput({
                model,
                bind: 'size',
                minimal: true,
                outlined: true,
                items: [
                    sizeButton('2xs'),
                    sizeButton('xs'),
                    sizeButton('sm'),
                    sizeButton('default', {value: ''}),
                    sizeButton('lg'),
                    sizeButton('xl'),
                    sizeButton('2xl'),
                    sizeButton('1x'),
                    sizeButton('2x'),
                    sizeButton('3x'),
                    sizeButton('4x'),
                    sizeButton('5x'),
                    sizeButton('6x'),
                    sizeButton('7x'),
                    sizeButton('8x'),
                    sizeButton('9x'),
                    sizeButton('10x')
                ]
            })
        )
    )
);

function sizeButton(size, props = {}) {
    return button({
        text: size,
        value: size,
        ...props
    });
}

function intentButton(intent: 'neutral' | Intent) {
    return button({
        text: startCase(intent),
        value: intent,
        intent: intent === 'neutral' ? null : intent
    });
}

const iconRow = hoistCmp.factory<IconsPanelModel>(({model, iconName}) => {
    return tr({
        key: iconName,
        className: `font-size--${model.fontSize}`,
        items: [
            td(iconName),
            td(icon({iconName, prefix: 'far'})),
            td(icon({iconName, prefix: 'fas'})),
            td(icon({iconName, prefix: 'fal'})),
            td(icon({iconName, prefix: 'fat'}))
        ]
    });
});

const icon = hoistCmp.factory<IconsPanelModel>(({model, iconName, prefix}) => {
    return Icon[iconName]({
        prefix,
        size: model.size,
        intent: model.intent === 'neutral' ? null : model.intent
    });
});

function getAllIconNames(): string[] {
    return without(Object.keys(Icon), 'icon', 'fileIcon', 'placeholder').sort();
}

class IconsPanelModel extends HoistModel {
    @bindable fontSize: 'small' | 'default' | 'large' = 'default';
    @bindable size = '2x';
    @bindable intent: 'neutral' | Intent = 'neutral';

    constructor() {
        super();
        makeObservable(this);
    }
}
