import {Icon} from '@xh/hoist/icon';
import {ReactElement} from 'react';

export type InputCategory = 'Text & Code' | 'Numeric' | 'Date & Time' | 'Choice' | 'Boolean';

/** Index section order - the types of value a `HoistInput` binds. */
export const INPUT_CATEGORIES: InputCategory[] = [
    'Text & Code',
    'Numeric',
    'Date & Time',
    'Choice',
    'Boolean'
];

export interface InputCatalogEntry {
    /** Component name - also the index tile title. */
    name: string;
    /** Set for `HoistInput`s, which the All Inputs index groups by value type. */
    category?: InputCategory;
    /** One-line description shown on the index tile. */
    description: string;
    /** Route of the Toolbox page that demos this input. Related inputs can share a page. */
    route: string;
    /** Icon for the page's rail header. */
    icon: () => ReactElement;
}

const R = 'default.forms';

/**
 * Every desktop `HoistInput`, in index order within its category - the single source of truth for
 * the All Inputs index and the per-input page headers. Membership is the contract itself: the
 * component takes a `bind` and can sit inside a `FormField`.
 */
export const INPUT_CATALOG: InputCatalogEntry[] = [
    {
        name: 'TextInput',
        category: 'Text & Code',
        description: 'Single-line text, with icons, clear and password modes.',
        route: `${R}.textInput`,
        icon: () => Icon.penToSquare()
    },
    {
        name: 'TextArea',
        category: 'Text & Code',
        description: 'Multi-line text with fixed or flexing height.',
        route: `${R}.textArea`,
        icon: () => Icon.fileText()
    },
    {
        name: 'JsonInput',
        category: 'Text & Code',
        description: 'CodeMirror editor with JSON linting and formatting.',
        route: `${R}.codeInputs`,
        icon: () => Icon.json()
    },
    {
        name: 'CodeInput',
        category: 'Text & Code',
        description: 'Base editor for code, with search and fullscreen.',
        route: `${R}.codeInputs`,
        icon: () => Icon.code()
    },
    {
        name: 'NumberInput',
        category: 'Numeric',
        description: 'Formatted numbers, shorthand units, scale factors.',
        route: `${R}.numberInput`,
        icon: () => Icon.calculator()
    },
    {
        name: 'Slider',
        category: 'Numeric',
        description: 'Single or range values with label renderers.',
        route: `${R}.slider`,
        icon: () => Icon.gauge()
    },
    {
        name: 'DateInput',
        category: 'Date & Time',
        description: 'Date and time picker, Date or LocalDate valued.',
        route: `${R}.dateInput`,
        icon: () => Icon.calendar()
    },

    {
        name: 'Select',
        category: 'Choice',
        description: 'Combobox with async queries, create and grouping.',
        route: `${R}.select`,
        icon: () => Icon.list()
    },
    {
        name: 'Picker',
        category: 'Choice',
        description: 'Compact popover trigger for tight toolbars.',
        route: `${R}.picker`,
        icon: () => Icon.selectDropdown()
    },
    {
        name: 'SegmentedControl',
        category: 'Choice',
        description: 'Small mutually-exclusive set, fills or hugs.',
        route: `${R}.segmentedControl`,
        icon: () => Icon.options()
    },
    {
        name: 'ButtonGroupInput',
        category: 'Choice',
        description: 'Buttons as a value, with icons and intents.',
        route: `${R}.buttonGroupInput`,
        icon: () => Icon.gridPanel()
    },
    {
        name: 'RadioInput',
        category: 'Choice',
        description: 'Stacked or inline radios, per-option disabling.',
        route: `${R}.radioInput`,
        icon: () => Icon.checkCircle()
    },
    {
        name: 'IntentInput',
        category: 'Choice',
        description: 'Swatch picker for the four Hoist intents.',
        route: `${R}.intentInput`,
        icon: () => Icon.tags()
    },
    {
        name: 'Checkbox',
        category: 'Boolean',
        description: 'Boolean toggle, optional indeterminate state.',
        route: `${R}.toggles`,
        icon: () => Icon.checkSquare()
    },
    {
        name: 'CheckboxButton',
        category: 'Boolean',
        description: 'Button-shaped boolean, sized for toolbars.',
        route: `${R}.toggles`,
        icon: () => Icon.checkSquare()
    },
    {
        name: 'SwitchInput',
        category: 'Boolean',
        description: 'Switch with label on either side.',
        route: `${R}.toggles`,
        icon: () => Icon.checkSquare()
    }
];

/**
 * Related controls that take their own model rather than a `bind`. Not `HoistInput`s, so they stay
 * out of the All Inputs index and are listed by their own gallery instead.
 */
export const OTHER_CONTROLS: InputCatalogEntry[] = [
    {
        name: 'DateRangePicker',
        description: 'Range selection with presets, lookbacks and custom dates.',
        route: `${R}.dateRangePicker`,
        icon: () => Icon.calendarRange()
    },
    {
        name: 'LeftRightChooser',
        description: 'Move items between two grouped lists.',
        route: `${R}.leftRightChooser`,
        icon: () => Icon.arrowsLeftRight()
    },
    {
        name: 'FileChooser',
        description: 'Drag-and-drop or browse for local files.',
        route: `${R}.fileChooser`,
        icon: () => Icon.copy()
    }
];

/** Lookup by component name - throws on a typo so a page cannot silently detach from the index. */
export function inputEntry(name: string): InputCatalogEntry {
    const ret = [...INPUT_CATALOG, ...OTHER_CONTROLS].find(it => it.name === name);
    if (!ret) throw new Error(`Unknown control '${name}' - add it to a catalog in this file.`);
    return ret;
}
