import {HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable, observable} from '@xh/hoist/mobx';

export class DetailsPanelModel extends HoistModel {

    @bindable.ref
    currentRecord;

    @bindable
    profilePictureURL

    @observable
    profilePicture

    constructor() {
        super();
        makeObservable(this);
    }

}
