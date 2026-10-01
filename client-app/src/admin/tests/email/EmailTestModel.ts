import {FormModel} from '@xh/hoist/cmp/form';
import type {PlainObject} from '@xh/hoist/core';
import {HoistModel, managed, TaskObserver, XH} from '@xh/hoist/core';
import {bindable, observableRef, runInAction} from '@xh/hoist/mobx';
import {isNil, pickBy} from 'lodash';

/**
 * Drives Admin > Tests > Email - a form that posts to `EmailTestController.send`, which forwards
 * the args to `EmailService.sendEmail` as a Map. Blank form values are omitted from the posted
 * args, so a default is exercised by leaving its field empty, not by clearing it to `''`.
 */
export class EmailTestModel extends HoistModel {
    @managed formModel = new FormModel({
        fields: [
            {name: 'to', initialValue: XH.getUser().email},
            {name: 'cc'},
            {name: 'bcc'},
            {name: 'from'},
            {name: 'subject', initialValue: 'Toolbox email test'},
            {name: 'bodyType', initialValue: 'html'},
            {name: 'body', initialValue: '<p>Hello from the <b>Toolbox</b> email test page.</p>'},
            {name: 'attachmentType', initialValue: null},
            {name: 'markImportant', initialValue: false},
            {name: 'async', initialValue: false}
        ]
    });

    sendTask = TaskObserver.trackLast();

    /** Response from the last send - success flag, echoed args, and any error. */
    @observableRef accessor sendResult: PlainObject = null;

    /** Current xhEmail* configs, raw and as parsed by EmailService. */
    @observableRef accessor configs: PlainObject = null;

    @bindable accessor parseInput = ' a, ,b@c.com,,';
    @observableRef accessor parseResult: PlainObject = null;

    override async doLoadAsync() {
        const configs = await XH.fetchJson({url: 'emailTest/configs'});
        runInAction(() => (this.configs = configs));
    }

    async sendAsync() {
        const args = this.buildArgs();

        const sendResult = await XH.postJson({url: 'emailTest/send', body: args}).linkTo(
            this.sendTask
        );
        runInAction(() => (this.sendResult = sendResult));
        if (sendResult.success) {
            XH.successToast('sendEmail returned without error - check the mail and server log.');
        } else {
            XH.dangerToast(`${sendResult.error}: ${sendResult.message}`);
        }
    }

    async parseAddressesAsync() {
        const parseResult = await XH.fetchJson({
            url: 'emailTest/parseAddresses',
            params: {value: this.parseInput ?? ''}
        });
        runInAction(() => (this.parseResult = parseResult));
    }

    //------------------------
    // Implementation
    //------------------------
    private buildArgs(): PlainObject {
        const {bodyType, body, ...rest} = this.formModel.getData();
        return {
            ...pickBy(rest, v => !isNil(v) && v !== ''),
            ...(isNil(body) ? {} : {[bodyType]: body})
        };
    }
}
