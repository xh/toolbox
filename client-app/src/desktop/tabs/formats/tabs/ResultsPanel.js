import React, {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {thead, tbody, table, tr, td, th} from '@xh/hoist/cmp/layout';
import {formGroup} from '@xh/hoist/kit/blueprint';
import './Styles.scss';

@HoistComponent
export class ResultsPanel extends Component {

    render() {
        const {model, props} = this,
            tryItInput = React.cloneElement(props.tryItInput, {model, bind: 'tryItData'});

        return panel({
            className: 'toolbox-formats-tab__panel',
            title: 'Result',
            flex: 1,
            item: table(
                thead(
                    tr(th('Input'), th('Output'))
                ),
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
                        td(
                            formGroup({
                                label: 'Try it:',
                                inline: true,
                                width: '90%',
                                item: tryItInput
                            })
                        ),
                        td(model.tryItResult)
                    )
                )
            )
        });
    }
}
export const resultsPanel = elemFactory(ResultsPanel);

