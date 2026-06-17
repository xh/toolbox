import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {table, tbody, td, th, tr} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {exampleScreen} from '../cmp/example/ExampleScreen';
import './IconPage.scss';
import {without} from 'lodash';

export const iconPage = hoistCmp.factory({
    render() {
        return exampleScreen({
            title: 'Icons',
            icon: Icon.rocket(),
            description: [
                'Hoist `Icon` factories wrap Font Awesome (Pro) glyphs, each available in regular,',
                'solid, and light prefixes - returning ready-to-use SVG elements for buttons, grids,',
                'menus, and more.'
            ],
            links: [
                {url: '$TB/client-app/src/mobile/icons/IconPage.ts', notes: 'This example.'},
                {url: '$HR/icon/Icon.ts', text: 'Icon source'}
            ],
            item: panel({
                scrollable: true,
                className: 'tb-icon-page',
                item: table(
                    tbody(
                        tr(th('name'), th('regular'), th('solid'), th('light')),
                        ...allIcons().map(it =>
                            tr(td(it.name), td(it.regular), td(it.solid), td(it.light))
                        )
                    )
                )
            })
        });
    }
});

function allIcons() {
    const factories = without(Object.keys(Icon), 'icon', 'fileIcon');

    return factories.map(key => ({
        name: key,
        regular: Icon[key]({prefix: 'far', size: '2x'}),
        solid: Icon[key]({prefix: 'fas', size: '2x'}),
        light: Icon[key]({prefix: 'fal', size: '2x'})
    }));
}
