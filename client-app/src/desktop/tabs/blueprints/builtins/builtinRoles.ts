import type {BlueprintRegistry} from '@xh/hoist-chat-kit/blueprint';
import {registryEntries} from '../../../../blueprints/registry/registryEntries';
import {INPUTS_OVERVIEW} from './builtinExamples';

/** A Built-ins page: the widgets of one or more registry categories. */
export interface BuiltinRole {
    key: string;
    title: string;
    categories: string[];
    description: string;
    /** The Concepts page that explains the role. */
    concept: string;
}

export const BUILTIN_ROLES: BuiltinRole[] = [
    {
        key: 'layout',
        title: 'Layout',
        categories: ['container', 'layout'],
        description:
            'Containers that hold and place other widgets, and the pieces that space them.',
        concept: 'layout'
    },
    {
        key: 'input',
        title: 'Input',
        categories: ['input'],
        description: 'Controls that set a variable, which the rest of the blueprint reads.',
        concept: 'variables'
    },
    {
        key: 'data',
        title: 'Data',
        categories: ['data'],
        description: 'Widgets that read a source and draw its rows: grids, charts, cards and maps.',
        concept: 'sources'
    },
    {
        key: 'content',
        title: 'Content',
        categories: ['content'],
        description: 'Text and notes, with variables in them.',
        concept: 'binding'
    },
    {
        key: 'action',
        title: 'Action',
        categories: ['action'],
        description: 'Buttons that run typed actions.',
        concept: 'actions'
    }
];

/**
 * The widgets with an example in a role's categories, built in and the app's own apart, each in
 * registry order.
 */
export function roleWidgets(
    registry: BlueprintRegistry,
    role: BuiltinRole
): {builtIn: string[]; app: string[]} {
    const origins = new Map(
            registryEntries(registry, registry)
                .filter(it => it.kind === 'widget')
                .map(it => [it.name, it.origin])
        ),
        names = Object.entries(registry.widgets)
            .filter(([, spec]) => spec.example && role.categories.includes(spec.category))
            .map(([name]) => name);
    return {
        builtIn: names.filter(it => origins.get(it) !== 'app'),
        app: names.filter(it => origins.get(it) === 'app')
    };
}

/** A Built-ins page: one widget, or every input at once. */
export interface BuiltinPageSpec {
    /** Tab id and route name, safe for a widget with a dotted name. */
    id: string;
    /** The widget's name, or `INPUTS_OVERVIEW`. */
    name: string;
    role: BuiltinRole;
}

/** Every Built-ins page, by role: the built-in widgets, then the app's own. */
export function builtinPages(registry: BlueprintRegistry): BuiltinPageSpec[] {
    return BUILTIN_ROLES.flatMap(role => {
        const {builtIn, app} = roleWidgets(registry, role),
            names = [...(role.key === 'input' ? [INPUTS_OVERVIEW] : []), ...builtIn, ...app];
        return names.map(name => ({id: `builtin-${name.replace(/\./g, '-')}`, name, role}));
    });
}
