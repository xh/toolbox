import {p, placeholder} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {DashViewModel} from '@xh/hoist/desktop/cmp/dash';
import type {DashViewSpec} from '@xh/hoist/desktop/cmp/dash';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {camelCase} from 'lodash';
import type {ReactElement} from 'react';

/** Placeholder content for the sample views below - shows the group each view sits in. */
export const sampleWidget = hoistCmp.factory<DashViewModel>({
    model: uses(DashViewModel),
    render({model}) {
        const {icon, groupName} = model.viewSpec;
        return panel(placeholder(icon, p(model.title), p(`groupName: '${groupName}'`)));
    }
});

/**
 * Sample view specs in nested groups, to demo a slash-delimited `groupName` in the add view menus
 * and the widget chooser. Some groups hold views alongside nested groups, and some groups share
 * one icon across all their views while others mix icons.
 */
export function sampleViewSpecs(): DashViewSpec[] {
    return SAMPLE_GROUPS.flatMap(([groupName, icon, titles]) =>
        titles.map(title => ({
            id: camelCase(`${groupName} ${title}`),
            title,
            icon,
            groupName,
            content: sampleWidget
        }))
    );
}

const SAMPLE_GROUPS: [groupName: string, icon: ReactElement, titles: string[]][] = [
    ['Markets', Icon.chartLine(), ['Markets Overview']],
    ['Markets/Equities', Icon.chartLine(), ['S&P 500', 'FTSE 100', 'Nikkei 225']],
    ['Markets/Rates', Icon.chartArea(), ['Treasury Curve', 'Swap Spreads']],
    ['Markets/Rates', Icon.chartBar(), ['SOFR Futures']],
    ['Markets/FX', Icon.dollarSign(), ['G10 Majors', 'EM Currencies']],
    ['Markets/Commodities', Icon.bolt(), ['Crude Oil', 'Natural Gas']],
    ['Markets/Commodities', Icon.gauge(), ['Gold', 'Copper']],
    ['Risk', Icon.shield(), ['VaR Summary', 'Stress Tests']],
    ['Risk/Limits', Icon.lock(), ['Desk Limits', 'Counterparty Limits']],
    ['Risk/Limits', Icon.warning(), ['Open Breaches']],
    ['Reports/Daily', Icon.fileText(), ['P&L Summary', 'Trade Blotter']],
    ['Reports/Monthly', Icon.calendar(), ['Monthly Summary', 'Regional Summary']]
];
