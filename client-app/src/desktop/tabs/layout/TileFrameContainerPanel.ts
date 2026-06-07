import {tileFrame} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {numberInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon, xhLogo} from '@xh/hoist/icon';
import {action, bindable, makeObservable} from '@xh/hoist/mobx';
import {wrapper, wrapperAction, wrapperOption} from '../../common';
import './TileFrameContainerPanel.scss';

export const tileFrameContainerPanel = hoistCmp.factory({
    model: creates(() => TileFrameContainerPanelModel),

    render({model}) {
        const tiles = [];
        for (let i = 0; i < model.tileCount; i++) {
            tiles.push(
                panel({
                    className: 'tb-tileframe__tile',
                    contentBoxProps: {
                        alignItems: 'center',
                        justifyContent: 'center',
                        style: {backgroundColor: 'var(--xh-intent-primary-trans1)'}
                    },
                    item: xhLogo({maxWidth: '60%', maxHeight: '80%'})
                })
            );
        }

        const numConf = {model, commitOnChange: true, width: 90, min: 0};
        return wrapper({
            title: 'TileFrame',
            icon: Icon.gridLarge(),
            description: [
                '`TileFrame` renders its children as equally-sized tiles, resized and arranged',
                'to fill the available space within the container while maintaining even',
                'padding between tiles and keeping tile width / height as close to a specified',
                'ratio as possible.',
                '',
                'Try resizing your browser window to see the tiling in action. The outer panel',
                'in this example is sized relative to the viewport - as its size changes, the',
                'tiles will be re-arranged to make the best use of the space available.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/layout/TileFrameContainerPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/layout/README.md',
                    text: 'Layout docs',
                    notes: 'Layout containers guide.'
                },
                {url: '$HR/cmp/layout/TileFrame.ts', notes: 'TileFrame component.'}
            ],
            options: [
                wrapperOption({
                    label: 'Tiles',
                    control: numberInput({...numConf, bind: 'tileCount'})
                }),
                wrapperOption({
                    label: 'Ratio',
                    control: numberInput({...numConf, bind: 'desiredRatio', stepSize: 0.5})
                }),
                wrapperOption({
                    label: 'Spacing',
                    control: numberInput({...numConf, bind: 'spacing'})
                }),
                wrapperOption({
                    label: 'Min Width',
                    control: numberInput({
                        ...numConf,
                        bind: 'minTileWidth',
                        stepSize: 10
                    })
                }),
                wrapperOption({
                    label: 'Max Width',
                    control: numberInput({
                        ...numConf,
                        bind: 'maxTileWidth',
                        stepSize: 10
                    })
                }),
                wrapperOption({
                    label: 'Min Height',
                    control: numberInput({
                        ...numConf,
                        bind: 'minTileHeight',
                        stepSize: 10
                    })
                }),
                wrapperOption({
                    label: 'Max Height',
                    control: numberInput({
                        ...numConf,
                        bind: 'maxTileHeight',
                        stepSize: 10
                    })
                }),
                wrapperAction({
                    text: 'Reset',
                    icon: Icon.reset(),
                    intent: 'danger',
                    onClick: () => model.reset()
                })
            ],
            item: panel({
                className: 'tb-tileframe',
                height: '60vh',
                width: '90%',
                item: tileFrame({
                    desiredRatio: model.desiredRatio,
                    spacing: model.spacing,
                    minTileWidth: model.minTileWidth,
                    maxTileWidth: model.maxTileWidth,
                    minTileHeight: model.minTileHeight,
                    maxTileHeight: model.maxTileHeight,
                    items: tiles
                })
            })
        });
    }
});

class TileFrameContainerPanelModel extends HoistModel {
    @bindable tileCount = 5;
    @bindable desiredRatio = 1;
    @bindable spacing = 10;
    @bindable minTileWidth: number = null;
    @bindable maxTileWidth: number = null;
    @bindable minTileHeight: number = null;
    @bindable maxTileHeight: number = null;

    constructor() {
        super();
        makeObservable(this);
    }

    @action
    reset() {
        this.tileCount = 5;
        this.desiredRatio = 1;
        this.spacing = 10;
        this.minTileWidth = null;
        this.maxTileWidth = null;
        this.minTileHeight = null;
        this.maxTileHeight = null;
    }
}
