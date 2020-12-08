import {HoistModel, managed} from '@xh/hoist/core';
import {FormModel, lengthIs, required} from '@xh/hoist/cmp/form';
import {bindable} from '@xh/hoist/mobx';
import {createObservableRef} from '@xh/hoist/utils/react';
// import {wait} from '@xh/hoist/promise';
import {movies} from '../../core/data';

@HoistModel
export class FormPageModel {

    @bindable minimal;
    @bindable readonly;

    fieldRefsArray = [];
    fieldRefsObj = {};
    lastFocused = null;

    @managed
    formModel = new FormModel({
        fields: [
            {name: 'name', rules: [required, lengthIs({min: 8})]},
            {name: 'movie', rules: [required]},
            {name: 'salary'},
            {name: 'date', rules: [required]},
            {name: 'included'},
            {name: 'enabled'},
            {name: 'buttonGroup', initialValue: 'button2'},
            {name: 'notes'},
            {name: 'searchQuery', displayName: 'Search'}
        ]
    });

    movies = movies;


    constructor() {
        this.fieldRefsArray = this.formModel.fieldList.map(it => {
            this.fieldRefsObj[it.name] = createObservableRef();
            return this.fieldRefsObj[it.name];
        });

        this.addReaction({
            track: () => {
                const focused = this.fieldRefsArray.find(it => it.current?.hasFocus);
                console.log(focused);
                return focused?.current;
            },
            run: (inputModel) => {
                if (inputModel) this.lastFocused = inputModel;
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

        const el = this.implementedRefs[next].current;
        el.focus();
        el.select ? el.select() : null;

        // a little blink effect to observe/test blur
        // wait(500).then(() => {
        //     if (el.blur && this.lastFocused === el) {
        //         el.blur();
        //         wait(1000).then(() => {
        //             if (this.lastFocused === el) {
        //                 el.focus();
        //                 el.select ? el.select() : null;
        //             }
        //         });
        //     }
        // });
    }

    get focusedInputIdx() {
        return this.implementedRefs.findIndex(it => it.current === this.lastFocused);
    }

    get implementedRefs() {
        return this.fieldRefsArray.filter(it => it.current);
    }
}