import type {Blueprint, BlueprintRename} from '@xh/hoist-chat-kit/blueprint';
import {isEqual, omit} from 'lodash';

const SECTIONS = [
    {key: 'elements', noun: 'element', renameKind: 'element'},
    {key: 'variables', noun: 'variable', renameKind: 'variable'},
    {key: 'sources', noun: 'source', renameKind: 'source'},
    {key: 'presets', noun: 'preset group', renameKind: null}
] as const;

interface Tally {
    noun: string;
    verb: string;
    n: number;
}

/**
 * What changed from one blueprint to another, as lines such as "2 elements added", by section:
 * elements, variables, sources, preset groups, then anything else. A rename the draft records
 * counts once, as renamed, and also as changed if its content differs. Empty when equal.
 */
export function changeSummary(
    from: Blueprint,
    to: Blueprint,
    renames: BlueprintRename[] = []
): string[] {
    const {tallies, settings} = tally(from, to, renames);
    return [
        ...tallies.map(({noun, verb, n}) => `${n} ${noun}${n === 1 ? '' : 's'} ${verb}`),
        ...(settings ? ['Blueprint settings changed'] : [])
    ];
}

/** How many changes {@link changeSummary} lists, each element, variable or source once. */
export function changeCount(
    from: Blueprint,
    to: Blueprint,
    renames: BlueprintRename[] = []
): number {
    const {tallies, settings} = tally(from, to, renames);
    return tallies.reduce((sum, it) => sum + it.n, 0) + (settings ? 1 : 0);
}

//------------------
// Implementation
//------------------
function tally(
    from: Blueprint,
    to: Blueprint,
    renames: BlueprintRename[]
): {tallies: Tally[]; settings: boolean} {
    const tallies: Tally[] = [];
    SECTIONS.forEach(({key, noun, renameKind}) => {
        const a = from?.[key] ?? {},
            b = to?.[key] ?? {},
            pairs = renames.filter(
                it => it.kind === renameKind && it.from in a && it.to in b && !(it.to in a)
            ),
            renamedFrom = new Set(pairs.map(it => it.from)),
            renamedTo = new Set(pairs.map(it => it.to)),
            added = Object.keys(b).filter(it => !(it in a) && !renamedTo.has(it)).length,
            removed = Object.keys(a).filter(it => !(it in b) && !renamedFrom.has(it)).length,
            changed =
                Object.keys(b).filter(it => it in a && !isEqual(a[it], b[it])).length +
                pairs.filter(it => !isEqual(a[it.from], b[it.to])).length;
        const add = (n: number, verb: string) => {
            if (n) tallies.push({noun, verb, n});
        };
        add(added, 'added');
        add(removed, 'removed');
        add(pairs.length, 'renamed');
        add(changed, 'changed');
    });
    const keys = SECTIONS.map(it => it.key);
    return {tallies, settings: !!from && !isEqual(omit(from, keys), omit(to, keys))};
}
