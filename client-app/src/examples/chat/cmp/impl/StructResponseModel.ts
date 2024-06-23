import {HoistModel, lookup, PlainObject, XH} from '@xh/hoist/core';
import {ChatModel} from '../ChatModel';
import {GptMessage} from '../../../../core/svc/ChatGptService';
import {GridModel} from '@xh/hoist/cmp/grid';
import {bindable} from '@xh/hoist/mobx';
import {forOwn, isEmpty, isNil, isNumber, orderBy, take} from 'lodash';
import {numberRenderer} from '@xh/hoist/format';
import {mktValCol, pnlCol} from '../../../../core/columns';

export class StructResponseModel extends HoistModel {
    @lookup(ChatModel) chatModel: ChatModel;

    get selectedMsg(): GptMessage {
        return this.chatModel?.selectedMsg;
    }

    get shouldDisplay() {
        return this.selectedMsg?.function_call != null;
    }

    get title() {
        return this.shouldDisplay
            ? this.chatModel.userPromptForSelectedMsg?.content ??
                  this.selectedMsg?.function_call?.name
            : null;
    }

    override onLinked() {
        this.addReaction({
            track: () => this.selectedMsg,
            run: () => this.onMsgChangeAsync(),
            fireImmediately: true
        });
    }

    // Set based on data extracted from selectedMsg
    @bindable.ref gridModel: GridModel;
    @bindable.ref data: PlainObject[];

    async onMsgChangeAsync() {
        const {selectedMsg} = this;

        XH.safeDestroy(this.gridModel);
        this.gridModel = null;

        if (!selectedMsg) {
        } else {
            const data = await this.getDataAsync(selectedMsg),
                gridModel = this.createGridModel(data, selectedMsg);

            gridModel?.loadData(data);

            XH.safeDestroy(this.gridModel);
            this.data = data;
            this.gridModel = gridModel;
        }
    }

    async getDataAsync(msg: GptMessage) {
        const {function_call} = msg;
        if (!function_call) return null;

        let data;
        switch (function_call.name) {
            case 'getPortfolioPositions':
                data = await this.getPortfolioPositionsAsync(msg);
                break;
            default:
                throw XH.exception(`Unsupported function call: ${function_call.name}`);
        }

        const args = this.getArgs(msg);
        console.log(args);
        console.log(data);
        if (args.maxRows && data.length > args.maxRows) {
            console.log(`truncating to ${args.maxRows} rows`);
            if (args.sortBy) {
                const sortFieldAndDir = args.sortBy.split('|');
                data = orderBy(data, [sortFieldAndDir[0]], [sortFieldAndDir[1]]);
            }

            data = take(data, args.maxRows);
        }

        return data;
    }

    async getPortfolioPositionsAsync(msg: GptMessage) {
        const args = this.getArgs(msg),
            {groupByDimensions} = args;
        return XH.portfolioService.getPositionsAsync(groupByDimensions, false);
    }

    createGridModel(data: PlainObject[], msg: GptMessage) {
        if (isEmpty(data)) return null;

        try {
            const args = this.getArgs(msg),
                columns = [],
                skippedKeys = ['children', 'id'];

            forOwn(data[0], (value, key) => {
                if (!skippedKeys.includes(key)) {
                    const isNum = this.isNumberField(data, key),
                        colDef = this.cols[key] ?? {};

                    columns.push({
                        field: {name: key, type: isNum ? 'number' : 'auto'},
                        isTreeColumn: key === 'name',
                        renderer: isNum ? numberRenderer() : null,
                        ...colDef
                    });
                }
            });

            return new GridModel({
                autosizeOptions: {mode: 'managed'},
                store: {idSpec: XH.genId},
                treeMode: data[0].hasOwnProperty('children'),
                sortBy: args.sortBy ?? 'name',
                columns
            });
        } catch (e) {
            XH.handleException(e);
            return null;
        }
    }

    // Rough heuristic - doesn't attempt to recurse into children, etc.
    isNumberField(data: PlainObject[], key: string) {
        return data.every(it => isNil(it[key]) || isNumber(it[key]));
    }

    getArgs(msg: GptMessage): PlainObject {
        return JSON.parse(msg.function_call.arguments);
    }

    cols = {
        pnl: pnlCol,
        mktVal: mktValCol
    };
}
