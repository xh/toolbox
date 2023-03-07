import React from 'react';
import {creates, hoistCmp} from '@xh/hoist/core';
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
    return (
        <div>
            <p>{startCase(title)}</p>
            <table>
                <tbody>
                    <tr>
                        <th>Title</th>
                        <th>Input</th>
                        <th>Expected</th>
                        <th>Output</th>
                        <th>Result</th>
                        <th>Notes</th>
                    </tr>
                    {tests.map(test => renderTestResult(test))}
                </tbody>
            </table>
        </div>
    );
}

function renderTestResult(test) {
    const {title, input, expected, output, result, notes} = test;

    return (
        <tr key={title}>
            <td>{title}</td>
            <td>{input}</td>
            <td>{expected}</td>
            <td>{output}</td>
            <td style={{textAlign: 'center'}}>
                {result ? Icon.check({className: 'xh-green'}) : Icon.cross({className: 'xh-red'})}
            </td>
            <td>{notes}</td>
        </tr>
    );
}
