import ReactDOM from 'react-dom';
import {appContainer} from 'hoist/app';
import {app} from '../desktop/App';
import {AppModel} from '../desktop/AppModel';

const model = new AppModel();
ReactDOM.render(appContainer(app({model})), document.getElementById('root'));