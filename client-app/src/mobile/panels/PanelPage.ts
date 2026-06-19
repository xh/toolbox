import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/Icon';
import {button} from '@xh/hoist/mobile/cmp/button';
import {switchInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {filler} from '@xh/hoist/cmp/layout';
import {toolbar, toolbarSep} from '@xh/hoist/mobile/cmp/toolbar';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import './PanelsPage.scss';

export const panelPage = hoistCmp.factory({
    model: creates(() => PanelPageModel),

    render({model}) {
        const {showHeader, mask, loadingIndicator} = model;
        return exampleScreen({
            title: 'Panels',
            icon: Icon.window(),
            description: [
                '`Panel` is a core building block for layouts in Hoist. It supports an optional header',
                'bar with an icon, title, and custom header items, props for top and bottom toolbars,',
                'and built-in `mask` / `loadingIndicator` overlays.',
                '',
                'Toggle the options here to see each feature; the Scrollable tab covers built-in',
                'handling of overflowing content.'
            ],
            options: [
                exampleOption({
                    label: 'Show header',
                    control: switchInput({model, bind: 'showHeader'})
                }),
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
                {url: '$TB/client-app/src/mobile/panels/PanelPage.ts', notes: 'This example.'},
                {url: '$HR/mobile/cmp/panel/Panel.ts', text: 'Panel source'}
            ],
            item: panel({
                title: showHeader ? 'Hoist Panel' : null,
                icon: showHeader ? Icon.window() : null,
                className: 'tb-panels-standard-panel',
                mask,
                loadingIndicator,
                headerItems: showHeader
                    ? [relativeTimestamp({timestamp: Date.now(), prefix: 'Rendered'})]
                    : [],
                items: [
                    'This is a Panel with a header (including a title, icon, and headerItem) as well as top and bottom toolbars.'
                ],
                tbar: toolbar(
                    button({
                        icon: Icon.add(),
                        text: 'New'
                    }),
                    toolbarSep(),
                    button({
                        icon: Icon.edit(),
                        text: 'Edit',
                        minimal: true
                    })
                ),
                bbar: toolbar(
                    filler(),
                    button({
                        icon: Icon.questionCircle(),
                        text: 'Another Button',
                        minimal: true
                    })
                )
            })
        });
    }
});

class PanelPageModel extends HoistModel {
    @bindable showHeader: boolean = true;
    @bindable mask: boolean = false;
    @bindable loadingIndicator: boolean = false;

    constructor() {
        super();
        makeObservable(this);
    }
}
