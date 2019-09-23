import {grid} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {hoistCmp, useLocalModel, uses} from '@xh/hoist/core';
import {dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {panel, PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon/Icon';
import {DimensionManagerModel} from './DimensionManagerModel';

/**
 * An example of a more stateful control for selecting and managing a set of dimensions.
 * Uses an embedded DimensionChooser to allow the user to select any available dimension
 * combo, but provides a grid with config-driven defaults and saves new user selections to a pref.
 *
 * This component and its backing model are incubating in Toolbox for possible inclusion in
 * the core Hoist toolkit in some form.
 */
export const [DimensionManager, dimensionManager] = hoistCmp.withFactory({
    displayName: 'DimensionManager',
    model: uses(DimensionManagerModel),
    className: 'xh-dim-manager',

    render({model, className, ...rest}) {

        const panelModel = useLocalModel(
            () => new PanelModel({
                collapsible: true,
                side: 'left',
                defaultSize: 250
            })
        );

        const title = panelModel.collapsed ? model.formattedDimensions : 'Dimensions';

        return panel({
            item: grid({
                hideHeaders: true,
                agOptions: {groupRowRendererParams: {suppressCount: true}}
            }),
            bbar: bbar(),
            className,
            model: panelModel,
            title,
            ...rest
        });
    }
});

const bbar = hoistCmp.factory(
    () => toolbar(
        filler(),
        dimensionChooser({
            buttonText: 'Custom...',
            buttonTitle: 'Select a new custom grouping',
            buttonIcon: Icon.add(),
            styleButtonAsInput: false,
            buttonWidth: 100
        })
    )
);

