import {creates, hoistCmp} from '@xh/hoist/core';
import {div, p, table, tbody, td, th, tr} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {forOwn, groupBy, startCase} from 'lodash';
import './LocalDateTestPanel.scss';
import {LocalDateTestModel} from './LocalDateTestModel';

export const LocalDateTestPanel = hoistCmp({
    model: creates(LocalDateTestModel),

    render({model}) {
        const results = groupBy(model.testResults, 'category'),
            items = [];

        forOwn(results, (tests, title) => {
            items.push(renderResultTable(title, tests));
        });

        return panel({
            className: 'local-date-test-panel xh-tiled-bg',
            items
        });
    }
});

function renderResultTable(title, tests) {
    return div(
        p(startCase(title)),
        table(
            tbody(
                tr(
                    th('Title'),
                    th('Input'),
                    th('Expected'),
                    th('Output'),
                    th('Result'),
                    th('Notes')
                ),
                ...tests.map(test => renderTestResult(test))
            )
        )
    );
}

function renderTestResult(test) {
    const {title, input, expected, output, result, notes} = test;

    return tr({
        key: title,
        items: [
            td(title),
            td(input),
            td(expected),
            td(output),
            td({
                style: {textAlign: 'center'},
                item: result
                    ? Icon.check({className: 'xh-green'})
                    : Icon.cross({className: 'xh-red'})
            }),
            td(notes)
        ]
    });
}
