import {DateRangePickerModel} from '@xh/hoist/cmp/daterange';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {dateRangePicker} from '@xh/hoist/desktop/cmp/daterange';
import {fileChooser, FileChooserModel} from '@xh/hoist/desktop/cmp/filechooser';
import {leftRightChooser, LeftRightChooserModel} from '@xh/hoist/desktop/cmp/leftrightchooser';
import {Icon} from '@xh/hoist/icon';
import {ReactElement} from 'react';
import {demoGallery, demoGalleryTile, demoPanel, wrapper} from '../../../common';
import {OTHER_CONTROLS} from './InputCatalog';

/** Enough items to show both sides of the chooser populated in a tile-sized instance. */
const CHOOSER_DATA = [
    {text: 'Apple', group: 'Tree', value: 'apple'},
    {text: 'Cherry', group: 'Tree', value: 'cherry'},
    {text: 'Banana', group: 'Tropical', value: 'banana', side: 'right' as const},
    {text: 'Mango', group: 'Tropical', value: 'mango', side: 'right' as const}
];

export const otherControlsPanel = hoistCmp.factory({
    displayName: 'OtherControlsPanel',
    model: creates(() => OtherControlsModel),

    render({model}) {
        return wrapper({
            title: 'Other Controls',
            icon: Icon.grip(),
            description: [
                'Controls on this tab are *not* `HoistInput`s. Each takes its own model rather',
                'than a `bind`, so none can sit inside a `FormField` or take part in a',
                "`FormModel`'s validation and commit handling.",
                '',
                'That said, they are collected here as they commonly participate in forms',
                'alongside the core inputs and can be used to collect a rich variety of data',
                'from users.',
                '',
                'Each tile opens a dedicated page.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/OtherControlsPanel.ts',
                    notes: 'This example.'
                }
            ],
            item: demoPanel({
                item: demoGallery({
                    // Each instance is too wide to read side by side, so a row apiece.
                    columns: 1,
                    items: OTHER_CONTROLS.map(entry =>
                        demoGalleryTile({
                            key: entry.name,
                            title: entry.name,
                            description: entry.description,
                            onClick: () => XH.navigate(entry.route),
                            item: TILE_CONTROLS[entry.name](model)
                        })
                    )
                })
            })
        });
    }
});

/**
 * One live instance per catalog entry, bound to this page's models. The gallery does not size its
 * tiles, so each instance's own height decides how tall its tile is - hence the explicit heights
 * on the two that would otherwise render cramped. DateRangePicker is a single trigger and takes
 * its natural height.
 */
const TILE_CONTROLS: Record<string, (m: OtherControlsModel) => ReactElement> = {
    DateRangePicker: m => dateRangePicker({model: m.dateRangeModel, flex: 1}),
    LeftRightChooser: m =>
        leftRightChooser({
            model: m.chooserModel,
            className: 'xh-border',
            height: 200,
            width: '100%'
        }),
    FileChooser: m =>
        fileChooser({
            model: m.fileChooserModel,
            dropTargetPlacement: 'hidden',
            className: 'xh-border xh-bg',
            height: 175,
            width: '100%'
        })
};

class OtherControlsModel extends HoistModel {
    @managed dateRangeModel = new DateRangePickerModel({});
    @managed chooserModel = new LeftRightChooserModel({data: CHOOSER_DATA});
    @managed fileChooserModel = new FileChooserModel({maxFiles: 3});
}
