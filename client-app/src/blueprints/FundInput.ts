import type {VariableInputProps} from '@xh/hoist-chat-kit/blueprint';
import {filler, hbox, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import type {HoistProps, LoadSpec} from '@xh/hoist/core';
import {select} from '@xh/hoist/desktop/cmp/input';
import {fmtBillions} from '@xh/hoist/format';
import {observableRef, runInAction} from '@xh/hoist/mobx';

export interface FundOption {
    value: string;
    label: string;
    aum: number;
}

export class FundInputModel extends HoistModel {
    @observableRef accessor options: FundOption[] = [];

    override async doLoadAsync(loadSpec: LoadSpec) {
        const funds: {name: string; aum: number}[] = await XH.fetchJson(
            {url: 'blueprints/funds'},
            {loadSpec}
        );
        runInAction(() => {
            this.options = funds.map(({name, aum}) => ({value: name, label: name, aum}));
        });
    }
}

interface FundInputProps extends HoistProps<FundInputModel>, VariableInputProps {}

/** Prompt input for a `fund` variable: each fund with its AUM. Cleared means all funds. */
export const fundInput = hoistCmp.factory<FundInputProps>({
    displayName: 'FundInput',
    model: creates(FundInputModel),

    render({model, value, onCommit}) {
        return select({
            value,
            onCommit: v => onCommit(v ?? null),
            options: model.options,
            optionRenderer: (opt: FundOption) =>
                hbox({
                    width: '100%',
                    children: [
                        span(opt.label),
                        filler(),
                        span({
                            className: 'xh-text-color-muted',
                            children: fmtBillions(opt.aum, {precision: 2, label: true})
                        })
                    ]
                }),
            enableClear: true,
            placeholder: 'All funds',
            width: 240
        });
    }
});
