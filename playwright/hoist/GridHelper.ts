import {Page} from '@playwright/test';
import {HoistPage} from './HoistPage';
import {PlainObject} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {StoreRecordId} from '@xh/hoist/data';
import {RecordQuery} from './Types';

export class GridHelper {
    constructor(
        private readonly hoistPage: HoistPage,
        private readonly testId: string
    ) {}

    async getRecordCount() {
        return this.page.evaluate<number, string>(testId => {
            return window.XH.getModelByTestId<GridModel>(testId).store.count;
        }, this.testId);
    }

    async ensureRecordCount(count: number) {
        const gridCount = await this.getRecordCount();
        if (gridCount !== count)
            throw new Error(`Found ${gridCount} records when ${count} is expected`);
    }

    /**
     * Returns the data for the first record matching the given query.
     */
    async getRecordData(q: RecordQuery): Promise<PlainObject> {
        const id: StoreRecordId = this.isStoreRecordId(q) ? q : await this.getRecordId(q);

        return this.page.evaluate<PlainObject, [string, StoreRecordId]>(
            ([testId, id]) => {
                return window.XH.getModelByTestId<GridModel>(testId).store.getById(id).data;
            },
            [this.testId, id]
        );
    }

    async getRecordId(data: PlainObject): Promise<StoreRecordId> {
        return this.page.evaluate<StoreRecordId, [string, PlainObject]>(
            ([testId, data]) => {
                const rec = window.XH.getModelByTestId<GridModel>(testId).store.allRecords.find(
                    rec => rec.matchesData(data)
                );
                if (!rec) throw new Error(`Unable to find record matching ${JSON.stringify(data)}`);
                return rec.id;
            },
            [this.testId, data]
        );
    }

    async getAgId(q: RecordQuery): Promise<string> {
        const id: StoreRecordId = this.isStoreRecordId(q) ? q : await this.getRecordId(q);
        return this.page.evaluate<string, [string, StoreRecordId]>(
            ([testId, id]) => {
                return window.XH.getModelByTestId<GridModel>(testId).store.getById(id).agId;
            },
            [this.testId, id]
        );
    }

    /** Select a grid row programmatically, via the GridModel (as opposed to clicking on the row). */
    async selectRow(q: RecordQuery) {
        const id: StoreRecordId = this.isStoreRecordId(q) ? q : await this.getRecordId(q);

        await this.page.evaluate<void, [string, StoreRecordId]>(
            async ([testId, id]) => {
                const gridModel = window.XH.getModelByTestId<GridModel>(testId),
                    record = gridModel.store.getById(id);
                await gridModel.selectAsync(record);
            },
            [this.testId, id]
        );
    }

    async clickRow(q: RecordQuery) {
        const agId = await this.getAgId(q);
        await this.page.getByTestId(this.testId).locator(`div[row-id="${agId}"]`).click();
    }

    async dblClickRow(q: RecordQuery) {
        const agId = await this.getAgId(q);
        await this.page.getByTestId(this.testId).locator(`div[row-id="${agId}"]`).dblclick();
    }

    //------------------
    // Implementation
    //------------------
    private get page(): Page {
        return this.hoistPage.page;
    }

    private isStoreRecordId(q): q is StoreRecordId {
        return typeof q === 'string' || typeof q === 'number';
    }
}
