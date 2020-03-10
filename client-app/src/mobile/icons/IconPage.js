import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {table, tbody, tr, th, td} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';

import './IconPage.scss';

export const iconPage = hoistCmp.factory({
    render() {
        return panel({
            scrollable: true,
            className: 'icon-page',
            item: table(
                tbody({
                    items: [
                        tr(th('name'), th('regular'), th('solid'), th('light')),
                        ...allIcons().map(
                            it => tr(td(it.name), td(it.regular), td(it.solid), td(it.light))
                        )
                    ]
                })
            )
        });
    }
});

function allIcons() {
    return Object.keys(Icon).map(key => ({
        name: key,
        regular: Icon[key]({size: '2x'}),
        solid: Icon[key]({prefix: 'fas', size: '2x'}),
        light: Icon[key]({prefix: 'fal', size: '2x'})
    }));
}