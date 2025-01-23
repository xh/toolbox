import {cloneElement} from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {table, tbody, td, tr} from '@xh/hoist/cmp/layout';
import './Formats.scss';
import {DateFormatsPanelModel} from './DateFormatsPanelModel';
import {NumberFormatsPanelModel} from './NumberFormatsPanelModel';

export const resultsPanel = hoistCmp.factory<DateFormatsPanelModel | NumberFormatsPanelModel>(
    ({model, tryItInput}) => {
        const tryItElem = cloneElement(tryItInput, {bind: 'tryItData'});

        return panel({
            title: 'Input › Output',
            compactHeader: true,
            width: 450,
            flex: 'none',
            className: 'tbox-formats-tab__panel',
            item: table(
                tbody(
                    ...model.testResults.map(({formattedData, result}) => {
                        return tr(
                            td({className: 'inputColumn', item: formattedData}),
                            td({className: 'outputColumn', item: result})
                        );
                    }),
                    tr(td(tryItElem), td(model.tryItResult))
                )
            )
        });
    }
);
