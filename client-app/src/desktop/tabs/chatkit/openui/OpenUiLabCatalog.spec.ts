// The lab's catalog is the one place a component is added. These check that a component listed
// there reaches the model's prompt, which is what makes that a one-line change.
import {describe, expect, it} from 'vitest';
import {createOpenUiLabCatalog} from './OpenUiLabCatalog';

describe('createOpenUiLabCatalog', () => {
    const catalog = createOpenUiLabCatalog();

    it('teaches the model a signature for every component, with the stack as the root', () => {
        const {instructions} = catalog;
        [
            'Stack',
            'Tabs',
            'Section',
            'Divider',
            'Text',
            'Callout',
            'Badges',
            'Metrics',
            'KeyValues',
            'List',
            'Progress',
            'Steps',
            'Grid',
            'Chart',
            'Treemap',
            'Card',
            'DataGrid',
            'DataChart'
        ].forEach(name => expect(instructions).toContain(`${name}(`));
        expect(instructions).toContain('root = Stack(');
    });

    it('teaches the model a signature for the form, the button and every input', () => {
        const {instructions} = catalog;
        [
            'Form',
            'Button',
            'TextInput',
            'TextArea',
            'NumberInput',
            'Select',
            'DateInput',
            'Checkbox',
            'Switch',
            'SegmentedControl',
            'RadioGroup',
            'Slider'
        ].forEach(name => expect(instructions).toContain(`${name}(`));
    });

    it('delivers UI as reply text only, with no catalog tools for the model to call', () => {
        expect(catalog.toToolSchemas()).toEqual([]);
    });
});
