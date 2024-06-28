import {grid} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistProps, useLocalModel, uses, WithoutModelAndRef} from '@xh/hoist/core';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {panel, PanelModel, PanelProps} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import {DimensionManagerModel} from './DimensionManagerModel';

/**
 * An example of a more stateful control for selecting and managing a set of dimensions.
 * Uses an embedded GroupingChooser to allow the user to select any available dimension
 * combo, but provides a grid with config-driven defaults and saves new user selections to a pref.
 *
 * This component and its backing model are incubating in Toolbox for possible inclusion in
 * the core Hoist toolkit in some form.
 */
export interface DimensionManagerProps
    extends HoistProps<DimensionManagerModel>,
        WithoutModelAndRef<PanelProps> {}

export const dimensionManager = hoistCmp.factory<DimensionManagerProps>({
    displayName: 'DimensionManager',
    model: uses(DimensionManagerModel),
    className: 'xh-dim-manager',

    render({model, className, ...rest}) {
        const panelModel = useLocalModel(
            () =>
                new PanelModel({
                    collapsible: true,
                    side: 'left',
                    defaultSize: 250
                })
        );

        const title = panelModel.collapsed ? model.formattedDimensions : 'Dimensions';

        return panel({
            item: grid({
                agOptions: {groupRowRendererParams: {suppressCount: true}}
            }),
            bbar: [
                filler(),
                groupingChooser({
                    icon: Icon.add(),
                    text: 'New Grouping...'
                }),
                filler()
            ],
            className,
            model: panelModel,
            title,
            ...rest
        });
    }
});
