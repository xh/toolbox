import {p, vframe} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common';

export const inspectorPanel = hoistCmp.factory({
    render() {
        const {active} = XH.inspectorService;
        return wrapper({
            title: 'Inspector',
            icon: Icon.search(),
            description: [
                'Hoist Inspector is a developer tool built directly into the Hoist UI. It',
                'lists every active `HoistModel` and `HoistService` instance in the running',
                'application and lets you browse their observable state live, with no extra',
                'setup:',
                '',
                '- Enumerable properties + getters for the selected instance load within the',
                '  docked detail grid.',
                '- Getters can be evaluated by clicking (...) to display their value.',
                '- All observable properties (including getters) reactively update when their',
                '  value changes.',
                '- Click the star icon to pin a property to the top of your list.',
                '- Click the terminal icon to log an instance or property to the console.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/InspectorPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/inspector/README.md',
                    text: 'Inspector docs',
                    notes: 'Inspector guide.'
                },
                {
                    url: '$HR/svc/InspectorService.ts',
                    notes: 'Service that activates and powers the Inspector.'
                },
                {
                    url: '$HR/inspector',
                    text: 'Inspector package',
                    notes: 'Inspector UI components.'
                }
            ],
            item: panel({
                width: 700,
                height: 250,
                style: {textAlign: 'center'},
                items: [
                    vframe({
                        items: [
                            p(
                                'Inspector can be activated via the little ',
                                Icon.search(),
                                ' icon in the version bar footer, or by running XH.inspectorService.activate() on the dev tools console.'
                            ),
                            p(
                                'To make it easy for you here in Toolbox, we have provided this giant button:'
                            ),
                            button({
                                text: `${active ? 'Deactivate' : 'Activate'} Inspector`,
                                intent: active ? 'warning' : 'success',
                                icon: Icon.search({size: 'lg'}),
                                height: 100,
                                width: 200,
                                marginTop: 10,
                                minimal: false,
                                onClick: () => XH.inspectorService.toggleActive()
                            })
                        ],
                        alignItems: 'center',
                        justifyContent: 'center'
                    })
                ]
            })
        });
    }
});
