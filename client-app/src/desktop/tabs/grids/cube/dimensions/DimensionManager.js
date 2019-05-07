import {Component} from 'react';
import {grid} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {elemFactory, HoistComponent} from '@xh/hoist/core';
import {LayoutSupport} from '@xh/hoist/core/mixins';
import {dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {panel, PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon/Icon';


/**
 * An example of a more stateful control for selecting and managing a set of dimensions.
 * Uses an embedded DimensionChooser to allow the user to select any available dimension
 * combo, but provides a grid with config-driven defaults and saves new user selections to a pref.
 *
 * This component and its backing model are incubating in Toolbox for possible inclusion in
 * the core Hoist toolkit in some form.
 */
@HoistComponent
@LayoutSupport
export class DimensionManager extends Component {

    baseClassName = 'xh-dim-manager';

    render() {
        const {model, agOptions} = this,
            {model: ignored, ...rest} = this.props;

        const title = this.panelModel.collapsed ? model.formattedDimensions : 'Dimensions';

        return panel({
            item: grid({
                model: model.gridModel,
                hideHeaders: true,
                agOptions
            }),
            bbar: this.renderToolbar(),
            className: this.getClassName(),
            model: this.panelModel,
            title,
            ...rest
        });
    }

    panelModel = new PanelModel({
        collapsible: true,
        side: 'left',
        defaultSize: 250
    });

    agOptions = {
        groupRowRendererParams: {suppressCount: true}
    };

    renderToolbar() {
        const {model} = this;

        return toolbar(
            filler(),
            dimensionChooser({
                model: model.dimChooserModel,
                buttonText: 'Custom...',
                buttonTitle: 'Select a new custom grouping',
                buttonIcon: Icon.add(),
                styleButtonAsInput: false,
                buttonWidth: 100
            })
        );
    }
}

export const dimensionManager = elemFactory(DimensionManager);

