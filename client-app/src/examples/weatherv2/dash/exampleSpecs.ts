import {DashSpec} from './types';

export interface ExampleSpec {
    name: string;
    description: string;
    spec: DashSpec;
}

/** Minimal: Single city with conditions + forecast chart. */
const minimalSpec: DashSpec = {
    version: 1,
    state: [
        {
            viewSpecId: 'cityChooser',
            layout: {x: 0, y: 0, w: 3, h: 2},
            state: {selectedCity: 'New York'}
        },
        {
            viewSpecId: 'currentConditions',
            layout: {x: 3, y: 0, w: 4, h: 5},
            state: {
                bindings: {city: {fromWidget: 'cityChooser_0', output: 'selectedCity'}}
            }
        },
        {
            viewSpecId: 'forecastChart',
            layout: {x: 7, y: 0, w: 5, h: 5},
            state: {
                bindings: {city: {fromWidget: 'cityChooser_0', output: 'selectedCity'}},
                series: ['temp'],
                chartType: 'line'
            }
        }
    ]
};

/** Full Dashboard: All widget types wired together. */
const fullSpec: DashSpec = {
    version: 1,
    state: [
        {
            viewSpecId: 'cityChooser',
            layout: {x: 0, y: 0, w: 3, h: 2},
            state: {selectedCity: 'New York'}
        },
        {
            viewSpecId: 'unitsToggle',
            layout: {x: 0, y: 2, w: 3, h: 2},
            state: {units: 'imperial'}
        },
        {
            viewSpecId: 'currentConditions',
            layout: {x: 3, y: 0, w: 4, h: 5},
            state: {
                bindings: {
                    city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                    units: {fromWidget: 'unitsToggle_0', output: 'units'}
                }
            }
        },
        {
            viewSpecId: 'forecastChart',
            layout: {x: 7, y: 0, w: 5, h: 5},
            state: {
                bindings: {
                    city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                    units: {fromWidget: 'unitsToggle_0', output: 'units'}
                },
                series: ['temp', 'feelsLike'],
                chartType: 'line'
            }
        },
        {
            viewSpecId: 'precipChart',
            layout: {x: 0, y: 5, w: 6, h: 5},
            state: {
                bindings: {city: {fromWidget: 'cityChooser_0', output: 'selectedCity'}}
            }
        },
        {
            viewSpecId: 'windChart',
            layout: {x: 6, y: 5, w: 6, h: 5},
            state: {
                bindings: {
                    city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                    units: {fromWidget: 'unitsToggle_0', output: 'units'}
                },
                showGusts: true
            }
        },
        {
            viewSpecId: 'summaryGrid',
            layout: {x: 0, y: 10, w: 12, h: 5},
            state: {
                bindings: {
                    city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                    units: {fromWidget: 'unitsToggle_0', output: 'units'}
                }
            }
        }
    ]
};

/** City Comparison: Two cities side by side. */
const comparisonSpec: DashSpec = {
    version: 1,
    state: [
        {
            viewSpecId: 'cityChooser',
            layout: {x: 0, y: 0, w: 3, h: 2},
            title: 'City A',
            state: {selectedCity: 'New York'}
        },
        {
            viewSpecId: 'cityChooser',
            layout: {x: 6, y: 0, w: 3, h: 2},
            title: 'City B',
            state: {selectedCity: 'London'}
        },
        {
            viewSpecId: 'unitsToggle',
            layout: {x: 3, y: 0, w: 3, h: 2},
            state: {units: 'imperial'}
        },
        {
            viewSpecId: 'forecastChart',
            layout: {x: 0, y: 2, w: 6, h: 5},
            state: {
                bindings: {
                    city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                    units: {fromWidget: 'unitsToggle_0', output: 'units'}
                },
                series: ['temp'],
                chartType: 'line'
            }
        },
        {
            viewSpecId: 'forecastChart',
            layout: {x: 6, y: 2, w: 6, h: 5},
            state: {
                bindings: {
                    city: {fromWidget: 'cityChooser_1', output: 'selectedCity'},
                    units: {fromWidget: 'unitsToggle_0', output: 'units'}
                },
                series: ['temp'],
                chartType: 'line'
            }
        },
        {
            viewSpecId: 'currentConditions',
            layout: {x: 0, y: 7, w: 6, h: 5},
            state: {
                bindings: {
                    city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                    units: {fromWidget: 'unitsToggle_0', output: 'units'}
                }
            }
        },
        {
            viewSpecId: 'currentConditions',
            layout: {x: 6, y: 7, w: 6, h: 5},
            state: {
                bindings: {
                    city: {fromWidget: 'cityChooser_1', output: 'selectedCity'},
                    units: {fromWidget: 'unitsToggle_0', output: 'units'}
                }
            }
        }
    ]
};

/** Annotated: Markdown header + display widgets + inspector. */
const annotatedSpec: DashSpec = {
    version: 1,
    state: [
        {
            viewSpecId: 'markdownContent',
            layout: {x: 0, y: 0, w: 12, h: 2},
            state: {
                title: 'Dashboard Guide',
                content:
                    '# Weather Dashboard V2\n\nThis dashboard demonstrates **inter-widget wiring**. The City Chooser and Units Toggle publish outputs that drive all display widgets. Open the **Dash Inspector** to see live binding values.'
            }
        },
        {
            viewSpecId: 'cityChooser',
            layout: {x: 0, y: 2, w: 3, h: 2},
            state: {selectedCity: 'Tokyo'}
        },
        {
            viewSpecId: 'unitsToggle',
            layout: {x: 3, y: 2, w: 3, h: 2},
            state: {units: 'metric'}
        },
        {
            viewSpecId: 'forecastChart',
            layout: {x: 6, y: 2, w: 6, h: 5},
            state: {
                bindings: {
                    city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                    units: {fromWidget: 'unitsToggle_0', output: 'units'}
                },
                series: ['temp', 'humidity'],
                chartType: 'area'
            }
        },
        {
            viewSpecId: 'currentConditions',
            layout: {x: 0, y: 4, w: 6, h: 5},
            state: {
                bindings: {
                    city: {fromWidget: 'cityChooser_0', output: 'selectedCity'},
                    units: {fromWidget: 'unitsToggle_0', output: 'units'}
                }
            }
        },
        {
            viewSpecId: 'dashInspector',
            layout: {x: 0, y: 9, w: 12, h: 4},
            title: 'Wiring Inspector'
        }
    ]
};

export const EXAMPLE_SPECS: ExampleSpec[] = [
    {name: 'Minimal', description: 'City chooser + conditions + forecast', spec: minimalSpec},
    {name: 'Full Dashboard', description: 'All widget types wired together', spec: fullSpec},
    {name: 'City Comparison', description: 'Two cities side by side', spec: comparisonSpec},
    {
        name: 'Annotated',
        description: 'Markdown guide + inspector + display widgets',
        spec: annotatedSpec
    }
];
