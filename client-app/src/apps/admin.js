import ReactDOM from 'react-dom';
import {appContainer} from 'hoist/app';
import {app} from 'hoist/admin/App';

import {AppModel} from '../admin/AppModel';
import '../desktop/App.scss';

const model = new AppModel();
ReactDOM.render(appContainer(app({model})), document.getElementById('root'));
