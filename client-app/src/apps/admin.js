import {XH} from '@xh/hoist/core';
import {App} from '@xh/hoist/admin/App';
import {AppModel} from '../admin/AppModel';
import '../desktop/App.scss';

XH.renderApp(AppModel, App);
