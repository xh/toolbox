import {HoistModel, XH} from '@xh/hoist/core';
import {FormModel} from '@xh/hoist/cmp/form';
import {bindable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {createObservableRef} from '@xh/hoist/utils/react';
import moment from 'moment';
import {random} from 'lodash';

@HoistModel
export class InputsPanelModel {

    @bindable commitOnChange = false;

    fieldRefsArray = [];
    fieldRefsObj = {};
    focused = null;

    formModel = new FormModel({
        fields: [
            {name: 'text1'},
            {name: 'text2'},
            {name: 'text3'},
            {name: 'text4'},
            {name: 'text5'},
            {name: 'text6'},
            {name: 'number1'},
            {name: 'number2'},
            {name: 'number3', initialValue: random(0, 100)},
            {name: 'number4'},
            {name: 'range1', initialValue: [random(50000, 70000), random(110000, 150000)]},
            {name: 'option1', initialValue: 'CA'},
            {name: 'option2'},
            {name: 'option3'},
            {name: 'option4'},
            {name: 'option5'},
            {name: 'option6'},
            {name: 'date1'},
            {name: 'date2', initialValue: moment().startOf('hour').toDate()},
            {name: 'localDate', initialValue: LocalDate.today()},
            {name: 'bool1'},
            {name: 'bool2'},
            {name: 'buttonGroup1', initialValue: 'button2'}
        ]
    });

    constructor() {
        this.fieldRefsArray = this.formModel.fieldList.map(it => {
            this.fieldRefsObj[it.name] = createObservableRef();
            return this.fieldRefsObj[it.name];
        });

        this.addReaction({
            track: () => {
                const focused = this.fieldRefsArray.find(it => it.current?.hasFocus);
                return focused?.current;
            },
            run: (inputModel) => {
                if (inputModel) this.focused = inputModel;
            }
        });
    }

    focus(incr) {
        const last = this.implementedRefs.length - 1,
            idx = this.focusedInputIdx;
        let next = idx > -1 ? idx + incr : 0;

        if ((idx === 0 && incr === -1) || (idx === last && incr === 1)) {
            next = idx;
        }

        this.implementedRefs[next].current.focus();
    }

    get focusedInputIdx() {
        return this.implementedRefs.findIndex(it => it.current === this.focused);
    }

    queryCustomersAsync(query) {
        return XH.fetchJson({
            url: 'customer',
            params: {query}
        });
    }

    get implementedRefs() {
        return this.fieldRefsArray.filter(it => it.current);
    }
}