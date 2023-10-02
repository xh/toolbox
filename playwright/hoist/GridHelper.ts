import {Page} from '@playwright/test';
import {HoistPage} from './HoistPage';
import {PlainObject} from '@xh/hoist/core';

export class GridHelper {
    constructor(
        private readonly hoistPage: HoistPage,
        private readonly testId: string
    ) {}

    get page(): Page {
        return this.hoistPage.page;
    }

    async getRecordCount() {
        return this.page.evaluate(testId =>  window.XH.getActiveModelByTestId(testId).store.count, this.testId);
    }

    async ensureCount(count: number) {
        const gridCount = await this.getRecordCount();
        if (gridCount !== count)
            throw new Error(`Found ${gridCount} records when ${count} is expected`);
    }

    async getRowData(recordIdQuery: RecordIdQuery): Promise<PlainObject> {
        if ('id' in recordIdQuery) {
            return this.page.evaluate(
                ([testId, id]) => window.XH.getActiveModelByTestId(testId).store.getById(id).data,
                [this.testId, recordIdQuery.id]
            );
        } else {
            return this.page.evaluate(
                ([testId, agId]) =>
                    window.XH.getActiveModelByTestId(testId).store.allRecords.find(
                        it => it.agId === agId
                    ).data,
                [this.testId, recordIdQuery.agId]
            );
        }
    }

    async getRowAgId(query: RecordQuery): Promise<string> {
        if ('agId' in query) return query.agId;
        return 'id' in query
            ? this.page.evaluate(
                  ([testId, id]) => window.XH.getActiveModelByTestId(testId).getById(id).agId,
                  [this.testId, query.id]
              )
            : this.page.evaluate(
                  ([testId, recordData]) =>
                      window.XH.getActiveModelByTestId(testId).store.allRecords.find(({data}) =>
                          _.isMatch(data, recordData)
                      ).agId,
                  [this.testId, query.recordData] as const
              );
    }

    async getRowId(query: RecordQuery): Promise<number|string> {
        if ('id' in query) return query.id;
        return 'agId' in query
            ? this.page.evaluate(
                  ([testId, agId]) =>
                      window.XH.getActiveModelByTestId(testId).store.allRecords.find(
                          it => it.agId === agId
                      ).id,
                  [this.testId, query.agId]
              )
            : this.page.evaluate(
                  ([testId, recordData]) =>
                      window.XH.getActiveModelByTestId(testId).store.allRecords.find(({data}) =>
                          _.isMatch(data, recordData)
                      ).id,
                  [this.testId, query.recordData] as const
              );
    }

    // select row with GridModel
    async selectRow(query: RecordQuery) {
        const id = await this.getRowId(query);
        this.page.evaluate(
            ([testId, id]) => {
                const gridModel = window.XH.getActiveModelByTestId(testId),
                    record = gridModel.store.getById(id);
                gridModel.selectAsync(record);
            },
            [this.testId, id]
        );
    }

    // Functions to click / double click on grid row
    async clickRow(query: RecordQuery) {
        const agId = await this.getRowAgId(query);
        await this.page.getByTestId(this.testId).locator(`div[row-id="${agId}"]`).click();
    }

    async dblClickRow(query: RecordQuery) {
        const agId = await this.getRowAgId(query);
        await this.page.getByTestId(this.testId).locator(`div[row-id="${agId}"]`).dblclick();
    }
}

type RecordQuery = RecordIdQuery | RecordDataQuery;
type RecordIdQuery = IdQuery | AgIdQuery;

interface IdQuery {
    id: string | number;
}
interface AgIdQuery {
    agId: string;
}
interface RecordDataQuery {
    recordData: PlainObject;
}
