import {cloneElement} from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {div, table, tbody, td, tr} from '@xh/hoist/cmp/layout';
import './Formats.scss';
import type {DateFormatsPanelModel} from './DateFormatsPanelModel';
import type {NumberFormatsPanelModel} from './NumberFormatsPanelModel';

export const resultsPanel = hoistCmp.factory<DateFormatsPanelModel | NumberFormatsPanelModel>(
    ({model, tryItInput}) => {
        const tryItElem = cloneElement(tryItInput, {bind: 'tryItData'});

        return panel({
            title: 'Input › Output',
            compactHeader: true,
            // Static content - size the card to its two columns (plus the custom-value row),
            // letting the Wrapper demo region center it. A min width keeps the card from
            // jumping around as the formatted output changes width.
            flex: 'none',
            minWidth: 500,
            maxHeight: '100%',
            className: 'tbox-formats-tab__panel',
            children: div({
                className: 'tbox-formats-tab__results',
                children: table(
                    tbody(
                        ...model.testResults.map(({formattedData, result}) => {
                            return tr(
                                td({className: 'inputColumn', children: formattedData}),
                                td({className: 'outputColumn', children: result})
                            );
                        }),
                        tr(td(tryItElem), td(model.tryItResult))
                    )
                )
            })
        });
    }
);
