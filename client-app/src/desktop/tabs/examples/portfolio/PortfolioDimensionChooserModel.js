import {HoistModel} from '@xh/hoist/core';
import {DimensionChooserModel} from '@xh/hoist/desktop/cmp/dimensionchooser/DimensionChooserModel';

@HoistModel
export class PortfolioDimensionChooserModel {

    model = new DimensionChooserModel({
        dimensions: [
            {value: 'model', label: 'Model'},
            {value: 'strategy', label: 'Strategy'},
            {value: 'symbol', label: 'Symbol'},
            {value: 'fund', label: 'Fund'},
            {value: 'region', label: 'Region'}
        ],
        historyPreference: 'portfolioDimHistory'
    });
}