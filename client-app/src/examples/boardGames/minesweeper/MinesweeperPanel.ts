import {grid} from '@xh/hoist/cmp/grid';
import {box, filler, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {DIFFICULTY_OPTIONS, MinesweeperModel} from './MinesweeperModel';
import './Minesweeper.scss';

export const minesweeperPanel = hoistCmp.factory({
    model: creates(MinesweeperModel),

    render({model}) {
        const {gridModel, boardWidth, boardHeight} = model;
        return panel({
            className: 'minesweeper-game-panel',
            tbar: tbar(),
            item: gridModel
                ? box({
                      flex: 1,
                      item: grid({
                          model: gridModel,
                          className: 'minesweeper-board',
                          width: boardWidth,
                          height: boardHeight
                      })
                  })
                : null,
            bbar: bbar()
        });
    }
});

const tbar = hoistCmp.factory<MinesweeperModel>(({model}) =>
    toolbar(
        select({
            bind: 'difficulty',
            options: DIFFICULTY_OPTIONS,
            enableFilter: false,
            width: 260
        }),
        button({
            text: 'New Game',
            icon: Icon.refresh(),
            intent: 'success',
            onClick: () => model.newGame()
        }),
        toolbarSep(),
        Icon.flag({className: 'xh-red'}),
        span({
            item: ` ${model.minesRemaining}`,
            style: {minWidth: 30}
        }),
        filler(),
        Icon.clock(),
        span({
            item: ` ${model.formattedTime}`,
            style: {minWidth: 50, fontFamily: 'monospace'}
        })
    )
);

const bbar = hoistCmp.factory<MinesweeperModel>(({model}) =>
    toolbar(
        span({item: model.statusText}),
        filler(),
        span({
            item: 'Shift+click or Ctrl+click to flag',
            className: 'xh-text-color-muted'
        })
    )
);
