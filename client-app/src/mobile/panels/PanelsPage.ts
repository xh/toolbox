import {filler, p} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/Icon';
import {button} from '@xh/hoist/mobile/cmp/button';
import {switchInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/mobile/cmp/toolbar';
import {bindable} from '@xh/hoist/mobx';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import './PanelsPage.scss';

/** Class applied to the placeholder paragraphs so they read as muted filler behind the real intro. */
const fillerCls = 'tb-panels-panel__filler';

export const panelsPage = hoistCmp.factory({
    model: creates(() => PanelsPageModel),

    render({model}) {
        const {mask, loadingIndicator} = model;
        return exampleScreen({
            title: 'Panel',
            icon: Icon.window(),
            description: [
                '`Panel` is a core building block for layouts in Hoist. It supports an optional header',
                'bar with an icon, title, and custom header items, props for top and bottom toolbars,',
                'and built-in `mask` / `loadingIndicator` overlays.',
                '',
                'This panel also sets `scrollable: true`, so its body scrolls within the fixed header',
                'and toolbars once the content overflows - scroll it to see the behavior. Toggle the',
                'options to explore each feature.'
            ],
            options: [
                exampleOption({
                    label: 'Mask',
                    control: switchInput({model, bind: 'mask'}),
                    info: 'Blocking overlay over the panel content.'
                }),
                exampleOption({
                    label: 'Loading indicator',
                    control: switchInput({model, bind: 'loadingIndicator'}),
                    info: 'Non-blocking spinner in the corner.'
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/panels/PanelsPage.ts', notes: 'This example.'},
                {url: '$HR/mobile/cmp/panel/Panel.ts', text: 'Panel source'}
            ],
            item: panel({
                scrollable: true,
                title: 'Hoist Panel',
                icon: Icon.window(),
                className: 'tb-panels-panel',
                mask,
                loadingIndicator,
                headerItems: [relativeTimestamp({timestamp: Date.now(), prefix: 'Rendered'})],
                tbar: toolbar(
                    button({icon: Icon.add(), text: 'New'}),
                    toolbarSep(),
                    button({icon: Icon.edit(), text: 'Edit', minimal: true})
                ),
                bbar: toolbar(
                    filler(),
                    button({icon: Icon.questionCircle(), text: 'Another Button', minimal: true})
                ),
                items: [
                    p(
                        'This is a Panel with a header (including a title, icon, and headerItem) as well as top and bottom toolbars. It is set to `scrollable`, so this body scrolls while the header and toolbars stay fixed.'
                    ),
                    p({
                        className: fillerCls,
                        item: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse at urna rutrum, condimentum mi semper, faucibus nisi. In eleifend vel ante ut imperdiet. In a interdum dolor. Sed tincidunt enim erat, at sodales neque faucibus nec. Maecenas pretium pulvinar placerat. Ut nec semper libero, a tincidunt tortor. Etiam non urna vitae tellus imperdiet scelerisque. Donec eu placerat magna, sed auctor diam. Duis mi nisi, interdum nec velit in, sollicitudin luctus tellus.'
                    }),
                    p({
                        className: fillerCls,
                        item: 'Maecenas ligula elit, consectetur a ultricies at, egestas a magna. Donec dictum tristique nunc, nec pellentesque diam accumsan quis. Quisque ornare elit non viverra fermentum. Sed interdum viverra nisi, eget pellentesque lorem molestie ut. Phasellus purus lorem, placerat posuere dui vitae, condimentum luctus libero. Donec a dignissim augue. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.'
                    }),
                    p({
                        className: fillerCls,
                        item: 'Suspendisse eget ultricies dolor, sit amet faucibus mauris. Donec volutpat malesuada ligula sed auctor. Morbi at libero vestibulum nulla imperdiet imperdiet at sed orci. Pellentesque porta mi ac est rutrum aliquet. Etiam vulputate porttitor eros, at mattis est blandit ac. Aliquam ligula ante, maximus sit amet est sed, congue gravida eros. Donec aliquam diam ac lorem cursus elementum sed vel tortor.'
                    }),
                    p({
                        className: fillerCls,
                        item: 'Cras lobortis, ipsum ut pulvinar condimentum, massa magna ullamcorper dolor, a gravida quam massa ac libero. Integer orci sapien, egestas laoreet dui nec, scelerisque viverra nisi. Aliquam tincidunt lectus eu lectus mollis, ut placerat nisl tincidunt. Quisque congue quam massa, nec tempus odio lacinia ut.'
                    })
                ]
            })
        });
    }
});

class PanelsPageModel extends HoistModel {
    @bindable accessor mask: boolean = false;
    @bindable accessor loadingIndicator: boolean = false;
}
