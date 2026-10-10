import type {CardProps} from '@xh/hoist/cmp/card';
import {card} from '@xh/hoist/cmp/card';
import {div, filler, hbox, img, span, vbox} from '@xh/hoist/cmp/layout';
import type {ReactElement, ReactNode} from 'react';
import type {ElementSpec} from '@xh/hoist/core';
import {hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import type {SliderProps} from '@xh/hoist/desktop/cmp/input';
import {iconPicker, segmentedControl, slider, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {FaviconModel} from '../FaviconModel';
import type {FaviconShape} from '../lib/FaviconSpec';
import {MAX_PADDING, MAX_RADIUS} from '../lib/FaviconSpec';
import {FAVICON_PRESETS} from '../lib/Presets';
import {colorField} from './ColorField';

const SHAPE_OPTIONS: {value: FaviconShape; label: string}[] = [
    {value: 'none', label: 'None'},
    {value: 'square', label: 'Square'},
    {value: 'rounded', label: 'Rounded'},
    {value: 'circle', label: 'Circle'}
];

/** Left-hand column of design controls. */
export const controlsPanel = hoistCmp.factory({
    displayName: 'ControlsPanel',
    model: uses(FaviconModel),
    className: 'tb-favicons-controls',

    render({model, className}) {
        return panel({
            className,
            width: 320,
            flex: 'none',
            scrollable: true,
            item: vbox({
                flex: 'none',
                gap: 8,
                padding: 8,
                items: [
                    presetsCard(),
                    iconCard(),
                    colorsCard(),
                    shapeCard(),
                    transformCard(),
                    appCard()
                ]
            }),
            bbar: [
                span({className: 'tb-favicons-controls__credit', item: 'Font Awesome 7 Pro'}),
                filler(),
                button({
                    text: 'Reset',
                    icon: Icon.reset(),
                    tooltip: 'Restore the default design (keeps your app name)',
                    onClick: () => model.reset()
                })
            ]
        });
    }
});

//------------------
// Cards
//------------------
const presetsCard = hoistCmp.factory({
    model: uses(FaviconModel),
    render({model}) {
        const {presetThumbs, activePresetIdx} = model;
        return controlCard({
            title: 'Presets',
            items: [
                hbox({
                    justifyContent: 'space-between',
                    overflow: 'visible',
                    items: FAVICON_PRESETS.map((p, idx) =>
                        button({
                            key: p.name,
                            className: 'tb-favicons-controls__preset',
                            icon: img({src: presetThumbs[idx], alt: '', width: 28, height: 28}),
                            active: idx === activePresetIdx,
                            tooltip: p.name,
                            'aria-label': `Apply preset ${p.name}`,
                            padding: 3,
                            onClick: () => model.applyPreset(p)
                        })
                    )
                }),
                button({
                    text: 'Surprise me',
                    icon: Icon.random(),
                    intent: 'primary',
                    outlined: true,
                    onClick: () => model.surpriseMe()
                })
            ]
        });
    }
});

const iconCard = hoistCmp.factory({
    model: uses(FaviconModel),
    render({model}) {
        return controlCard({
            title: 'Icon',
            items: [
                iconPicker({
                    value: model.pickerValue,
                    onChange: v => model.setIconFromPicker(v),
                    prefix: model.prefix,
                    enableClear: false,
                    columns: 9,
                    maxMenuHeight: 360,
                    popoverPosition: 'right-top',
                    width: '100%'
                }),
                segmentedControl({
                    value: model.prefix,
                    onChange: v => (model.preferredPrefix = v),
                    options: model.weightOptions,
                    compact: true,
                    fill: true
                })
            ]
        });
    }
});

const colorsCard = hoistCmp.factory({
    model: uses(FaviconModel),
    render({model}) {
        return controlCard({
            title: 'Colors',
            items: [
                hbox({
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    items: [
                        colorField({
                            label: 'Glyph',
                            value: model.fgColor,
                            onChange: v => (model.fgColor = v)
                        }),
                        button({
                            marginBottom: 1,
                            icon: Icon.arrowRightArrowLeft(),
                            tooltip: 'Swap glyph and backdrop colors',
                            onClick: () => model.swapColors()
                        }),
                        colorField({
                            label: 'Backdrop',
                            value: model.bgColor,
                            onChange: v => (model.bgColor = v)
                        })
                    ]
                }),
                hint('Backdrop also colors the touch icon, preloader and manifest.')
            ]
        });
    }
});

const shapeCard = hoistCmp.factory({
    model: uses(FaviconModel),
    render({model}) {
        return controlCard({
            title: 'Shape',
            items: [
                segmentedControl({
                    value: model.shape,
                    onChange: v => model.setShape(v),
                    options: SHAPE_OPTIONS,
                    compact: true,
                    fill: true
                }),
                model.shape === 'rounded'
                    ? fieldRow({
                          label: 'Corner radius',
                          value: `${model.radius}%`,
                          item: rangeSlider({
                              model,
                              bind: 'radius',
                              max: MAX_RADIUS,
                              labelStepSize: 10
                          })
                      })
                    : null,
                fieldRow({
                    label: 'Padding',
                    value: `${model.padding}%`,
                    item: rangeSlider({
                        model,
                        bind: 'padding',
                        max: MAX_PADDING,
                        labelStepSize: 10
                    })
                })
            ]
        });
    }
});

const transformCard = hoistCmp.factory({
    model: uses(FaviconModel),
    render({model}) {
        return controlCard({
            title: 'Transform',
            items: [
                fieldRow({
                    label: 'Rotation',
                    value: `${model.rotation}°`,
                    item: rangeSlider({
                        model,
                        bind: 'rotation',
                        max: 345,
                        stepSize: 15,
                        labelStepSize: 90,
                        labelRenderer: v => `${v}°`
                    })
                }),
                hbox({
                    gap: 8,
                    items: [
                        button({
                            text: 'Flip H',
                            flex: 1,
                            icon: Icon.arrowsLeftRight(),
                            active: model.flipH,
                            outlined: true,
                            onClick: () => (model.flipH = !model.flipH)
                        }),
                        button({
                            text: 'Flip V',
                            flex: 1,
                            icon: Icon.arrowsUpDown(),
                            active: model.flipV,
                            outlined: true,
                            onClick: () => (model.flipV = !model.flipV)
                        })
                    ]
                })
            ]
        });
    }
});

const appCard = hoistCmp.factory({
    model: uses(FaviconModel),
    render({model}) {
        return controlCard({
            title: 'App',
            items: [
                fieldRow({
                    label: 'App name',
                    item: textInput({
                        model,
                        bind: 'appName',
                        commitOnChange: true,
                        placeholder: 'My App',
                        width: '100%'
                    })
                }),
                hint([
                    'Labels the previews and names the download - ',
                    span({className: 'tb-favicons-controls__nowrap', item: model.zipFileName})
                ])
            ]
        });
    }
});

//------------------
// Helpers
//------------------
/**
 * A control-column card, with a consistent gap between its rows. Content overflow stays visible so
 * focus rings and the preset hover lift are not clipped at the card's inner edge.
 */
function controlCard(props: ElementSpec<CardProps>) {
    return card({contentBoxProps: {gap: 8, overflow: 'visible'}, ...props});
}

/**
 * A labelled input row. Sliders pass their current value to show beside the label, rather than
 * over the tick labels.
 */
function fieldRow({label, value, item}: {label: string; value?: string; item: ReactElement}) {
    return vbox({
        gap: 2,
        overflow: 'visible',
        items: [
            hbox({
                className: 'tb-favicons-controls__row-label',
                alignItems: 'baseline',
                items: [
                    span(label),
                    filler(),
                    value ? span({className: 'tb-favicons-controls__row-value', item: value}) : null
                ]
            }),
            item
        ]
    });
}

/** A full-width slider from 0, sized to sit within the controls column. */
function rangeSlider(props: SliderProps) {
    return slider({min: 0, width: '100%', paddingLeft: 10, paddingRight: 14, ...props});
}

function hint(content: ReactNode) {
    return div({className: 'tb-favicons-controls__hint', item: content});
}
