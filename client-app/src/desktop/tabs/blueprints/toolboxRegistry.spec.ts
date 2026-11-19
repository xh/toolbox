import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {BlueprintRegistry, DataCatalog, validateBlueprint} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import {initTestAppAsync} from '@xh/hoist/test-support';
import {beforeAll, describe, expect, it} from 'vitest';
import portfolioCatalog from './catalog/portfolio.json';
import {createToolboxRegistry, userFundResolver} from './toolboxRegistry';

const catalog = new DataCatalog(portfolioCatalog);

const fundGrid: Blueprint = {
    variables: {
        asOf: {type: 'localDate', label: 'As of', setBy: 'prompt', default: {resolver: 'today'}},
        fund: {type: 'fund', label: 'Fund', setBy: 'prompt', default: {resolver: 'userFund'}}
    },
    sources: {
        positions: {
            dataset: 'positions',
            params: {asOf: {$var: 'asOf'}, fund: {$var: 'fund'}}
        }
    },
    root: 'grid',
    elements: {
        grid: {
            component: 'cubeGrid',
            config: {source: 'positions', groupBy: ['sector'], columnState: ['mktVal']}
        }
    }
};

const codes = (registry: BlueprintRegistry) =>
    validateBlueprint(fundGrid, {catalog, registry}).map(it => it.code);

beforeAll(() => initTestAppAsync());

describe('Toolbox blueprint registry', () => {
    it('adds the fund type and the userFund resolver to the built-ins', () => {
        expect(codes(new BlueprintRegistry())).toEqual(
            expect.arrayContaining(['variable.unknownType', 'variable.unknownResolver'])
        );
        expect(codes(createToolboxRegistry())).toEqual([]);
    });

    it("resolves userFund to the user's fund preference", () => {
        expect(userFundResolver.resolve({})).toBe('Oak Mount');
        XH.setPref('blueprintsFund', 'Red River');
        expect(userFundResolver.resolve({})).toBe('Red River');
        XH.prefService.unset('blueprintsFund');
    });
});
