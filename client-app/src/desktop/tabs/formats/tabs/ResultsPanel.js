import React, {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {tbody, table, tr, td} from '@xh/hoist/cmp/layout';
import './Styles.scss';

@HoistComponent
export class ResultsPanel extends Component {

    render() {
        const {model, props} = this,
            tryItInput = React.cloneElement(props.tryItInput, {model, bind: 'tryItData'});

        return panel({
            title: 'Input › Output',
            compactHeader: true,
            width: 400,
            className: 'tbox-formats-tab__panel',
            item: table(
                tbody(
                    ...model.testResults.map(({formattedData, result}) => {
                        return tr({
                            items: [
                                td({className: 'inputColumn', item: formattedData}),
                                td({className: 'outputColumn', item: result})
                            ]
                        });
                    }),
                    tr(
                        td(tryItInput),
                        td(model.tryItResult)
                    )
                )
            )
        });
    }
}
export const resultsPanel = elemFactory(ResultsPanel);

