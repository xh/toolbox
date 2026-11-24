import type {Blueprint, BlueprintRegistry, DataCatalog} from '@xh/hoist-chat-kit/blueprint';
import {exampleBlueprintOf} from '@xh/hoist-chat-kit/blueprint';
import type {PlainObject} from '@xh/hoist/core';
import {withPromptInputs} from '../../../../blueprints/withPromptInputs';

/** The id of the Built-ins page that shows every input at once. */
export const INPUTS_OVERVIEW = 'inputs';

/**
 * A Built-ins page's example: a richer one where Toolbox has it, else the widget's own example from
 * its registry entry. Null if the widget has none.
 */
export function builtinExample(
    name: string,
    registry: BlueprintRegistry,
    catalog: DataCatalog
): Blueprint {
    const rich = RICH_EXAMPLES[name];
    if (rich) return rich();
    const spec = registry.widgets[name];
    return spec ? exampleBlueprintOf({...spec, name}, catalog).blueprint : null;
}

//------------------
// Implementation
//------------------
const asOf = {
    type: 'localDate',
    label: 'As of',
    setBy: 'prompt',
    default: {resolver: 'previousBusinessDay'}
};

const positions = {dataset: 'positions', params: {asOf: {$var: 'asOf'}}};

const statCard = (field: string) => ({component: 'statCard', config: {source: 'positions', field}});

const sectorChart = {
    component: 'chart',
    config: {source: 'positions', type: 'column', x: 'sector', y: ['pnlDay']}
};

const posGrid = {
    component: 'cubeGrid',
    config: {
        source: 'positions',
        groupBy: ['sector', 'symbol'],
        columnState: ['mktVal', 'pnlDay'],
        sortBy: 'pnlDay|desc'
    }
};

const RICH_EXAMPLES: Record<string, () => Blueprint> = {
    dashboard: () =>
        withPromptInputs({
            variables: {asOf},
            sources: {positions},
            root: 'dashboard',
            elements: {
                dashboard: {
                    component: 'dashboard',
                    children: [
                        {id: 'mvCard', x: 0, y: 0, w: 4, h: 2, title: 'Market value'},
                        {id: 'pnlCard', x: 4, y: 0, w: 4, h: 2, title: 'Day P&L'},
                        {id: 'grossCard', x: 8, y: 0, w: 4, h: 2, title: 'Gross exposure'},
                        {id: 'sectorChart', x: 0, y: 2, w: 7, h: 6, title: 'Day P&L by sector'},
                        {id: 'posGrid', x: 7, y: 2, w: 5, h: 6, title: 'Positions'}
                    ]
                },
                mvCard: statCard('mktVal'),
                pnlCard: statCard('pnlDay'),
                grossCard: statCard('grossExposure'),
                sectorChart,
                posGrid
            }
        } as Blueprint),

    tabContainer: () =>
        withPromptInputs({
            variables: {asOf},
            sources: {positions},
            root: 'tabContainer',
            elements: {
                tabContainer: {
                    component: 'tabContainer',
                    children: [
                        {id: 'headline', title: 'Headline'},
                        {id: 'posGrid', title: 'Positions'},
                        {id: 'sectorChart', title: 'By sector'}
                    ]
                },
                headline: {
                    component: 'tileFrame',
                    config: {maxTileHeight: 110},
                    children: [{id: 'mvCard'}, {id: 'pnlCard'}, {id: 'grossCard'}]
                },
                mvCard: statCard('mktVal'),
                pnlCard: statCard('pnlDay'),
                grossCard: statCard('grossExposure'),
                posGrid,
                sectorChart
            }
        } as Blueprint),

    [INPUTS_OVERVIEW]: () => inputsOverview()
};

/**
 * Each input in the tbar of a cell headed with its widget's name, bound to a labelled variable, over
 * a line that shows the variable's value.
 */
function inputsOverview(): Blueprint {
    const inputs: [string, PlainObject, string, PlainObject][] = [
            ['asOfInput', {component: 'dateInput'}, 'asOf', {...asOf, setBy: undefined}],
            [
                'fundSelect',
                {component: 'select'},
                'fund',
                {
                    type: 'toolbox.fund',
                    label: 'Fund',
                    default: {value: 'Oak Mount'},
                    options: {source: 'funds', field: 'fund'}
                }
            ],
            [
                'periodButtons',
                {
                    component: 'buttonGroupInput',
                    config: {
                        options: [
                            {value: 'day', label: 'Day'},
                            {value: 'mtd', label: 'MTD'},
                            {value: 'ytd', label: 'YTD'}
                        ]
                    }
                },
                'pnlPeriod',
                {type: 'string', label: 'P&L period', default: {value: 'day'}}
            ],
            [
                'groupChooser',
                {
                    component: 'groupingChooser',
                    config: {dimensions: ['sector', 'strategy', 'symbol']}
                },
                'grouping',
                {type: 'string[]', label: 'Group by', default: {value: ['sector', 'symbol']}}
            ],
            [
                'windowPicker',
                {
                    component: 'dateRangePicker',
                    config: {presets: ['mtd', 'qtd', 'ytd'], asOf: {$var: 'asOf'}}
                },
                'window',
                {type: 'dateRange', label: 'Window', default: {value: 'mtd'}}
            ],
            [
                'pnlSlider',
                {component: 'slider', config: {min: -500000, max: 500000, step: 50000}},
                'minPnl',
                {type: 'number', label: 'Day P&L at least', default: {value: 0}}
            ],
            [
                'limitInput',
                {component: 'numberInput', config: {min: 0}},
                'limit',
                {type: 'number', label: 'Position limit', default: {value: 1000000}}
            ],
            [
                'searchInput',
                {component: 'textInput', config: {placeholder: 'Symbol or name'}},
                'search',
                {type: 'string', label: 'Search', default: {value: 'NVDA'}}
            ],
            [
                'totalsSwitch',
                {component: 'switchInput'},
                'showTotals',
                {type: 'bool', label: 'Totals', default: {value: true}}
            ]
        ],
        elements: PlainObject = {},
        variables: PlainObject = {asOf};

    inputs.forEach(([id, el, name, decl]) => {
        const value = `${id}Value`,
            unlabelled = el.component === 'buttonGroupInput' || el.component === 'groupingChooser';
        variables[name] = {...decl, setBy: {element: id}};
        elements[id] = unlabelled ? el : {...el, config: {...el.config, label: decl.label}};
        elements[value] = {
            component: 'markdown',
            config: {text: `**${decl.label}**: \`${name}\` = {${name}}`}
        };
        elements[`${id}Cell`] = {component: 'panel', tbar: [{id}], children: [{id: value}]};
    });
    return {
        variables,
        sources: {funds: {dataset: 'fundSummary', params: {asOf: {$var: 'asOf'}}}},
        root: INPUTS_OVERVIEW,
        elements: {
            [INPUTS_OVERVIEW]: {
                component: 'dashboard',
                children: inputs.map(([id, el], idx) => ({
                    id: `${id}Cell`,
                    x: (idx % 3) * 4,
                    y: Math.floor(idx / 3) * 2,
                    w: 4,
                    h: 2,
                    title: el.component
                }))
            },
            ...elements
        }
    } as Blueprint;
}
