import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core/index';
import {vbox, box} from '@xh/hoist/cmp/layout/index';

@HoistComponent()
class NewsPanelItem extends Component {

    render() {
        const request = this.props.record,
            {title, url} = request;
        console.log("Rendering")

        return 'hello';

    }
}

export const newsPanelItem = elemFactory(newsPanelItem);
