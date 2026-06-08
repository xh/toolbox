import {SplitTreeMapModel, TreeMapModel} from '@xh/hoist/cmp/treemap';
import {select} from '@xh/hoist/desktop/cmp/input';
import {ReactElement} from 'react';
import {wrapperOption} from '../Wrapper';

/**
 * The standard TreeMap appearance options (heat, color mode, theme, tiling algorithm) as a set of
 * `wrapperOption` rows for a Wrapper `options` section. Shared across the TreeMap examples, which
 * otherwise duplicate these identical selects. Bind directly to the supplied model - either a
 * `TreeMapModel` or a `SplitTreeMapModel`, both of which expose these appearance properties.
 */
export function treeMapDisplayOptions(model: TreeMapModel | SplitTreeMapModel): ReactElement[] {
    return [
        wrapperOption({
            label: 'Max Heat',
            propName: 'TreeMapConfig.maxHeat',
            control: select({
                model,
                bind: 'maxHeat',
                width: 130,
                enableFilter: false,
                options: [
                    {label: 'None (auto)', value: undefined},
                    {label: '0.5', value: 0.5},
                    {label: '1', value: 1},
                    {label: '2', value: 2}
                ]
            }),
            info: 'Clamps the hottest-color value.'
        }),
        wrapperOption({
            label: 'Color Mode',
            propName: 'TreeMapConfig.colorMode',
            control: select({
                model,
                bind: 'colorMode',
                width: 130,
                enableFilter: false,
                options: [
                    {label: 'Linear', value: 'linear'},
                    {label: 'Wash', value: 'wash'},
                    {label: 'None', value: 'none'}
                ]
            })
        }),
        wrapperOption({
            label: 'Theme',
            propName: 'TreeMapConfig.theme',
            control: select({
                model,
                bind: 'theme',
                width: 130,
                enableFilter: false,
                options: [
                    {label: 'Default', value: undefined},
                    {label: 'Light', value: 'light'},
                    {label: 'Dark', value: 'dark'}
                ]
            })
        }),
        wrapperOption({
            label: 'Algorithm',
            propName: 'TreeMapConfig.algorithm',
            control: select({
                model,
                bind: 'algorithm',
                width: 130,
                enableFilter: false,
                options: [
                    {label: 'Squarified', value: 'squarified'},
                    {label: 'Slice and Dice', value: 'sliceAndDice'},
                    {label: 'Stripes', value: 'stripes'},
                    {label: 'Strip', value: 'strip'}
                ]
            })
        })
    ];
}
