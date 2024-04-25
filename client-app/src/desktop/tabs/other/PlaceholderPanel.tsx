import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {filler, frame, hframe, p, placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import React from 'react';
import {wrapper} from '../../common';

export const placeholderPanel = hoistCmp.factory({
    displayName: 'PlaceholderPanel',
    model: creates(() => PlaceholderPanelModel),

    render({model}) {
        const {selectedRecord} = model.gridModel;
        return wrapper({
            description: [
                <p>
                    The <code>Placeholder</code> component is useful to occupy a portion of an
                    application's layout when the primary content is not yet ready to show - e.g.
                    for a master-detail view where the detail is blank until a record is selected.
                </p>,
                <p>
                    Placeholders center their contents and are styled with a muted text color. If
                    the first child of a placeholder is an <code>Icon</code> element, it will be
                    automatically styled as below.
                </p>
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/PlaceholderPanel.tsx',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/layout/Placeholder.ts', notes: 'Hoist component.'}
            ],
            item: panel({
                title: 'Other › Placeholder',
                icon: Icon.stop(),
                width: 700,
                height: '50%',
                mask: 'onLoad',
                item: hframe(
                    panel({
                        maxWidth: 300,
                        minWidth: 300,
                        item: grid()
                    }),
                    selectedRecord
                        ? detailPanel()
                        : placeholder({
                              items: [
                                  Icon.detail(),
                                  p('Select a record to view details.'),
                                  p('(This is a placeholder)')
                              ]
                          })
                )
            })
        });
    }
});

const detailPanel = hoistCmp.factory<PlaceholderPanelModel>(({model}) => {
    const {gridModel} = model,
        {selectedRecord} = gridModel;

    return panel({
        item: frame({
            className: 'xh-pad',
            item: `Details about ${selectedRecord.data.company}...`
        }),
        bbar: [
            filler(),
            button({
                text: 'Clear Selection',
                outlined: true,
                onClick: () => model.gridModel.clearSelection()
            })
        ]
    });
});

class PlaceholderPanelModel extends HoistModel {
    gridModel = new GridModel({
        columns: [{field: 'company', flex: 1}]
    });

    override async doLoadAsync(loadSpec) {
        const {trades} = await XH.fetchJson({url: 'trade'});
        this.gridModel.loadData(trades);
    }
}
