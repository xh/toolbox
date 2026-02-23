import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {managed, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';

import {BaseAppModel} from '../../BaseAppModel';
import {battleshipPanel} from './battleship/BattleshipPanel';
import {BoardGameService} from './BoardGameService';
import {minesweeperPanel} from './minesweeper/MinesweeperPanel';

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    @managed
    tabContainerModel = new TabContainerModel({
        tabs: [
            {
                id: 'minesweeper',
                title: 'Minesweeper',
                icon: Icon.skull(),
                content: minesweeperPanel
            },
            {
                id: 'battleship',
                title: 'Battleship',
                icon: Icon.target(),
                content: battleshipPanel
            }
        ]
    });

    override async initAsync() {
        await super.initAsync();
        await XH.installServicesAsync(BoardGameService);
    }
}
