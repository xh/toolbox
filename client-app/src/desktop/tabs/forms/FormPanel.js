import React from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';
import {sampleForm} from '../../common/form/SampleForm';
import './FormPanel.scss';

export const formPanel = hoistCmp.factory({

    render() {
        return wrapper({
            description: [
                <p>
                    Forms provide a standard way for validating and editing data. The <code>Form</code> component
                    provides the ability to centrally control certain properties on all its
                    contained <code>FormField</code>s
                    and bind them to a <code>FormModel</code>. The <code>FormModel</code> provides an observable API
                    for
                    loading, validating, and submitting the data to back-end services.
                </p>
            ],
            links: [
                {url: '$TB/client-app/src/desktop/common/form/SampleForm.js', notes: 'Example Component'},
                {url: '$TB/client-app/src/desktop/common/form/SampleFormModel.js', notes: 'Example Model'},
                {url: '$HR/cmp/form/Form.js', notes: 'Form Component'},
                {url: '$HR/cmp/form/FormModel.js', notes: 'Form Model'},
                {url: '$HR/desktop/cmp/form/FormField.js', notes: 'Form Field'}
            ],
            item: panel({
                title: 'Forms › FormModel',
                icon: Icon.edit(),
                width: 870,
                height: 550,
                item: sampleForm({showOptions: true})
            })
        });
    }
});
