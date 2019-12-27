import React from 'react';
import {hoistCmp} from '@xh/hoist/core';

import {wrapper} from '../../common';
import {formPanel} from './FormPanel';


export const FormPanelWrapper = hoistCmp({
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
                {url: '$TB/client-app/src/desktop/tabs/forms/FormPanel.js', notes: 'This example.'},
                {url: '$HR/cmp/form/Form.js', notes: 'Form Component'},
                {url: '$HR/cmp/form/FormModel.js', notes: 'Form Model'},
                {url: '$HR/desktop/cmp/form/FormField.js', notes: 'Form Field'}
            ],
            item: formPanel()
        });
    }
});

