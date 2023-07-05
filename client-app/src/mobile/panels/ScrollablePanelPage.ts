import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/Icon';
import {switchInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {filler, p, span} from '@xh/hoist/cmp/layout';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';
import {ScrollablePanelPageModel} from './ScrollablePanelPageModel';

export const scrollablePanelPage = hoistCmp.factory({
    model: creates(ScrollablePanelPageModel),

    render({model}) {
        const items = [
            p(
                'This Panel is set to be scrollable, causing its inner contents to scroll when overflowed.'
            )
        ];

        if (model.showLongContent) {
            items.push(
                p(
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse at urna rutrum, condimentum mi semper, faucibus nisi. In eleifend vel ante ut imperdiet. In a interdum dolor. Sed tincidunt enim erat, at sodales neque faucibus nec. Maecenas pretium pulvinar placerat. Ut nec semper libero, a tincidunt tortor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam non urna vitae tellus imperdiet scelerisque. Donec eu placerat magna, sed auctor diam. Duis mi nisi, interdum nec velit in, sollicitudin luctus tellus. Cras lobortis, ipsum ut pulvinar condimentum, massa magna ullamcorper dolor, a gravida quam massa ac libero. Integer orci sapien, egestas laoreet dui nec, scelerisque viverra nisi. Aliquam tincidunt lectus eu lectus mollis, ut placerat nisl tincidunt.'
                ),
                p(
                    'Maecenas ligula elit, consectetur a ultricies at, egestas a magna. Donec dictum tristique nunc, nec pellentesque diam accumsan quis. Quisque ornare elit non viverra fermentum. Sed interdum viverra nisi, eget pellentesque lorem molestie ut. Phasellus purus lorem, placerat posuere dui vitae, condimentum luctus libero. Donec a dignissim augue. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Suspendisse eget ultricies dolor, sit amet faucibus mauris. Donec volutpat malesuada ligula sed auctor. Morbi at libero vestibulum nulla imperdiet imperdiet at sed orci. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque porta mi ac est rutrum aliquet. Etiam vulputate porttitor eros, at mattis est blandit ac. Aliquam ligula ante, maximus sit amet est sed, congue gravida eros. Donec aliquam diam ac lorem cursus elementum sed vel tortor. Suspendisse congue quam massa, nec tempus odio lacinia ut.'
                )
            );
        }

        return panel({
            scrollable: true,
            title: 'Scrollable Panel',
            icon: Icon.favorite(),
            className: 'tb-panels-scrollable-panel',
            items,
            bbar: toolbar(
                filler(),
                span('Add lots of content'),
                switchInput({bind: 'showLongContent'})
            )
        });
    }
});
