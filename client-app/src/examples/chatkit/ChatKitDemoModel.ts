import {ChatModel} from '@xh/hoist-chat-kit/core';
import {HoistModel, managed} from '@xh/hoist/core';
import type {ChatKitDemo} from './demos/Types';

/** One demo conversation: its definition and the ChatModel that runs it. */
export class ChatKitDemoModel extends HoistModel {
    readonly demo: ChatKitDemo;

    @managed readonly chatModel: ChatModel;

    get id(): string {
        return this.demo.id;
    }

    constructor(demo: ChatKitDemo) {
        super();
        this.demo = demo;
        this.chatModel = new ChatModel(demo.createChatConfig());
    }
}
