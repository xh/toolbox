import {card} from '@xh/hoist/cmp/card';
import {div, p, span, vbox} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import type {TabSwitcherConfig} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';
import type {Side} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import type {ReactNode} from 'react';

/**
 * A mock chat stream that scrolls vertically, with tab containers inside three of its responses -
 * a static switcher with `enableOverflow` on top, a dynamic switcher, and a static switcher with
 * `enableOverflow` on the left. Switching tabs scrolls only the switcher's own tab strip, never the
 * stream around it.
 */
export const chatStreamExample = hoistCmp.factory(() =>
    panel({
        className: 'tb-layout-tabs__child',
        scrollable: true,
        tbar: [
            Icon.info(),
            span(
                'Scroll a tab switcher partway down the stream, then switch tabs. ' +
                    'The stream should not move.'
            )
        ],
        item: vbox({
            flex: 'none',
            gap: 10,
            padding: 10,
            items: [
                userMessage('How did each region do last quarter?'),
                response(
                    p('Revenue grew in most regions, led by Asia Pacific and Latin America.'),
                    p(
                        'Europe was flat after a slow September, and the Middle East dipped on ' +
                            'one delayed contract. Margins held steady overall.'
                    ),
                    p('I can break the numbers down region by region if that helps.')
                ),
                userMessage('Yes, please break it down by region.'),
                response(
                    p('Here are the results by region. Switch tabs to see each one.'),
                    regionTabs({mode: 'static'})
                ),
                userMessage('Can I pin the regions I check most often?'),
                response(
                    p(
                        'Yes. This view uses a dynamic switcher - drag tabs to reorder them, or ' +
                            'right-click a tab to remove it.'
                    ),
                    regionTabs({mode: 'dynamic', initialFavorites: REGIONS.map(it => it.id)})
                ),
                userMessage('Could you list the regions down the side instead?'),
                response(
                    p('Sure - here they are in a column. Scroll the list to reach the rest.'),
                    regionTabs({mode: 'static'}, 'left')
                ),
                userMessage('Which region should we watch next quarter?'),
                response(
                    p(
                        'The Middle East. The delayed contract should close early next ' +
                            'quarter, and two renewals fall in the same window.'
                    ),
                    p(
                        'Latin America is also worth a look - its growth came mostly from one ' +
                            'new client, so it may not repeat.'
                    ),
                    p('Want me to set up a weekly summary for those two regions?')
                ),
                userMessage('Not yet - thanks!')
            ]
        })
    })
);

//------------------
// Implementation
//------------------
const REGIONS = [
    {id: 'northAmerica', title: 'North America', revenue: '$4.2M', change: 'up 6%'},
    {id: 'latinAmerica', title: 'Latin America', revenue: '$1.1M', change: 'up 14%'},
    {id: 'europe', title: 'Europe', revenue: '$3.0M', change: 'flat'},
    {id: 'middleEast', title: 'Middle East', revenue: '$0.6M', change: 'down 4%'},
    {id: 'africa', title: 'Africa', revenue: '$0.4M', change: 'up 3%'},
    {id: 'southAsia', title: 'South Asia', revenue: '$0.9M', change: 'up 9%'},
    {id: 'asiaPacific', title: 'Asia Pacific', revenue: '$2.7M', change: 'up 12%'},
    {id: 'japan', title: 'Japan', revenue: '$1.3M', change: 'up 2%'},
    {id: 'oceania', title: 'Oceania', revenue: '$0.5M', change: 'up 5%'}
];

/** A tab per region, with a switcher too small to show them all. */
function regionTabs(switcher: TabSwitcherConfig, orientation: Side = 'top') {
    return tabContainer({
        className: 'tb-layout-tabs__child',
        flex: 'none',
        height: 180,
        switcher: {orientation, enableOverflow: switcher.mode === 'static'},
        modelConfig: {
            switcher,
            tabs: REGIONS.map(({id, title, revenue, change}) => ({
                id,
                title,
                content: () =>
                    div(`${title} revenue was ${revenue}, ${change} on the prior quarter.`)
            }))
        }
    });
}

function userMessage(text: string) {
    return card({
        title: 'You',
        icon: Icon.user(),
        alignSelf: 'flex-end',
        maxWidth: 400,
        item: text
    });
}

function response(...items: ReactNode[]) {
    return card({
        title: 'Assistant',
        icon: Icon.sparkles(),
        alignSelf: 'flex-start',
        width: '100%',
        maxWidth: 520,
        // A card is a fieldset, which by default can't shrink below the width of its tab strip.
        minWidth: 0,
        items
    });
}
