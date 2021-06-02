import {form, FormModel} from '@xh/hoist/cmp/form';
import {tileFrame} from '@xh/hoist/cmp/layout';
import {div, hframe} from '@xh/hoist/cmp/layout/index';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {numberInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import React from 'react';
import {wrapper} from '../../common';
import './TileFrameContainerPanel.scss';

export const tileFrameContainerPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model}) {
        const vals = model.formModel.values,
            tiles = [];

        for (let i = 0; i < vals.tileCount; i++) {
            tiles.push(panel({
                className: 'tb-tileframe__tile',
                item: 'I am a tile!'
            }));
        }

        const inputConf = {commitOnChange: true, width: 60, min: 0};
        return wrapper({
            description: [
                <p>
                    The <code>TileFrame</code> component renders its children as equally-sized
                    tiles, resized and arranged to fill the available space within the container
                    while maintaining even padding between tiles and keeping tile width / height as
                    close to a specified ratio as possible.
                </p>,
                <p>
                    Try resizing your browser window to see the tiling in action. The outer panel in
                    this example is sized relative to the viewport - as its size changes, the tiles
                    will be re-arranged to make the best use of the space available.
                </p>
            ],
            links: [
                {url: '$TB/client-app/src/desktop/tabs/containers/TileFrameContainerPanel.js', notes: 'This example.'},
                {url: '$HR/cmp/layout/TileFrame.js', notes: 'TileFrame component.'}
            ],
            item: panel({
                title: 'Containers › TileFrame',
                className: 'tb-tileframe',
                icon: Icon.gridLarge(),
                item: hframe(
                    tileFrame({
                        desiredRatio: vals.desiredRatio,
                        minTileRatio: vals.minTileRatio,
                        maxTileRatio: vals.maxTileRatio,
                        spacing: vals.spacing,
                        minTileWidth: vals.minTileWidth,
                        maxTileWidth: vals.maxTileWidth,
                        minTileHeight: vals.minTileHeight,
                        maxTileHeight: vals.maxTileHeight,
                        items: tiles
                    }),
                    panel({
                        width: 200,
                        className: 'xh-border-left',
                        item: form({
                            fieldDefaults: {inline: true, labelWidth: 110},
                            item: div({
                                className: 'tb-tileframe__props-form',
                                items: [
                                    formField({
                                        field: 'tileCount',
                                        item: numberInput({...inputConf})
                                    }),
                                    formField({
                                        field: 'desiredRatio',
                                        item: numberInput({...inputConf, stepSize: 0.5})
                                    }),
                                    formField({
                                        field: 'minTileRatio',
                                        item: numberInput({...inputConf, stepSize: 0.5})
                                    }),
                                    formField({
                                        field: 'maxTileRatio',
                                        item: numberInput({...inputConf, stepSize: 0.5})
                                    }),
                                    formField({
                                        field: 'spacing',
                                        item: numberInput({...inputConf, valueLabel: 'px'})
                                    }),
                                    formField({
                                        field: 'minTileWidth',
                                        item: numberInput({...inputConf, stepSize: 10, valueLabel: 'px'})
                                    }),
                                    formField({
                                        field: 'maxTileWidth',
                                        item: numberInput({...inputConf, stepSize: 10, valueLabel: 'px'})
                                    }),
                                    formField({
                                        field: 'minTileHeight',
                                        item: numberInput({...inputConf, stepSize: 10, valueLabel: 'px'})
                                    }),
                                    formField({
                                        field: 'maxTileHeight',
                                        item: numberInput({...inputConf, stepSize: 10, valueLabel: 'px'})
                                    }),
                                    button({
                                        text: 'Reset',
                                        icon: Icon.reset(),
                                        outlined: true,
                                        onClick: () => model.formModel.reset()
                                    })
                                ]
                            })
                        })
                    })
                )
            })
        });
    }
});


class Model extends HoistModel {

    @managed
    formModel = new FormModel({
        fields: [
            {name: 'tileCount', label: 'Tiles', initialValue: 5},
            {name: 'desiredRatio', label: 'desiredRatio', initialValue: 1},
            {name: 'minTileRatio', label: 'minTileRatio', initialValue: 0.5},
            {name: 'maxTileRatio', label: 'maxTileRatio', initialValue: 4},
            {name: 'spacing', label: 'spacing', initialValue: 10},
            {name: 'minTileWidth', label: 'minTileWidth'},
            {name: 'maxTileWidth', label: 'maxTileWidth'},
            {name: 'minTileHeight', label: 'minTileHeight'},
            {name: 'maxTileHeight', label: 'maxTileHeight'}
        ]
    })

    constructor() {
        super();
    }

}
