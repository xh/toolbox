import {div} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, LoadSpec, XH} from '@xh/hoist/core';
import {numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {errorMessage} from '@xh/hoist/mobile/cmp/error';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {capitalize} from 'lodash';
import {Position} from '../../../core/svc/PortfolioService';

export const treeGridDetailPage = hoistCmp.factory<TreeGridDetailPageModel>({
    model: creates(() => TreeGridDetailPageModel),
    render({model}) {
        const {position, lastLoadException} = model;

        return panel({
            title: renderPageTitle(position),
            icon: Icon.portfolio(),
            className: 'tb-detail-page',
            item: lastLoadException
                ? errorMessage({error: lastLoadException})
                : renderPosition(position),
            mask: 'onLoad'
        });
    }
});

function renderPageTitle(position: Position) {
    if (!position) return null;
    const lastPart = position.id.split('>>').pop();
    return lastPart.split(':').pop();
}

function renderPosition(position: Position) {
    if (!position) return null;
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
        className: 'tb-detail-row',
        items: [div(title), div(renderer ? renderer(value) : value)]
    });
}

class TreeGridDetailPageModel extends HoistModel {
    @bindable.ref position: Position;

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

    override async doLoadAsync(loadSpec: LoadSpec) {
        this.position = await (this.id ? XH.portfolioService.getPositionAsync(this.id) : null);
    }
}
