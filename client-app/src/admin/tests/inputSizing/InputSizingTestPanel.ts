import {div, filler, hbox, p, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import '@xh/hoist/desktop/cmp/input/modes/cssMode';
import {Children as ReactChildren, useEffect, useRef, useState, type ReactNode} from 'react';
import {button} from '@xh/hoist/desktop/cmp/button';
import {
    buttonGroupInput,
    codeInput,
    dateInput,
    jsonInput,
    numberInput,
    picker,
    segmentedControl,
    select,
    slider,
    switchInput,
    textArea,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import classNames from 'classnames';
import {usStates} from '../../../core/data';
import {InputSizingTestModel, UNSET} from './InputSizingTestModel';
import './InputSizingTestPanel.scss';

export const InputSizingTestPanel = hoistCmp({
    model: creates(InputSizingTestModel),
    render() {
        return panel({
            title: 'Input sizing test',
            icon: Icon.arrowRightArrowLeft(),
            className: 'tb-input-sizing-test',
            items: [
                cssOverrideStyle(),
                hbox({
                    className: 'tb-input-sizing-test__body',
                    items: [controlsSidebar(), specimensPane()]
                })
            ]
        });
    }
});

//------------------------------------------------------------
// CSS override injector - takes free-form CSS from the editor and applies it
// inside a CSS-nesting block scoped to `.tb-input-sizing-test__specimen-container`.
// Developer types ordinary selectors (e.g. `.xh-picker { width: 100% !important }`);
// the scope wrapper prevents bleeding into the rest of the page.
//------------------------------------------------------------
const cssOverrideStyle = hoistCmp.factory<InputSizingTestModel>(({model}) => {
    const {cssOverrideEnabled, cssOverrideText} = model;
    const active = cssOverrideEnabled && cssOverrideText?.trim();
    useEffect(() => {
        if (!active) return;
        const el = document.createElement('style');
        el.setAttribute('data-input-sizing-test', 'dynamic');
        // CSS nesting (supported in all modern browsers) auto-prefixes every
        // user selector with `.tb-input-sizing-test__specimen-container `.
        el.textContent = `.tb-input-sizing-test__specimen-container {\n${cssOverrideText}\n}`;
        document.head.appendChild(el);
        return () => el.remove();
    }, [active, cssOverrideText]);
    return null;
});

//------------------------------------------------------------
// Left sidebar with all controls.
//------------------------------------------------------------
const controlsSidebar = hoistCmp.factory<InputSizingTestModel>(({model}) => {
    return vbox({
        className: 'tb-input-sizing-test__controls',
        overflowY: 'auto',
        items: [
            controlGroup({
                title: 'Container',
                items: [
                    labeledControl({
                        label: 'Shape',
                        item: segmentedControl({
                            bind: 'containerShape',
                            options: [
                                {value: 'block', label: 'block'},
                                {value: 'hbox', label: 'hbox'},
                                {value: 'vbox', label: 'vbox'}
                            ]
                        })
                    }),
                    labeledControl({
                        label: 'Width',
                        item: numberInput({
                            bind: 'containerWidth',
                            min: 100,
                            max: 1200,
                            stepSize: 10,
                            majorStepSize: 50,
                            width: 90
                        })
                    }),
                    labeledControl({
                        label: 'Height',
                        item: numberInput({
                            bind: 'containerHeight',
                            min: 40,
                            max: 600,
                            stepSize: 10,
                            majorStepSize: 40,
                            width: 90,
                            disabled: model.containerShape !== 'vbox'
                        })
                    })
                ]
            }),
            controlGroup({
                title: 'Layout props (passed to every specimen)',
                items: [
                    propControl({bind: 'widthVal', label: 'width', options: WIDTH_OPTS}),
                    propControl({bind: 'flexVal', label: 'flex', options: FLEX_OPTS}),
                    propControl({
                        bind: 'minWidthVal',
                        label: 'minWidth',
                        options: MIN_MAX_OPTS
                    }),
                    propControl({
                        bind: 'maxWidthVal',
                        label: 'maxWidth',
                        options: MIN_MAX_OPTS
                    }),
                    button({
                        text: 'Clear all',
                        icon: Icon.x(),
                        minimal: true,
                        onClick: () => model.resetLayoutProps()
                    })
                ]
            }),
            cssOverrideGroup(),
            filler(),
            p({
                className: 'tb-input-sizing-test__footnote',
                item:
                    'Mobile inputs already default to `width: null` uniformly - they consistently fill their ' +
                    'container by CSS and are not reproduced here. See `/mobile/cmp/input/` for reference.'
            })
        ]
    });
});

const WIDTH_OPTS = [
    {value: UNSET, label: '(default)'},
    {value: 'null', label: 'null'},
    {value: '120', label: '120'},
    {value: '50%', label: '50%'},
    {value: '100%', label: '100%'}
];
const FLEX_OPTS = [
    {value: UNSET, label: '(none)'},
    {value: 'null', label: 'null'},
    {value: '0', label: '0'},
    {value: '1', label: '1'}
];
const MIN_MAX_OPTS = [
    {value: UNSET, label: '(none)'},
    {value: '80', label: '80'},
    {value: '240', label: '240'},
    {value: '400', label: '400'}
];

// NOTE: hoistCmp factories always forward `item` / `items` props as React children
// (per core/elem.ts), so inside the render fn we receive them on `children`.
const controlGroup = hoistCmp.factory<{title: string; children?: ReactNode}>(({title, children}) =>
    vbox({
        className: 'tb-input-sizing-test__control-group',
        items: [
            div({className: 'tb-input-sizing-test__control-group-title', item: title}),
            ...ReactChildren.toArray(children)
        ]
    })
);

const labeledControl = hoistCmp.factory<{label: string; children?: ReactNode}>(
    ({label, children}) =>
        hbox({
            className: 'tb-input-sizing-test__labeled-control',
            items: [
                span({className: 'label', item: label}),
                filler(),
                ...ReactChildren.toArray(children)
            ]
        })
);

const propControl = hoistCmp.factory<any>(({bind, label, options}) =>
    labeledControl({
        label,
        item: segmentedControl({bind, options, compact: true})
    })
);

const cssOverrideGroup = hoistCmp.factory<InputSizingTestModel>(({model}) =>
    controlGroup({
        title: 'CSS overrides (dev workaround simulation)',
        items: [
            labeledControl({
                label: 'Apply override',
                item: switchInput({bind: 'cssOverrideEnabled'})
            }),
            codeInput({
                bind: 'cssOverrideText',
                mode: 'css',
                width: '100%',
                height: 140,
                commitOnChange: true,
                showToolbar: true,
                showFullscreenButton: true,
                showCopyButton: true,
                disabled: !model.cssOverrideEnabled
            }),
            p({
                className: 'tb-input-sizing-test__help',
                item:
                    'Rules you write here are auto-wrapped in ' +
                    '`.tb-input-sizing-test__specimen-container { ... }` via CSS nesting, so ' +
                    'selectors only affect the specimens below.'
            })
        ]
    })
);

//------------------------------------------------------------
// Right pane: one specimen per layout-capable desktop input.
//------------------------------------------------------------
const SPECIMENS: Array<{
    name: string;
    outerClass: string;
    defaultText: string;
    build: (model: InputSizingTestModel) => any;
}> = [
    {
        name: 'textInput',
        outerClass: 'xh-text-input',
        defaultText: 'width: 200 (default)',
        build: m => textInput({bind: 'textVal', model: m, ...m.layoutProps})
    },
    {
        name: 'numberInput',
        outerClass: 'xh-number-input',
        defaultText: 'width: 200 (default)',
        build: m => numberInput({bind: 'numberVal', model: m, ...m.layoutProps})
    },
    {
        name: 'textArea',
        outerClass: 'xh-text-area',
        defaultText: 'width: 300, height: 100',
        build: m => textArea({bind: 'textAreaVal', model: m, ...m.layoutProps})
    },
    {
        name: 'select',
        outerClass: 'xh-select',
        defaultText: 'width: 200 (default)',
        build: m => select({bind: 'selectVal', model: m, options: usStates, ...m.layoutProps})
    },
    {
        name: 'picker (single)',
        outerClass: 'xh-picker',
        defaultText: 'width: 160 (on button)',
        build: m => picker({bind: 'pickerVal', model: m, options: usStates, ...m.layoutProps})
    },
    {
        name: 'picker (multi)',
        outerClass: 'xh-picker',
        defaultText: 'width: 160 (on button)',
        build: m =>
            picker({
                bind: 'multiPickerVal',
                model: m,
                options: usStates,
                enableMulti: true,
                enableClear: true,
                enableSelectAll: true,
                displayNoun: 'state',
                ...m.layoutProps
            })
    },
    {
        name: 'dateInput',
        outerClass: 'xh-date-input',
        defaultText: 'no default (has outer wrapper - see #4085, #2421)',
        build: m => dateInput({bind: 'dateVal', model: m, ...m.layoutProps})
    },
    {
        name: 'slider',
        outerClass: 'xh-slider',
        defaultText: 'width: 200 (default)',
        build: m => slider({bind: 'sliderVal', model: m, min: 0, max: 100, ...m.layoutProps})
    },
    {
        name: 'segmentedControl',
        outerClass: 'xh-segmented-control',
        defaultText: 'no default; fill defaults true',
        build: m =>
            segmentedControl({
                bind: 'segVal',
                model: m,
                options: [
                    {value: 'a', label: 'Alpha'},
                    {value: 'b', label: 'Beta'},
                    {value: 'c', label: 'Gamma'}
                ],
                ...m.layoutProps
            })
    },
    {
        name: 'buttonGroupInput',
        outerClass: 'xh-button-group-input',
        defaultText: 'no default',
        build: m =>
            buttonGroupInput({
                bind: 'btnGrpVal',
                model: m,
                ...m.layoutProps,
                items: [
                    button({value: 'a', text: 'Alpha'}),
                    button({value: 'b', text: 'Beta'}),
                    button({value: 'c', text: 'Gamma'})
                ]
            })
    },
    {
        name: 'codeInput',
        outerClass: 'xh-code-input',
        defaultText: 'no width default; height fallback 100',
        build: m => codeInput({bind: 'codeVal', model: m, ...m.layoutProps})
    },
    {
        name: 'jsonInput',
        outerClass: 'xh-json-input',
        defaultText: 'no width default; height fallback 100',
        build: m => jsonInput({bind: 'jsonVal', model: m, ...m.layoutProps})
    }
];

const specimensPane = hoistCmp.factory(() => {
    return vbox({
        className: 'tb-input-sizing-test__specimens',
        flex: 1,
        overflowY: 'auto',
        items: [summaryBanner(), ...SPECIMENS.map(spec => specimenRow({...spec, key: spec.name}))]
    });
});

const summaryBanner = hoistCmp.factory<InputSizingTestModel>(({model}) => {
    const {layoutProps, cssOverrideEnabled, containerShape, containerWidth} = model;
    const lpStr = Object.keys(layoutProps).length
        ? JSON.stringify(layoutProps)
        : '(none - component defaults apply)';
    return div({
        className: 'tb-input-sizing-test__summary',
        items: [
            span({item: `Container: ${containerShape} @ ${containerWidth}px`}),
            span({item: ` · layoutProps: ${lpStr}`}),
            span({item: ` · CSS override: ${cssOverrideEnabled ? 'on' : 'off'}`})
        ]
    });
});

//------------------------------------------------------------
// One specimen row: header, container with input, live measurement.
//------------------------------------------------------------
const specimenRow = hoistCmp.factory<InputSizingTestModel>(
    ({model, name, outerClass, defaultText, build}) => {
        const wrapRef = useRef<HTMLDivElement>(null);
        const metricsRef = useRef<{
            cw: number;
            ch: number;
            contentW: number;
            iw: number;
            ih: number;
        } | null>(null);
        const [metrics, setMetrics] = useState<{
            cw: number;
            ch: number;
            contentW: number;
            iw: number;
            ih: number;
        } | null>(null);

        // Re-key the effect on any model value that could change rendered size, so we
        // re-measure without relying on MutationObserver (which is easy to loop on).
        const depsKey =
            outerClass +
            '|' +
            model.containerShape +
            '|' +
            model.containerWidth +
            '|' +
            model.containerHeight +
            '|' +
            model.containerGap +
            '|' +
            model.cssOverrideEnabled +
            '|' +
            model.cssOverrideText +
            '|' +
            JSON.stringify(model.layoutProps);

        useEffect(() => {
            const wrap = wrapRef.current;
            if (!wrap) return;
            let raf = 0;
            const measure = () => {
                raf = 0;
                const container = wrap.firstElementChild as HTMLElement | null;
                const inputEl = container?.querySelector('.' + outerClass) as HTMLElement | null;
                if (!container || !inputEl) {
                    if (metricsRef.current !== null) {
                        metricsRef.current = null;
                        setMetrics(null);
                    }
                    return;
                }
                const cr = container.getBoundingClientRect();
                const ir = inputEl.getBoundingClientRect();
                const cs = window.getComputedStyle(container);
                const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
                const next = {
                    cw: Math.round(cr.width),
                    ch: Math.round(cr.height),
                    contentW: Math.round(cr.width - padX),
                    iw: Math.round(ir.width),
                    ih: Math.round(ir.height)
                };
                const prev = metricsRef.current;
                if (
                    !prev ||
                    prev.cw !== next.cw ||
                    prev.ch !== next.ch ||
                    prev.contentW !== next.contentW ||
                    prev.iw !== next.iw ||
                    prev.ih !== next.ih
                ) {
                    metricsRef.current = next;
                    setMetrics(next);
                }
            };
            // Measure after layout/paint settles for this render.
            raf = window.requestAnimationFrame(measure);
            return () => {
                if (raf) window.cancelAnimationFrame(raf);
            };
            // outerClass is baked into depsKey; listing it separately is redundant
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [depsKey]);

        // A fill was "expected" if the developer passed flex, width: '100%',
        // or width: 'null' (meaning "let me control it via CSS / container").
        const {flex, width} = model.layoutProps;
        const fillExpected =
            flex != null || width === '100%' || (width === null && model.cssOverrideEnabled);
        const mismatch = metrics && fillExpected && metrics.iw < metrics.contentW - 2;

        return vbox({
            className: 'tb-input-sizing-test__specimen',
            items: [
                hbox({
                    className: 'tb-input-sizing-test__specimen-header',
                    items: [
                        span({className: 'name', item: name}),
                        filler(),
                        span({className: 'default', item: defaultText})
                    ]
                }),
                div({
                    ref: wrapRef,
                    className: 'tb-input-sizing-test__specimen-wrap',
                    item: specimenContainer({item: build(model)})
                }),
                div({
                    className: classNames(
                        'tb-input-sizing-test__specimen-metrics',
                        mismatch && 'tb-input-sizing-test__specimen-metrics--mismatch'
                    ),
                    item: metrics
                        ? `container (content): ${metrics.contentW}px  ·  ${outerClass}: ${metrics.iw} × ${metrics.ih}` +
                          (mismatch
                              ? `   ⚠ did not fill (${metrics.contentW - metrics.iw}px short)`
                              : '')
                        : '— measuring —'
                })
            ]
        });
    }
);

const specimenContainer = hoistCmp.factory<InputSizingTestModel & {children?: ReactNode}>(
    ({model, children}) => {
        const {containerShape, containerWidth, containerHeight, containerGap} = model;
        const kids = ReactChildren.toArray(children);
        const common = {
            className: 'tb-input-sizing-test__specimen-container',
            width: containerWidth,
            items: kids
        };
        if (containerShape === 'block') {
            return div({...common, className: common.className + ' shape-block'});
        }
        if (containerShape === 'hbox') {
            return hbox({
                ...common,
                gap: containerGap,
                alignItems: 'center',
                className: common.className + ' shape-hbox'
            });
        }
        return vbox({
            ...common,
            height: containerHeight,
            gap: containerGap,
            className: common.className + ' shape-vbox'
        });
    }
);
