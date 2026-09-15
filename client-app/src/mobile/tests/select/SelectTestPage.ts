import {div, hbox, label, p, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/mobile/cmp/button';
import {numberInput, select} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {isEmpty} from 'lodash';
import {SelectTestPageModel} from './SelectTestPageModel';

/**
 * Mobile async `Select` merge perf tester - see {@link SelectTestPageModel} for the bug it covers.
 * Type one character for a large result, then a second for a 2-option result; both keystrokes
 * blocked the main thread for seconds before hoist-react #4589.
 */
export const selectTestPage = hoistCmp.factory({
    displayName: 'SelectTestPage',
    model: creates(SelectTestPageModel),

    render({model}) {
        return panel({
            scrollable: true,
            item: vbox({
                className: 'xh-pad',
                items: [
                    p(
                        'Type one character for a large result, then a second for a 2-option result.'
                    ),
                    label('Options returned for a one-character query'),
                    numberInput({bind: 'numOptions', width: '100%'}),
                    label('Server latency (ms)'),
                    numberInput({bind: 'latency', width: '100%'}),
                    select({
                        bind: 'value',
                        queryFn: query => model.queryOptionsAsync(query),
                        enableCreate: true,
                        enableFilter: true,
                        enableFullscreen: true,
                        width: '100%',
                        placeholder: 'Type one char, then a second...'
                    }),
                    div({
                        className: 'xh-text-color-muted xh-font-size-small',
                        item: 'value: ' + JSON.stringify(model.value)
                    }),
                    blockTimes()
                ]
            })
        });
    }
});

// Ms the main thread was blocked after each recent query resolved - the merge cost.
const blockTimes = hoistCmp.factory<SelectTestPageModel>(({model}) =>
    hbox({
        alignItems: 'center',
        items: [
            label(
                isEmpty(model.blockTimes)
                    ? 'blocked: --'
                    : 'blocked: ' + model.blockTimes.map(it => `${it}ms`).join(', ')
            ),
            button({
                text: 'Clear',
                minimal: true,
                omit: isEmpty(model.blockTimes),
                onClick: () => model.clearBlockTimes()
            })
        ]
    })
);
