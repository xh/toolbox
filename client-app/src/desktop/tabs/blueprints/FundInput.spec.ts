import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {beforeAll, describe, expect, it} from 'vitest';
import {FundInputModel} from './FundInput';
import {fundType} from './toolboxRegistry';

beforeAll(async () => {
    hoistCore.route('GET', 'blueprints/funds', () => [
        {name: 'Oak Mount', aum: 3_667_869_902},
        {name: 'Red River', aum: 3_698_958_459}
    ]);
    await initTestAppAsync();
});

describe('Fund input', () => {
    it('offers each fund by name, with its AUM', async () => {
        const model = new FundInputModel();
        await model.loadAsync();
        expect(model.options).toEqual([
            {value: 'Oak Mount', label: 'Oak Mount', aum: 3_667_869_902},
            {value: 'Red River', label: 'Red River', aum: 3_698_958_459}
        ]);
        model.destroy();
    });

    it('is the fund type input', () => {
        expect(fundType.input).toBeTypeOf('function');
    });
});
