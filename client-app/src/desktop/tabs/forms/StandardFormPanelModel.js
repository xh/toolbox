import {HoistModel} from '@xh/hoist/core';
import {setter, observable} from '@xh/hoist/mobx';
import {usStates} from '../../../data';

@HoistModel()
export class StandardFormPanelModel {
    @setter @observable state = null;
    options = usStates;
}