import {HoistModel, managed, TaskObserver, XH} from '@xh/hoist/core';
import {bindable, when} from '@xh/hoist/mobx';
import {GridModel} from '@xh/hoist/cmp/grid';
import {createObservableRef} from '@xh/hoist/utils/react';
import {HoistInputModel} from '@xh/hoist/cmp/input';
import {isEmpty, last} from 'lodash';
import {wait} from '@xh/hoist/promise';
import {actionCol} from '@xh/hoist/desktop/cmp/grid';
import {Icon} from '@xh/hoist/icon';

export class ChatModel extends HoistModel {
    @bindable inputMsg: string;
    @bindable showFunctionEditor: boolean = false;

    @bindable showUserMessageHistory = false;
    @managed userHistoryGridModel: GridModel;

    taskObserver = TaskObserver.trackLast({message: 'Generating...'});

    inputRef = createObservableRef();
    get input(): HoistInputModel {
        return this.inputRef?.current as HoistInputModel;
    }

    scrollRef = createObservableRef<HTMLElement>();

    constructor() {
        super();

        this.userHistoryGridModel = this.createUsersHistoryGridModel();

        this.addReaction(
            {
                track: () => [XH.chatGptService.messages, this.scrollRef.current],
                run: () => this.scrollMessages()
            },
            {
                track: () => XH.pageIsActive,
                run: isActive => {
                    if (isActive) this.focusInput();
                }
            },
            {
                track: () => XH.chatGptService.userMessageHistory,
                run: msgs => {
                    this.userHistoryGridModel.loadData(msgs.map(message => ({message})));
                },
                fireImmediately: true
            }
        );

        when(
            () => !!this.input,
            () => this.focusInput()
        );
    }

    //------------------
    // Component logic
    //------------------
    async submitAsync() {
        const {inputMsg, taskObserver} = this;
        if (!inputMsg) return;

        try {
            await XH.chatGptService.sendChatAsync(inputMsg).linkTo(taskObserver);
            // await wait(1000).linkTo(taskObserver);
            this.inputMsg = '';
            this.focusInput();
        } catch (e) {
            XH.handleException(e, {alertType: 'toast'});
        }
    }

    onInputKeyDown(e: KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            this.submitAsync();
        } else if (e.key === 'ArrowUp' && !this.inputMsg) {
            const {userMessages} = XH.chatGptService;
            if (!isEmpty(userMessages)) {
                const lastMsg = last(userMessages).content;
                this.inputMsg = lastMsg;
                wait().then(() => {
                    this.input.inputEl.selectionStart = lastMsg.length;
                    this.input.inputEl.selectionEnd = lastMsg.length;
                });
            }
        }
    }

    async clearAndReInitAsync() {
        await XH.chatGptService.clearAndReInitAsync();
        XH.toast({message: 'Chat history cleared.', position: 'top'});
        this.focusInput();
    }

    //------------------
    // Implementation
    //------------------
    focusInput() {
        wait(300).then(() => {
            this.input?.focus();
        });
    }

    scrollMessages() {
        wait(500).then(() => {
            this.scrollRef.current?.scrollIntoView({behavior: 'auto'});
        });
    }

    createUsersHistoryGridModel() {
        return new GridModel({
            store: {
                idSpec: XH.genId
            },
            emptyText: 'No messages yet...',
            hideHeaders: true,
            stripeRows: true,
            rowBorders: true,
            columns: [
                {field: 'message', flex: 1},
                {
                    ...actionCol,
                    actions: [
                        {
                            icon: Icon.x(),
                            intent: 'danger',
                            actionFn: ({record}) => {
                                XH.chatGptService.removeFromMessageHistory(record.data.message);
                            }
                        }
                    ]
                }
            ],
            onCellClicked: ({data: record, column}) => {
                if (column.colId === 'message') {
                    this.showUserMessageHistory = false;
                    this.inputMsg = record.data.message;
                    this.focusInput();
                }
            }
        });
    }
}
