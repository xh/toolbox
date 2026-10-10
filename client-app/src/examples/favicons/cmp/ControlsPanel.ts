import {div, filler, hbox, img, span} from '@xh/hoist/cmp/layout';
import type {ReactElement, ReactNode} from 'react';
import {elementFactory, hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import type {SliderProps} from '@xh/hoist/desktop/cmp/input';
import {iconPicker, segmentedControl, slider, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import classNames from 'classnames';
import {FaviconModel} from '../FaviconModel';
import type {FaviconShape} from '../lib/FaviconSpec';
import {MAX_PADDING, MAX_RADIUS} from '../lib/FaviconSpec';
import {FAVICON_PRESETS} from '../lib/Presets';
import {colorField} from './ColorField';

const nativeButton = elementFactory('button');

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
            width: 300,
            flex: 'none',
            scrollable: true,
            items: [
                presetsSection(),
                iconSection(),
                colorsSection(),
                shapeSection(),
                transformSection(),
                appSection()
            ],
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
// Sections
//------------------
const presetsSection = hoistCmp.factory({
    model: uses(FaviconModel),
    render({model}) {
        const {presetThumbs, activePresetIdx} = model;
        return section({
            title: 'Presets',
            headerItem: button({
                className: 'tb-favicons-controls__surprise',
                text: 'Surprise me',
                icon: Icon.random(),
                intent: 'primary',
                onClick: () => model.surpriseMe()
            }),
            items: div({
                className: 'tb-favicons-controls__presets',
                items: FAVICON_PRESETS.map((p, idx) =>
                    nativeButton({
                        key: p.name,
                        type: 'button',
                        className: classNames(
                            'tb-favicons-controls__preset',
                            idx === activePresetIdx && 'tb-favicons-controls__preset--active'
                        ),
                        title: p.name,
                        'aria-label': `Apply preset ${p.name}`,
                        onClick: () => model.applyPreset(p),
                        item: img({src: presetThumbs[idx], alt: '', width: 28, height: 28})
                    })
                )
            })
        });
    }
});

const iconSection = hoistCmp.factory({
    model: uses(FaviconModel),
    render({model}) {
        return section({
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

const colorsSection = hoistCmp.factory({
    model: uses(FaviconModel),
    render({model}) {
        return section({
            title: 'Colors',
            items: [
                hbox({
                    className: 'tb-favicons-controls__colors',
                    items: [
                        colorField({
                            label: 'Glyph',
                            value: model.fgColor,
                            onChange: v => (model.fgColor = v)
                        }),
                        button({
                            className: 'tb-favicons-controls__swap',
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

const shapeSection = hoistCmp.factory({
    model: uses(FaviconModel),
    render({model}) {
        return section({
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
                    ? sliderRow({
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
                sliderRow({
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

const transformSection = hoistCmp.factory({
    model: uses(FaviconModel),
    render({model}) {
        return section({
            title: 'Transform',
            items: [
                sliderRow({
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
                    className: 'tb-favicons-controls__flips',
                    items: [
                        button({
                            text: 'Flip H',
                            icon: Icon.arrowsLeftRight(),
                            active: model.flipH,
                            outlined: true,
                            onClick: () => (model.flipH = !model.flipH)
                        }),
                        button({
                            text: 'Flip V',
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

const appSection = hoistCmp.factory({
    model: uses(FaviconModel),
    render({model}) {
        return section({
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
                hint(`Labels the previews and names the download - ${model.zipFileName}`)
            ]
        });
    }
});

//------------------
// Helpers
//------------------
function section({
    title,
    headerItem,
    items
}: {
    title: string;
    headerItem?: ReactElement;
    items: ReactNode;
}) {
    return div({
        className: 'tb-favicons-controls__section',
        items: [
            hbox({
                className: 'tb-favicons-controls__section-header',
                items: [span(title), filler(), headerItem]
            }),
            ...(Array.isArray(items) ? items : [items])
        ]
    });
}

function fieldRow({label, value, item}: {label: string; value?: string; item: ReactElement}) {
    return div({
        className: 'tb-favicons-controls__row',
        items: [
            hbox({
                className: 'tb-favicons-controls__row-label',
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

/** A labelled slider row - the current value shows beside the label, not over the tick labels. */
function sliderRow(args: {label: string; value: string; item: ReactElement}) {
    return fieldRow(args);
}

/** A full-width slider from 0, sized to sit within the controls column. */
function rangeSlider(props: SliderProps) {
    return slider({min: 0, width: '100%', paddingLeft: 10, paddingRight: 14, ...props});
}

function hint(text: string) {
    return div({className: 'tb-favicons-controls__hint', item: text});
}
