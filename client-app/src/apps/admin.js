import {XH} from 'hoist/core';
import {App} from 'hoist/admin/App';
import {AppModel} from '../admin/AppModel';
import '../desktop/App.scss';

XH.renderApp(AppModel, App);
