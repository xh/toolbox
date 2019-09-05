import {cloneElement} from 'react';
import {hoistElemFactory, useModel} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {tbody, table, tr, td} from '@xh/hoist/cmp/layout';
import './Styles.scss';

export const resultsPanel = hoistElemFactory(
    ({tryItInput}) => {
        const model = useModel(),
            tryItElem = cloneElement(tryItInput, {bind: 'tryItData'});

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
                        td(tryItElem),
                        td(model.tryItResult)
                    )
                )
            )
        });
    }
);

