import type {Blueprint, BlueprintRename} from '@xh/hoist-chat-kit/blueprint';
import {isEqual, omit} from 'lodash';

const SECTIONS = [
    {key: 'elements', noun: 'element', renameKind: 'element'},
    {key: 'variables', noun: 'variable', renameKind: 'variable'},
    {key: 'sources', noun: 'source', renameKind: 'source'},
    {key: 'presets', noun: 'preset group', renameKind: null}
] as const;

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
    const ret: string[] = [];
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
        const line = (n: number, verb: string) => {
            if (n) ret.push(`${n} ${noun}${n === 1 ? '' : 's'} ${verb}`);
        };
        line(added, 'added');
        line(removed, 'removed');
        line(pairs.length, 'renamed');
        line(changed, 'changed');
    });
    const keys = SECTIONS.map(it => it.key);
    if (from && !isEqual(omit(from, keys), omit(to, keys))) ret.push('Blueprint settings changed');
    return ret;
}
