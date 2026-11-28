import {grid} from '@xh/hoist/cmp/grid';
import {box, div, filler, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {clipboardButton} from '@xh/hoist/desktop/cmp/clipboard';
import {
    segmentedControl,
    select,
    slider,
    switchInput,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import type {HotkeyConfig} from '@xh/hoist/desktop/hooks';
import {Icon} from '@xh/hoist/icon';
import classNames from 'classnames';
import {toOklch} from './ColorMath';
import {THRESHOLDS} from './ContrastPairs';
import './ThemeTuner.scss';
import type {WatchRow} from './ThemeTunerModel';
import {fmtRatio, ThemeTunerModel} from './ThemeTunerModel';
import type {RoundTheme, TunerOption, TunerSeed} from './TunerRounds';
import {roundAppliesTo} from './TunerRounds';

/**
 * Docked panel for the theme tuner. Renders nothing until the tuner is opened.
 */
export const themeTunerPanel = hoistCmp.factory({
    displayName: 'ThemeTunerPanel',
    model: uses(ThemeTunerModel),

    render({model}) {
        if (!model.open) return null;

        return panel({
            model: model.panelModel,
            className: 'tb-tuner',
            title: 'Theme Tuner',
            icon: Icon.magic(),
            compactHeader: true,
            headerItems: [
                button({
                    icon: Icon.close(),
                    minimal: true,
                    tooltip: 'Close. Tuned values stay applied.',
                    onClick: () => (model.open = false)
                })
            ],
            hotkeys: hotkeys(model),
            tbar: toolbar({
                compact: true,
                children: [
                    segmentedControl({
                        bind: 'showTuned',
                        compact: true,
                        options: [
                            {value: false, label: 'All shipped'},
                            {value: true, label: 'All tuned'}
                        ]
                    }),
                    span({
                        className: 'tb-tuner__key',
                        title: 'Press X to turn every pick off or on at once',
                        children: 'X'
                    }),
                    span({className: 'xh-text-color-muted', children: 'key flips'}),
                    filler(),
                    segmentedControl({
                        bind: 'view',
                        compact: true,
                        options: [
                            {value: 'rounds', label: 'Rounds'},
                            {value: 'contrast', label: 'Contrast'},
                            {value: 'vars', label: 'Vars'},
                            {value: 'export', label: 'Export'}
                        ]
                    })
                ]
            }),
            children: viewContent()
        });
    }
});

const viewContent = hoistCmp.factory<ThemeTunerModel>(({model}) => {
    switch (model.view) {
        case 'contrast':
            return contrastView();
        case 'vars':
            return varsView();
        case 'export':
            return exportView();
        default:
            return roundsView();
    }
});

//------------------------------------------------------------------
// Rounds
//------------------------------------------------------------------
const THEME_LABELS: Record<RoundTheme, string> = {light: 'Light', dark: 'Dark', both: 'Both'};

const roundsView = hoistCmp.factory<ThemeTunerModel>(({model}) => {
    const {activeRound: round, rounds, activeRoundIdx, activeOption, picks} = model,
        wrongTheme = !roundAppliesTo(round, model.theme);

    return panel({
        className: 'tb-tuner__rounds',
        tbar: toolbar({
            compact: true,
            children: [
                button({
                    icon: Icon.chevronLeft(),
                    tooltip: 'Previous round  [',
                    onClick: () => model.stepRound(-1)
                }),
                select({
                    flex: 1,
                    value: round.id,
                    enableFilter: false,
                    options: rounds.map((it, i) => ({
                        value: it.id,
                        label: `${i + 1}. ${THEME_LABELS[it.theme]} - ${it.title}${picks[it.id] ? '  ✓' : ''}`
                    })),
                    onChange: id => model.activateRound(id)
                }),
                button({
                    icon: Icon.chevronRight(),
                    tooltip: 'Next round  ]',
                    onClick: () => model.stepRound(1)
                })
            ]
        }),
        bbar: toolbar({
            compact: true,
            children: [
                button({
                    text: 'Apply all recommended',
                    icon: Icon.magic(),
                    tooltip: 'Pick the recommended option in every round, for both themes.',
                    onClick: () => model.applyRecommended()
                }),
                filler(),
                button({
                    text: 'Reset',
                    icon: Icon.reset(),
                    disabled: !model.hasChanges,
                    onClick: () => confirmReset(model)
                })
            ]
        }),
        children: div({
            className: 'tb-tuner__scroll',
            children: [
                div({
                    className: 'tb-tuner__eyebrow',
                    children: `Round ${activeRoundIdx + 1} of ${rounds.length} · ${round.theme === 'both' ? 'both themes' : round.theme + ' theme'}`
                }),
                div({className: 'tb-tuner__title', children: round.title}),
                div({className: 'tb-tuner__why', children: round.why}),
                div({
                    className: 'tb-tuner__look',
                    children: [Icon.eye(), span(round.lookAt)]
                }),
                wrongTheme
                    ? button({
                          text: `Switch to the ${round.theme} theme`,
                          icon: round.theme === 'dark' ? Icon.moon() : Icon.sun(),
                          outlined: true,
                          onClick: () => XH.toggleTheme()
                      })
                    : vbox({
                          className: 'tb-tuner__options',
                          children: [
                              optionCard({
                                  idx: 0,
                                  label: 'Shipped, this round only',
                                  note: 'No pick for this round. Your picks in other rounds stay on.',
                                  selected: !activeOption,
                                  onClick: () => model.pickByIndex(0)
                              }),
                              ...round.options.map((option: TunerOption, i) =>
                                  optionCard({
                                      key: option.id,
                                      idx: i + 1,
                                      label: option.label,
                                      note: option.note,
                                      recommended: option.recommended,
                                      selected: activeOption === option,
                                      onClick: () => model.pickByIndex(i + 1)
                                  })
                              )
                          ]
                      }),
                watchTable({omit: wrongTheme}),
                seedSliders({omit: wrongTheme})
            ]
        })
    });
});

const optionCard = hoistCmp.factory(({idx, label, note, recommended, selected, onClick}) =>
    hbox({
        className: classNames('tb-tuner__option', selected && 'tb-tuner__option--selected'),
        onClick,
        children: [
            span({className: 'tb-tuner__key', children: idx + 1}),
            vbox({
                flex: 1,
                children: [
                    hbox({
                        alignItems: 'baseline',
                        children: [
                            span({className: 'tb-tuner__option-label', children: label}),
                            span({
                                omit: !recommended,
                                className: 'tb-tuner__badge',
                                children: 'recommended'
                            })
                        ]
                    }),
                    span({className: 'tb-tuner__option-note', children: note})
                ]
            }),
            selected ? Icon.check({prefix: 'fas', intent: 'primary'}) : null
        ]
    })
);

const watchTable = hoistCmp.factory<ThemeTunerModel>(({model}) => {
    const {watchRows} = model;
    if (!watchRows.length) return null;
    return div({
        className: 'tb-tuner__watch',
        children: [
            div({
                className: 'tb-tuner__watch-row tb-tuner__watch-row--head',
                children: [span('Contrast'), span('Was'), span('Now'), span('Needs')]
            }),
            ...watchRows.map((row: WatchRow) => {
                const target = THRESHOLDS[row.kind],
                    grade = target == null ? 'info' : row.tuned.ratio >= target ? 'pass' : 'fail';
                return div({
                    key: row.label,
                    className: 'tb-tuner__watch-row',
                    children: [
                        span(row.label),
                        span(fmtRatio(row.shipped.ratio)),
                        span({
                            className: `tb-tuner__ratio tb-tuner__ratio--${grade}`,
                            children: fmtRatio(row.tuned.ratio)
                        }),
                        span(target == null ? '-' : `${target}:1`)
                    ]
                });
            })
        ]
    });
});

const seedSliders = hoistCmp.factory<ThemeTunerModel>(({model}) => {
    const seeds = model.activeSeeds;
    if (!seeds.length) return null;
    return vbox({
        className: 'tb-tuner__seeds',
        children: seeds.map((seed: TunerSeed) => {
            const value = model.seedValue(seed);
            return vbox({
                key: seed.name,
                children: [
                    hbox({
                        title: seed.help,
                        children: [
                            span({className: 'tb-tuner__seed-label', children: seed.label}),
                            filler(),
                            span({className: 'tb-tuner__seed-value', children: value}),
                            button({
                                icon: Icon.reset(),
                                minimal: true,
                                tooltip: 'Reset this slider',
                                disabled: !model.seedIsTweaked(seed),
                                onClick: () => model.resetSeed(seed)
                            })
                        ]
                    }),
                    slider({
                        value,
                        min: seed.min,
                        max: seed.max,
                        stepSize: seed.step,
                        labelRenderer: false,
                        width: '100%',
                        onChange: v => model.setSeed(seed, v)
                    })
                ]
            });
        })
    });
});

function confirmReset(model: ThemeTunerModel) {
    XH.confirm({
        title: 'Reset the tuner?',
        message: 'This clears every pick and direct edit, for both themes.',
        confirmProps: {text: 'Reset', intent: 'danger'},
        onConfirm: () => model.resetAll()
    });
}

//------------------------------------------------------------------
// Contrast
//------------------------------------------------------------------
const contrastView = hoistCmp.factory<ThemeTunerModel>(({model}) =>
    panel({
        tbar: toolbar({
            compact: true,
            children: [
                span({
                    className: 'tb-tuner__hint',
                    children: `${model.theme} theme · WCAG 2.2 AA`
                }),
                filler(),
                switchInput({bind: 'failsOnly', label: 'Fails only', labelSide: 'left'})
            ]
        }),
        children: grid({model: model.contrastGridModel})
    })
);

//------------------------------------------------------------------
// Vars
//------------------------------------------------------------------
const varsView = hoistCmp.factory<ThemeTunerModel>(({model}) =>
    panel({
        tbar: toolbar({
            compact: true,
            children: [
                select({
                    flex: 1,
                    placeholder: 'Edit any color var...',
                    value: model.editVar,
                    options: model.allColorVars,
                    enableWindowed: true,
                    onChange: name => model.selectVar(name)
                })
            ]
        }),
        children: [grid({model: model.varsGridModel, flex: 1}), varEditor()]
    })
);

const varEditor = hoistCmp.factory<ThemeTunerModel>(({model}) => {
    const {editVar, editColor, editValue, editIsTweaked} = model;
    if (!editVar || !editColor) {
        return div({
            className: 'tb-tuner__editor tb-tuner__hint',
            children: 'Select a var to edit it for the current theme.'
        });
    }

    const lch = toOklch(editColor),
        channel = (key: 'l' | 'c' | 'h', label: string, max: number, step: number) =>
            hbox({
                alignItems: 'center',
                children: [
                    span({className: 'tb-tuner__channel-label', children: label}),
                    slider({
                        flex: 1,
                        value: Math.min(max, lch[key] ?? 0),
                        min: 0,
                        max,
                        stepSize: step,
                        labelRenderer: false,
                        onChange: v => model.setEditChannel(key, v)
                    }),
                    span({
                        className: 'tb-tuner__seed-value',
                        children: (lch[key] ?? 0).toFixed(key === 'h' ? 0 : 3)
                    })
                ]
            });

    return vbox({
        className: 'tb-tuner__editor',
        children: [
            hbox({
                alignItems: 'center',
                children: [
                    box({className: 'tb-tuner__chip', style: {background: editValue}}),
                    span({className: 'tb-tuner__editor-name', children: editVar}),
                    filler(),
                    button({
                        text: 'Clear edit',
                        icon: Icon.reset(),
                        minimal: true,
                        disabled: !editIsTweaked,
                        onClick: () => model.clearEdit()
                    })
                ]
            }),
            textInput({
                value: editValue,
                width: '100%',
                commitOnChange: false,
                placeholder: 'Any CSS color, e.g. oklch(0.55 0.02 232)',
                onCommit: v => model.setEditValue(v)
            }),
            channel('l', 'L', 1, 0.005),
            channel('c', 'C', 0.3, 0.002),
            channel('h', 'H', 360, 1)
        ]
    });
});

//------------------------------------------------------------------
// Export
//------------------------------------------------------------------
const exportView = hoistCmp.factory<ThemeTunerModel>(({model}) =>
    panel({
        tbar: toolbar({
            compact: true,
            children: [
                span({
                    className: 'tb-tuner__hint',
                    children: 'Changed vars for styles/vars.scss, both themes.'
                }),
                filler(),
                clipboardButton({
                    text: 'Copy',
                    getCopyText: () => model.exportText,
                    successMessage: 'Export copied to clipboard.'
                })
            ]
        }),
        children: div({className: 'tb-tuner__export', children: model.exportText})
    })
);

function hotkeys(model: ThemeTunerModel): HotkeyConfig[] {
    const group = 'Theme Tuner';
    return [
        ...[0, 1, 2, 3, 4, 5].map(idx => ({
            combo: String(idx + 1),
            label: idx === 0 ? 'Show shipped values for the round' : `Pick option ${idx + 1}`,
            group,
            global: true,
            onKeyDown: () => model.pickByIndex(idx)
        })),
        {
            combo: 'x',
            label: 'Flip the whole theme between shipped and tuned',
            group,
            global: true,
            onKeyDown: () => (model.showTuned = !model.showTuned)
        },
        {
            combo: '[',
            label: 'Previous round',
            group,
            global: true,
            onKeyDown: () => model.stepRound(-1)
        },
        {
            combo: ']',
            label: 'Next round',
            group,
            global: true,
            onKeyDown: () => model.stepRound(1)
        }
    ];
}
