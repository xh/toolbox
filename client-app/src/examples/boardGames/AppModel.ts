import {managed, XH} from '@xh/hoist/core';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {BaseAppModel} from '../../BaseAppModel';
import {BoardGameService} from './BoardGameService';
import {minesweeperPanel} from './minesweeper/MinesweeperPanel';
import {battleshipPanel} from './battleship/BattleshipPanel';
import {Icon} from '@xh/hoist/icon';

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
