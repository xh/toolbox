import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {table, tbody, td, th, tr} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import './IconPage.scss';
import {without} from 'lodash';

export const iconPage = hoistCmp.factory({
    render() {
        return panel({
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
