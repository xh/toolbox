import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as T} from 'react-view';
import {Select} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {hoistCmp} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';

import {inputTestPanel} from '../InputTestPanel';
import {box, div, hbox, p} from '@xh/hoist/cmp/layout';

export const selectQueryPanel = hoistCmp.factory({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        description:
            [
                p('A managed wrapper around the React-Select combobox/dropdown component.'),
                p('This example is configured to for asynchronous queries.')
            ],
        componentName: 'Select',
        props: {
            autoFocus: {
                value: false,
                type: T.Boolean,
                description: 'True to focus the control on render.',
                hidden: true
            },
            createMessageFn: {
                value: null,
                type: T.Function,
                description:
                    'Function to return a "create a new option" string prompt. Requires `allowCreate` true. \n' +
                    'Passed current query input.',
                hidden: true
            },
            enableClear: {
                value: null,
                type: T.Boolean,
                description: 'True to show a "clear" button at the right of the control.  Defaults to false.'
            },
            enableCreate: {
                value: null,
                type: T.Boolean,
                description: 'True to accept and commit input values not present in options or returned by a query.'
            },
            enableMulti: {
                value: false,
                type: T.Boolean,
                description: 'True to allow entry/selection of multiple values - "tag picker" style.'
            },
            hideSelectedOptionCheck: {
                value: null,
                type: T.Boolean,
                description: 'True to suppress the default check icon rendered for the currently selected option.'
            },
            labelField: {
                value: 'company',
                type: T.String,
                description: 'Field on provided options for sourcing each option\'s display text (default `label`).',
                hidden: true
            },
            loadingMessageFn: {
                value: null,
                type: T.Function,
                description: 'Function to return loading message during an async query. Passed current query input.',
                hidden: true
            },
            menuPlacement: {
                value: 'auto',
                type: T.Enum,
                enumName: 'positions',
                options: positions,
                description: 'Placement of the dropdown menu relative to the input control.'
            },
            noOptionsMessageFn: {
                value: null,
                type: T.Function,
                description: 'Function to return message indicating no options loaded. Passed current query input.',
                hidden: true
            },
            openMenuOnFocus: {
                value: null,
                type: T.Boolean,
                description: 'True to auto-open the dropdown menu on input focus.'
            },
            optionRenderer: {
                value: `(opt) => customerOption({opt})`,
                type: T.Function,
                description:
                    'Function to render options in the dropdown list. Called for each option object (which ' +
                    'will contain at minimum a value and label field, as well as any other fields present in ' +
                    'the source objects). Returns a React.node.'
            },
            placeholder: {
                value: 'Search customers...',
                type: T.String,
                description: 'Text to display when control is empty.'
            },
            queryBuffer: {
                value: null,
                type: T.Number,
                description: 'Delay (in ms) to buffer calls to the async queryFn. Defaults to 300.'
            },
            queryFn: {
                value:
                    '(query) => XH.fetchJson({\n' +
                    '    url: \'customer\',\n' +
                    '    params: {query}\n' +
                    '})',
                type: T.Function,
                description:
                    'Async function to return a list of options for a given query string input.\n' +
                    'Replaces the `options` prop - use one or the other.'
            },
            rsOptions: {
                value: null,
                type: T.Object,
                description:
                    'Escape-hatch props passed directly to react-select. Use with care - not all props ' +
                    'in the react-select API are guaranteed to be supported by this Hoist component, ' +
                    'and providing them directly can interfere with the implementation of this class.',
                hidden: true
            },
            selectOnFocus: {
                value: false,
                type: T.Boolean,
                description: 'True to select contents when control receives focus.'
            },
            valueField: {
                value: 'id',
                type: T.String,
                description: 'Field on provided options for sourcing each option\'s value (default `value`).',
                hidden: true
            }
        },
        scope: {
            Select,
            positions,
            XH,
            customerOption,
            Promise,
            hbox,
            box,
            div
        }
    });
}

const positions = {
    auto: 'auto',
    top: 'top',
    bottom: 'bottom'
};

const customerOption = ({opt}) => {
    return hbox({
        items: [
            box({
                item: opt.isActive ?
                    Icon.checkCircle({className: 'xh-green'}) :
                    Icon.x({className: 'xh-red'}),
                width: 32,
                paddingLeft: 8
            }),
            div(
                opt.company,
                div({
                    className: 'xh-text-color-muted xh-font-size-small',
                    item: `${opt.city} · ID: ${opt.id}`
                })
            )
        ],
        alignItems: 'center'
    });
};
