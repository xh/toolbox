import {grid} from '@xh/hoist/cmp/grid';
import {box, filler, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';

import {BattleshipModel, BOARD_WIDTH, BOARD_HEIGHT} from './BattleshipModel';
import './Battleship.scss';

export const battleshipPanel = hoistCmp.factory({
    model: creates(BattleshipModel),

    render({model}) {
        const {playerGridModel, attackGridModel} = model;
        return panel({
            className: 'battleship-game-panel',
            tbar: tbar(),
            item: box({
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                item: vbox({
                    className: 'battleship-boards',
                    alignItems: 'center',
                    width: '100%',
                    items: [
                        span({item: 'Enemy Waters', className: 'battleship-board-label'}),
                        attackGridModel
                            ? grid({
                                  model: attackGridModel,
                                  className: 'battleship-board',
                                  width: BOARD_WIDTH,
                                  height: BOARD_HEIGHT
                              })
                            : null,
                        playerGridModel
                            ? grid({
                                  model: playerGridModel,
                                  className: 'battleship-board',
                                  width: BOARD_WIDTH,
                                  height: BOARD_HEIGHT,
                                  agOptions: {
                                      onCellMouseOver: ({data, column}) => {
                                          if (!data || !column) return;
                                          const col = column.getColId();
                                          if (!col.startsWith('c')) return;
                                          model.setHoverCell(
                                              data.data.row,
                                              parseInt(col.substring(1))
                                          );
                                      },
                                      onCellMouseOut: () => model.clearHoverCell(),
                                      onCellContextMenu: ({event}) => {
                                          event.preventDefault();
                                          if (model.phase === 'placement')
                                              model.toggleShipOrientation();
                                      }
                                  }
                              })
                            : null,
                        span({item: 'Your Fleet', className: 'battleship-board-label'})
                    ]
                })
            }),
            bbar: bbar()
        });
    }
});

const tbar = hoistCmp.factory<BattleshipModel>(({model}) =>
    toolbar(
        button({
            text: 'New Game',
            icon: Icon.refresh(),
            intent: 'success',
            onClick: () => model.newGame()
        }),
        toolbarSep(),
        span({item: model.phaseText, style: {fontWeight: 'bold'}}),
        span({
            item: '\u2013 Right-click to rotate ship',
            omit: model.phase !== 'placement',
            className: 'xh-text-color-muted'
        })
    )
);

const bbar = hoistCmp.factory<BattleshipModel>(({model}) => {
    const shipStatus = (ships, label) =>
        span({
            item: `${label}: ${ships.filter(s => !s.isSunk).length}/${ships.length} afloat`,
            style: {marginRight: 16}
        });

    return toolbar(
        shipStatus(model.playerShips, 'Your fleet'),
        toolbarSep(),
        shipStatus(model.aiShips, 'Enemy fleet'),
        filler()
    );
});
