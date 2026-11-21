import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import type {LoadSpec} from '@xh/hoist/core';
import {numberRenderer} from '@xh/hoist/format';
import {bindable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {summarizeLlmUse} from './llmSpend';

/** One day's use of the Claude API relay, per user and app, from `LLM` track entries. */
export class LlmSpendModel extends HoistModel {
    /** The app day to show. */
    @bindable accessor day: LocalDate = LocalDate.currentAppDay();

    @managed gridModel = new GridModel({
        store: {idSpec: 'id'},
        sortBy: 'tokens|desc',
        showSummary: 'bottom',
        emptyText: 'No assistant calls on this day.',
        enableExport: true,
        exportOptions: {filename: 'llm-spend'},
        columns: [
            {field: 'username', headerName: 'User', width: 160},
            {field: 'app', width: 180},
            {field: 'calls', ...count()},
            {field: 'failed', ...count()},
            {field: 'refused', ...count()},
            {field: 'inputTokens', headerName: 'Input', ...count()},
            {field: 'outputTokens', headerName: 'Output', ...count()},
            {field: 'cacheTokens', headerName: 'Cache', ...count()},
            {field: 'tokens', headerName: 'Total tokens', ...count(), width: 120}
        ]
    });

    constructor() {
        super();
        this.addReaction({track: () => this.day, run: () => this.refreshAsync()});
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {day} = this,
            logs = await XH.postJson(
                {
                    url: 'trackLogAdmin',
                    body: {
                        startDay: day,
                        endDay: day,
                        maxRows: 50000,
                        filters: {field: 'category', op: '=', value: 'LLM'}
                    }
                },
                {loadSpec}
            );
        if (loadSpec.isStale) return;
        this.gridModel.loadData(summarizeLlmUse(logs));
    }
}

function count() {
    return {
        width: 90,
        align: 'right' as const,
        renderer: numberRenderer({precision: 0}),
        aggregator: 'SUM'
    };
}
