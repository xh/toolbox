import {initTestAppAsync} from '@xh/hoist/test-support';
import {map} from 'lodash';
import {beforeAll, describe, expect, it, onTestFinished} from 'vitest';
import {GridHelperModel} from './GridHelperModel';
import {GRID_HELPER_SUGGESTIONS, matchGridActions} from './gridHelperScript';

/**
 * The Grid Helper tab's scripted helper must turn the phrases it knows into `gridTools` calls
 * that change the grid, answer anything else with help and no change, and leave each reply's
 * changes undoable.
 */
describe('Grid Helper', () => {
    beforeAll(async () => {
        await initTestAppAsync();
    });

    it('maps each phrase to its grid tool, in the order the message asks', () => {
        const actions = matchGridActions('Sort by market value, then group by sector');

        expect(map(actions, 'toolName')).toEqual(['sort_grid', 'group_grid']);
    });

    it('offers suggestions that each take a scripted path', () => {
        GRID_HELPER_SUGGESTIONS.forEach(it => expect(matchGridActions(it)).not.toHaveLength(0));
    });

    it('groups and sorts the grid from one message, under one Undo', async () => {
        const {gridModel, chatModel} = createModel();

        await chatModel.sendAsync('Group by sector and sort by market value');

        expect(gridModel.groupBy).toEqual(['sector']);
        expect(gridModel.sortBy.map(it => it.toString())).toEqual(['marketValue|desc']);
        expect(chatModel.lastMessage.text).toContain('Each sector is now a group');

        await chatModel.undoTurnAsync(chatModel.lastMessage.id);

        expect(gridModel.groupBy).toEqual([]);
        expect(gridModel.sortBy.map(it => it.toString())).toEqual(['symbol|asc']);
    });

    it('filters the grid to one sector', async () => {
        const {gridModel, chatModel} = createModel();

        await chatModel.sendAsync('Show only technology');

        expect(gridModel.store.count).toBe(5);
        expect(gridModel.store.allCount).toBe(17);
    });

    it('hides a column', async () => {
        const {gridModel, chatModel} = createModel();

        await chatModel.sendAsync('Hide the price column');

        expect(gridModel.isColumnVisible('price')).toBe(false);
    });

    it('answers anything else with help, and changes nothing', async () => {
        const {gridModel, chatModel} = createModel(),
            columnState = gridModel.columnState;

        await chatModel.sendAsync('How do I filter this?');

        expect(gridModel.columnState).toEqual(columnState);
        expect(chatModel.lastMessage.toolCalls).toHaveLength(0);
        expect(chatModel.lastMessage.text).toContain(
            '[Column filtering](/app/grids/columnFiltering)'
        );
    });
});

function createModel() {
    const model = new GridHelperModel();
    onTestFinished(() => model.destroy());
    return {gridModel: model.gridModel, chatModel: model.assistantModel.chatModel};
}
