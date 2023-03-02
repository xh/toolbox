import {code, p, vframe} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import React from 'react';
import {wrapper} from '../../common';

export const inspectorPanel = hoistCmp.factory({
    render() {
        const {active} = XH.inspectorService;
        return wrapper({
            description: [
                <p style={{marginBottom: 0}}>
                    Hoist Inspector is a developer-centric tool built directly into the Hoist UI. It
                    provides a listing of all active <code>HoistModel</code> and{' '}
                    <code>HoistService</code> instances running within the current application.
                </p>,
                <ul>
                    <li>
                        Enumerable properties + getters for the selected instance load within the
                        docked detail grid.
                    </li>
                    <li>
                        Getters can be evaluated by clicking <code>(...)</code> to display their
                        value.
                    </li>
                    <li>
                        All observable properties (including getters) reactively update when their
                        value changes.
                    </li>
                    <li>Click {Icon.star()} to pin a property to the top of your list.</li>
                    <li>Click {Icon.terminal()} to log an instance or property to the console.</li>
                </ul>
            ],
            links: [
                {url: '$HR/svc/InspectorService.ts'},
                {url: '$HR/inspector', notes: 'Inspector component package'}
            ],
            item: panel({
                title: 'Hoist Inspector',
                icon: Icon.search(),
                width: 700,
                height: 250,
                style: {textAlign: 'center'},
                items: [
                    vframe({
                        items: [
                            p(
                                'Inspector can be activated via the little ',
                                Icon.search(),
                                ' icon in the version bar footer, or by running ',
                                code('XH.inspectorService.activate()'),
                                ' on the dev tools console.'
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
