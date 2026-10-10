import {grid} from '@xh/hoist/cmp/grid';
import {div, filler, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {select} from '@xh/hoist/desktop/cmp/input';
import type {PanelBannerSpec} from '@xh/hoist/desktop/cmp/panel';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSeparator} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {PARITY_CASES} from './FormatterParityCases';
import {FormatterParityModel} from './FormatterParityModel';
import './FormatterParityPanel.scss';

const INTRO =
    'Each column pair shows the same values twice: R through a renderer and F through the ' +
    'matching formatter. The pairs cover the built-in number and date column specs and each ' +
    'number formatter option. Run probe autosizes the grid, then compares each cell pair for ' +
    'text, sign class and color, ledger placeholder, alignment and width. The two paths should ' +
    'match, so any difference is a regression in hoist-react. Rerun in both themes and in each ' +
    'sizing mode.';

export const formatterParityPanel = hoistCmp.factory({
    displayName: 'FormatterParityPanel',
    model: creates(FormatterParityModel),

    render({model}) {
        const {gridModel, diffGridModel, result} = model;
        return panel({
            tbar: [
                button({
                    text: 'Run probe',
                    icon: Icon.play(),
                    intent: 'primary',
                    outlined: true,
                    onClick: () => model.runProbeAsync()
                }),
                toolbarSeparator(),
                span('Sizing mode'),
                select({
                    model: gridModel.agGridModel,
                    bind: 'sizingMode',
                    width: 120,
                    enableFilter: false,
                    hideSelectedOptionCheck: true,
                    options: ['tiny', 'compact', 'standard', 'large']
                }),
                filler(),
                span({
                    className: 'xh-text-color-muted',
                    item: `${PARITY_CASES.length} cases x ${gridModel.store.count} rows`
                })
            ],
            banner: resultBanner(model),
            items: [
                div({className: 'xh-pad xh-border-bottom', item: INTRO}),
                grid({model: gridModel, ref: model.gridRef}),
                panel({
                    title: 'Differences',
                    icon: Icon.warning(),
                    compactHeader: true,
                    modelConfig: {side: 'bottom', defaultSize: 220},
                    item: grid({model: diffGridModel}),
                    omit: !result?.failedPairCount
                })
            ]
        });
    }
});

function resultBanner({result}: FormatterParityModel): PanelBannerSpec {
    if (!result) return null;

    const {pairCount, failedPairCount, sizingMode, darkTheme} = result,
        context = `${sizingMode} sizing, ${darkTheme ? 'dark' : 'light'} theme`;
    return failedPairCount
        ? {
              intent: 'danger',
              icon: Icon.warning(),
              message: `Fail: ${failedPairCount} of ${pairCount} cell pairs differ (${context}).`
          }
        : {
              intent: 'success',
              icon: Icon.check(),
              message: `Pass: all ${pairCount} cell pairs match (${context}).`
          };
}
