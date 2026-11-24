import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import p1 from '../../../../blueprints/scenarios/p1-one-grid.json';
import p2 from '../../../../blueprints/scenarios/p2-linked-dashboard.json';
import {withPromptInputs} from '../../../../blueprints/withPromptInputs';

/** A page of the Blueprints tab's Concepts group. */
export interface ConceptPage {
    /** Tab id, and the last segment of the page's route. */
    id: string;
    title: string;
    /** The page's copy, as markdown paragraphs. */
    paragraphs: string[];
    /** JSON to show beside the copy, such as an edit, as text. */
    code?: string;
    /** A small blueprint the page runs, read-only. */
    example?: Blueprint;
}

const asOf = {
    type: 'localDate',
    label: 'As of',
    setBy: 'prompt',
    default: {resolver: 'previousBusinessDay'}
};

const positions = {dataset: 'positions', params: {asOf: {$var: 'asOf'}}};

/** Every Concepts page, in reading order. Each links to the next. */
export const CONCEPT_PAGES: ConceptPage[] = [
    {
        id: 'documents',
        title: 'Blueprints and documents',
        paragraphs: [
            'A blueprint is one plain JSON document, and Hoist renders it with real Hoist widgets. The same document always renders the same view.',
            "The document is the source of truth. Each widget's model derives its state from it, and nothing outside it changes how the view behaves.",
            'It holds no functions or expressions, only names from closed registries, so a saved blueprint, or one a model wrote, cannot run code. One format serves dashboards, reports and chat answers.'
        ],
        example: p1 as Blueprint
    },
    {
        id: 'layout',
        title: 'Elements and layout',
        paragraphs: [
            'Every element sits in one flat map, keyed by its id, and `root` names the top one.',
            "A container lists its children by reference, and the reference carries the placement: `x`, `y`, `w` and `h` on a dashboard, a title on a tab. A widget's config holds no layout, so a move changes only references.",
            "Each element has one parent. A container's named slots match its Hoist props: a panel has `children`, `tbar`, `bbar` and `headerItems`."
        ],
        example: p2 as Blueprint
    },
    {
        id: 'widgets',
        title: 'Widgets',
        paragraphs: [
            "A widget is a Hoist model and component that the document configures. Each is named after the Hoist component it renders, such as `cubeGrid`, `chart` or `statCard`, so Hoist's docs apply.",
            'A widget declares its config schema, its outputs, and the paths presets may control. Its state lives in its config, never hidden in its model.',
            "Apps register their own widgets under dotted names, such as `toolbox.portfolioBuilder`. Each example's Registry lists every widget with a live example."
        ],
        example: withPromptInputs({
            variables: {asOf},
            sources: {positions},
            root: 'dash',
            elements: {
                dash: {
                    component: 'dashboard',
                    children: [
                        {id: 'mktValCard', x: 0, y: 0, w: 3, h: 2},
                        {id: 'pnlCard', x: 3, y: 0, w: 3, h: 2},
                        {id: 'sectorChart', x: 6, y: 0, w: 6, h: 6},
                        {id: 'posGrid', x: 0, y: 2, w: 6, h: 4}
                    ]
                },
                mktValCard: {
                    component: 'statCard',
                    config: {
                        source: 'positions',
                        field: 'mktVal',
                        format: {scale: 'millions', precision: 1}
                    }
                },
                pnlCard: {component: 'statCard', config: {source: 'positions', field: 'pnlDay'}},
                sectorChart: {
                    component: 'chart',
                    config: {
                        source: 'positions',
                        title: 'Day P&L by Sector',
                        type: 'column',
                        x: 'sector',
                        y: ['pnlDay']
                    }
                },
                posGrid: {
                    component: 'cubeGrid',
                    config: {
                        source: 'positions',
                        groupBy: ['sector', 'symbol'],
                        columnState: ['mktVal', 'pnlDay']
                    }
                }
            }
        } as Blueprint)
    },
    {
        id: 'variables',
        title: 'Variables',
        paragraphs: [
            'Every value that moves is a variable: a prompt, a selection, a date, a filter. A filter is a variable of type `filter`.',
            'Variables live at the root. Each declares a type, a label, a default and `setBy`, which names the one thing that may set it: a prompt, a widget, an output, a resolver or an action.',
            'A default is a literal or a resolver, such as `previousBusinessDay`, so a saved blueprint keeps moving with time. Below, the buttons set `pnlFilter` and the grid reads it.'
        ],
        example: withPromptInputs({
            variables: {asOf, pnlFilter: {type: 'filter', setBy: 'action'}},
            sources: {positions},
            root: 'dash',
            elements: {
                dash: {
                    component: 'dashboard',
                    children: [
                        {id: 'pnlButtons', x: 0, y: 0, w: 12, h: 1},
                        {id: 'posGrid', x: 0, y: 1, w: 12, h: 6}
                    ]
                },
                pnlButtons: {
                    component: 'buttonGroup',
                    config: {
                        buttons: [
                            {
                                label: 'Winners',
                                action: {
                                    type: 'setVariable',
                                    variable: 'pnlFilter',
                                    value: {field: 'pnlDay', op: '>', value: 0}
                                }
                            },
                            {
                                label: 'Losers',
                                action: {
                                    type: 'setVariable',
                                    variable: 'pnlFilter',
                                    value: {field: 'pnlDay', op: '<', value: 0}
                                }
                            },
                            {label: 'All', action: {type: 'resetVariable', variable: 'pnlFilter'}}
                        ]
                    }
                },
                posGrid: {
                    component: 'cubeGrid',
                    config: {
                        source: 'positions',
                        groupBy: ['sector', 'symbol'],
                        columnState: ['mktVal', 'pnlDay'],
                        filter: {$var: 'pnlFilter'}
                    }
                }
            }
        } as Blueprint)
    },
    {
        id: 'binding',
        title: 'Data binding',
        paragraphs: [
            'Config reads a variable one way: `{"$var": "name"}`. Each widget schema marks the paths that take a binding, and the validator checks the types match.',
            "Widgets connect only through variables, never through references to each other. Below, the treemap's selection sets `sectorPick`, and the grid's filter reads it. Click a sector.",
            'The Map view draws these links, and the Inspector lists what the selected widget reads and sets.'
        ],
        example: withPromptInputs({
            variables: {
                asOf,
                sectorPick: {type: 'filter', setBy: {element: 'sectorMap', output: 'selection'}}
            },
            sources: {positions},
            root: 'dash',
            elements: {
                dash: {
                    component: 'dashboard',
                    children: [
                        {id: 'sectorMap', x: 0, y: 0, w: 5, h: 7},
                        {id: 'posGrid', x: 5, y: 0, w: 7, h: 7}
                    ]
                },
                sectorMap: {
                    component: 'treemap',
                    config: {
                        source: 'positions',
                        groupBy: ['sector', 'symbol'],
                        value: 'mktVal',
                        heat: 'pnlDay',
                        maxDepth: 1
                    }
                },
                posGrid: {
                    component: 'cubeGrid',
                    config: {
                        source: 'positions',
                        groupBy: ['sector', 'symbol'],
                        columnState: ['mktVal', 'pnlDay'],
                        filter: {$var: 'sectorPick'}
                    }
                }
            }
        } as Blueprint)
    },
    {
        id: 'sources',
        title: 'Sources and joins',
        paragraphs: [
            "A source names a dataset from the app's Data Catalog and binds its parameters. Widgets name a source and never hold data, so a saved blueprint is always live. Widgets that share a source share one request.",
            "A source can join other sources by key, with no join on the server. The grain of each side picks how: the same grain copies values, and a coarser one keeps one value per key, such as a fund's NAV.",
            "Below, positions join each fund's NAV, manager and style, and each symbol's latest close."
        ],
        example: withPromptInputs({
            variables: {
                asOf,
                priceStart: {
                    type: 'localDate',
                    setBy: 'resolver',
                    compute: {
                        resolver: 'dateOffset',
                        args: {from: {$var: 'asOf'}, months: -1}
                    }
                }
            },
            sources: {
                positions: {
                    dataset: 'positions',
                    params: {asOf: {$var: 'asOf'}},
                    joins: [
                        {source: 'funds', on: {fund: 'fund'}, fields: ['nav', 'manager', 'style']},
                        {
                            source: 'prices',
                            on: {symbol: 'symbol'},
                            fields: ['close'],
                            as: {close: 'lastClose'}
                        }
                    ]
                },
                funds: {dataset: 'fundSummary', params: {asOf: {$var: 'asOf'}}},
                prices: {
                    dataset: 'prices',
                    params: {start: {$var: 'priceStart'}, end: {$var: 'asOf'}}
                }
            },
            root: 'posGrid',
            elements: {
                posGrid: {
                    component: 'cubeGrid',
                    config: {
                        source: 'positions',
                        groupBy: ['style', 'fund', 'symbol'],
                        columnState: ['manager', 'nav', 'mktVal', 'pnlDay', 'lastClose'],
                        sortBy: 'mktVal|desc'
                    }
                }
            }
        } as Blueprint)
    },
    {
        id: 'presets',
        title: 'Presets',
        paragraphs: [
            'A preset group is a named set of values a designer publishes for users to switch between, such as column views on a grid.',
            'The group lists the paths it controls, and each preset sets every one of them, so switching always gives the same result.',
            'A `presetSelector` widget shows the switch, in the toolbar of the view it drives. Switch between the P&L and Risk views below.'
        ],
        example: withPromptInputs({
            variables: {asOf},
            sources: {positions},
            presets: {
                posViews: {
                    label: 'Columns',
                    controls: [{path: '/elements/posGrid/config/columnState'}],
                    default: 'pnl',
                    items: {
                        pnl: {
                            label: 'P&L view',
                            set: {
                                elements: {
                                    posGrid: {
                                        config: {
                                            columnState: ['mktVal', 'pnlDay', 'pnlMtd', 'pnlYtd']
                                        }
                                    }
                                }
                            }
                        },
                        risk: {
                            label: 'Risk view',
                            set: {
                                elements: {
                                    posGrid: {
                                        config: {
                                            columnState: [
                                                'grossExposure',
                                                'netExposure',
                                                'beta',
                                                'var95',
                                                'pctNav'
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            root: 'dash',
            elements: {
                dash: {
                    component: 'dashboard',
                    children: [
                        {
                            id: 'posGrid',
                            x: 0,
                            y: 0,
                            w: 12,
                            h: 7,
                            headerItems: [{id: 'posViewsSelector'}]
                        }
                    ]
                },
                posViewsSelector: {
                    component: 'presetSelector',
                    config: {group: 'posViews', display: 'segmented', label: 'Columns'}
                },
                posGrid: {
                    component: 'cubeGrid',
                    config: {source: 'positions', groupBy: ['sector', 'symbol']}
                }
            }
        } as Blueprint)
    },
    {
        id: 'actions',
        title: 'Actions',
        paragraphs: [
            'Actions are typed, from a registry, and each type declares its parameters, so every action is checked before it runs. Built in are `setVariable`, `resetVariable`, `refresh`, `navigate`, `openUrl` and `openBlueprint`, and apps add their own.',
            'A prop takes one action or a list of up to eight steps. An action with side effects always asks the user to confirm.',
            '`openBlueprint` drills into another blueprint of the same type, and a row action reads the clicked row with `{"$row": field}`. Right-click a position below to open its symbol.'
        ],
        example: withPromptInputs({
            variables: {asOf, pnlFilter: {type: 'filter', setBy: 'action'}},
            sources: {positions},
            root: 'dash',
            elements: {
                dash: {
                    component: 'dashboard',
                    children: [
                        {id: 'buttons', x: 0, y: 0, w: 12, h: 1},
                        {id: 'posGrid', x: 0, y: 1, w: 12, h: 6}
                    ]
                },
                buttons: {
                    component: 'buttonGroup',
                    config: {
                        buttons: [
                            {
                                label: 'Winners',
                                action: {
                                    type: 'setVariable',
                                    variable: 'pnlFilter',
                                    value: {field: 'pnlDay', op: '>', value: 0}
                                }
                            },
                            {label: 'All', action: {type: 'resetVariable', variable: 'pnlFilter'}},
                            {label: 'Refresh', icon: 'refresh', action: {type: 'refresh'}}
                        ]
                    }
                },
                posGrid: {
                    component: 'cubeGrid',
                    config: {
                        source: 'positions',
                        groupBy: ['sector', 'symbol'],
                        columnState: ['mktVal', 'pnlDay'],
                        filter: {$var: 'pnlFilter'},
                        rowActions: [
                            {
                                label: 'Open detail',
                                icon: 'external-link',
                                action: {
                                    type: 'openBlueprint',
                                    blueprint: 'symbol-detail',
                                    variables: {symbol: {$row: 'symbol'}, asOf: {$var: 'asOf'}}
                                }
                            }
                        ]
                    }
                }
            }
        } as Blueprint)
    },
    {
        id: 'editing',
        title: 'Design, run, publish',
        paragraphs: [
            'Every change is an edit: a list of operations on JSON Pointer paths, checked as a whole and applied all or nothing. One edit is one undo step and one history entry. People, the Architect and a grid sort all use the same path.',
            'Design mode edits the draft. Run mode is for users, and changes there stay transient.',
            'A blueprint has one draft and numbered publishes. Users run the latest publish, and writers share the draft. Each blueprint has a type and a stable token, and opens by URL.'
        ],
        code: JSON.stringify(
            {
                base: 7,
                description: 'Stripe the positions grid',
                ops: [{op: 'set', path: '/elements/posGrid/config/stripeRows', value: true}]
            },
            null,
            2
        ),
        example: p1 as Blueprint
    },
    {
        id: 'architect',
        title: 'The Architect',
        paragraphs: [
            'The Architect is an AI agent that builds and edits blueprints through the same checked edits people make. Its tools enforce mode and access, not its prompt.',
            'It reads the Data Catalog and Registry before it writes, so it never guesses a field or a config key. It answers questions with answer blueprints in the chat, and "Add to dashboard" moves an answer into the blueprint open.',
            'When it cannot do something, it offers a workaround and, once the user approves the whole payload, files a feature request. Open the Portfolio example and ask it for a view.'
        ]
    }
];
