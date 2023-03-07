import {hoistCmp, HoistModel, creates, XH} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {numberRenderer} from '@xh/hoist/format';
import {capitalize} from 'lodash';
import {Icon} from '@xh/hoist/icon';
import {observable, makeObservable, runInAction} from '@xh/hoist/mobx';

export const treeGridDetailPage = hoistCmp.factory({
    model: creates(() => TreeGridDetailPageModel),
    render({model}) {
        const {position} = model;

        return panel({
            title: position ? renderPageTitle(position) : null,
            icon: Icon.portfolio(),
            mask: 'onLoad',
            className: 'toolbox-detail-page',
            item: position ? renderPosition(position) : null
        });
    }
});

function renderPageTitle(position) {
    const lastPart = position.id.split('>>').pop();
    return lastPart.split(':').pop();
}

function renderPosition(position) {
    return div(
        // Split id to extract drilldown information
        ...position.id.split('>>').map(it => {
            if (it === 'root') return null;
            const parts = it.split(':');
            return renderRow(capitalize(parts[0]), parts[1]);
        }),

        renderRow('Market Value', position.mktVal, numberRenderer({precision: 0, ledger: true})),
        renderRow(
            'P&L',
            position.pnl,
            numberRenderer({precision: 0, ledger: true, colorSpec: true})
        )
    );
}

function renderRow(title, value, renderer?) {
    return div({
        className: 'toolbox-detail-row',
        items: [div(title), div(renderer ? renderer(value) : value)]
    });
}

class TreeGridDetailPageModel extends HoistModel {
    @observable.ref position;

    get id() {
        return decodeURIComponent(this.componentProps.id);
    }

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        this.addReaction({
            track: () => this.id,
            run: () => this.loadAsync()
        });
    }

    override async doLoadAsync(loadSpec) {
        const position = await (this.id ? XH.portfolioService.getPositionAsync(this.id) : null);
        runInAction(() => (this.position = position));
    }
}
