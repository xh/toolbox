import {grid} from '@xh/hoist/cmp/grid';
import {box, filler, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {times} from 'lodash';
import {DIFFICULTY_OPTIONS, GRID_SIZE_OPTIONS, MODE_OPTIONS, SudokuModel} from './SudokuModel';
import './Sudoku.scss';

export const sudokuPanel = hoistCmp.factory({
    model: creates(SudokuModel),

    render({model}) {
        const {gridModel, boardWidth, boardHeight, n} = model;
        return panel({
            className: 'sudoku-game-panel',
            tbar: tbar(),
            item: gridModel
                ? box({
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      item: hbox({
                          alignItems: 'start',
                          gap: 12,
                          items: [
                              grid({
                                  model: gridModel,
                                  className: 'sudoku-board',
                                  width: boardWidth,
                                  height: boardHeight
                              }),
                              numberPalette({n})
                          ]
                      })
                  })
                : null,
            bbar: bbar()
        });
    }
});

const tbar = hoistCmp.factory<SudokuModel>(({model}) =>
    toolbar(
        select({bind: 'gameMode', options: MODE_OPTIONS, enableFilter: false, width: 100}),
        select({
            bind: 'gridSizeKey',
            options: GRID_SIZE_OPTIONS,
            enableFilter: false,
            width: 90
        }),
        select({
            bind: 'difficulty',
            options: DIFFICULTY_OPTIONS,
            enableFilter: false,
            width: 120,
            omit: model.gameMode === 'create'
        }),
        button({
            text: 'New Game',
            icon: Icon.refresh(),
            intent: 'success',
            onClick: () => model.newGame()
        }),
        button({
            text: 'Lock & Solve',
            icon: Icon.lock(),
            intent: 'primary',
            omit: model.gameMode !== 'create' || model.createPhase !== 'entering',
            onClick: () => model.lockPuzzle()
        }),
        filler(),
        Icon.clock(),
        span({
            item: ` ${model.formattedTime}`,
            style: {minWidth: 50, fontFamily: 'monospace'}
        })
    )
);

const numberPalette = hoistCmp.factory<SudokuModel>(({model, n}) =>
    vbox({
        className: 'sudoku-palette',
        items: [
            ...times(n as number, i =>
                button({
                    text: String(i + 1),
                    onClick: () => model.handleNumberInput(i + 1),
                    disabled: !model.isEditable
                })
            ),
            button({
                icon: Icon.delete(),
                onClick: () => model.clearCell(),
                disabled: !model.isEditable
            })
        ]
    })
);

const bbar = hoistCmp.factory<SudokuModel>(({model}) =>
    toolbar(
        span({item: model.statusText}),
        filler(),
        span({item: model.inputHint, className: 'xh-text-color-muted'})
    )
);
