import {expect, Page} from '@playwright/test';
import {HoistPage} from './HoistPage';
import {PlainObject} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {StoreRecordId} from '@xh/hoist/data';
import {RecordQuery} from './Types';
import {isNil} from 'lodash';

export class GridHelper {
    constructor(
        private readonly hoistPage: HoistPage,
        private readonly testId: string
    ) {}

    //-------------------------
    // Locator-based helpers
    //-------------------------
    async clickRow(q: RecordQuery) {
        const agId = await this.getAgId(q);
        await this.page
            .getByTestId(this.testId)
            .locator(`div[row-id="${agId}"]`)
            .click();
    }

    async dblClickRow(q: RecordQuery) {
        const agId = await this.getAgId(q);
        await this.page
            .getByTestId(this.testId)
            .locator(`div[row-id="${agId}"]`)
            .dblclick();
    }

    //-------------------------
    // Model-based helpers
    //-------------------------
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

    async getRecordData(q: RecordQuery): Promise<PlainObject> {
        const id: StoreRecordId = this.isStoreRecordId(q) ? q : await this.getRecordId(q);

        return this.page.evaluate<PlainObject, [string, StoreRecordId]>(
            ([testId, id]) => {
                return window.XH.getModelByTestId<GridModel>(testId).store.getById(id).data;
            },
            [this.testId, id]
        );
    }

    async getRecordId(
        data: PlainObject,
        {strict = true}: {strict?: boolean} = {}
    ): Promise<StoreRecordId> {
        const id = this.page.evaluate<StoreRecordId, [string, PlainObject]>(
            ([testId, data]) => {
                const rec = window.XH
                    .getModelByTestId<GridModel>(testId)
                    .store.allRecords.find(rec => rec.matchesData(data));
                return rec?.id;
            },
            [this.testId, data]
        );
        if (strict && isNil(id)) {
            throw new Error(`Unable to find record matching ${JSON.stringify(data)}`);
        }
        return id;
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

    async selectRow(q: RecordQuery) {
        const id: StoreRecordId = this.isStoreRecordId(q) ? q : await this.getRecordId(q);

        await this.page.evaluate<void, [string, StoreRecordId]>(
            async ([testId, id]) => {
                const gridModel = window.XH.getModelByTestId<GridModel>(testId),
                    record = gridModel.store.getById(id);
                if (!record) throw new Error(`Record with id ${id} not found`);
                await gridModel.selectAsync(record);
            },
            [this.testId, id]
        );

        if (!(await this.isRowSelected(q))) {
            throw new Error(`Failed to select row matching ${JSON.stringify(q)}`);
        }
    }

    async expectRowSelected(q: RecordQuery, opts?: PlainObject) {
        return expect.poll(() => this.isRowSelected(q, opts)).toBeTruthy();
    }

    async isRowSelected(q: RecordQuery, {strict = true}: {strict?: boolean} = {}) {
        const id: StoreRecordId = this.isStoreRecordId(q)
            ? q
            : await this.getRecordId(q, {strict});
        if (isNil(id)) return null;

        const selectedIds = await this.getSelectedRowIds();
        if (strict) {
            return selectedIds.length === 1 && selectedIds[0] === id;
        }
        return selectedIds.includes(id);
    }

    async getSelectedRowIds() {
        return this.page.evaluate<StoreRecordId[], string>(async testId => {
            const gridModel = window.XH.getModelByTestId<GridModel>(testId);
            return gridModel.selectedIds;
        }, this.testId);
    }

    //------------------
    // Implementation
    //------------------
    private get page(): Page {
        return this.hoistPage.page;
    }

    private isStoreRecordId(q: RecordQuery): q is StoreRecordId {
        return typeof q === 'string' || typeof q === 'number';
    }
}
