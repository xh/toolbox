import {FormModel} from '@xh/hoist/cmp/form';
import {HoistModel, managed} from '@xh/hoist/core';
import {action, bindable, makeObservable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {uniq} from 'lodash';
import {TickerSelectorModel} from './TickerSelectorModel';
import {Company, PeerGroup, Ticker} from './Types';

export class ActModel extends HoistModel {
    @bindable
    selectedTickers: Ticker[] = ['XH', 'AAPL'];

    @managed tickerSelectorModel: TickerSelectorModel;
    @managed configFormModel: FormModel;

    @bindable.ref
    company: Company = {ticker: 'XH', company_name: 'Extremely Heavy'};

    @action
    setSelectedTickers(tickers: Ticker[]) {
        this.selectedTickers = uniq(tickers);
    }

    constructor() {
        super();
        makeObservable(this);

        this.tickerSelectorModel = new TickerSelectorModel({parentModel: this});

        this.configFormModel = new FormModel({
            fields: [
                {name: 'avgPeers', displayName: 'Show peers as average'},
                {name: 'rebase', displayName: 'Rebase to 100%'},
                {name: 'rebaseStartDate', displayName: 'Rebase Start Date'}
            ]
        });
    }

    //------------------
    // Mock data
    //------------------
    get selectableDates(): LocalDate[] {
        return [
            LocalDate.today(),
            LocalDate.today().add(-1, 'week'),
            LocalDate.today().add(-2, 'week')
        ];
    }
    get peerGroups(): PeerGroup[] {
        return [
            {
                source: 'ISS',
                peers: [
                    {ticker: 'DEF', company_name: 'DEF Holdings'},
                    {ticker: 'GHI', company_name: 'GHI Technologies'},
                    {ticker: 'JKL', company_name: 'JKL Industries'},
                    {ticker: 'MNP', company_name: 'MNP Group'}
                ]
            },
            {
                source: 'Custom',
                peers: [
                    {ticker: 'QRS', company_name: 'QRS Corp.'},
                    {ticker: 'TUV', company_name: 'TUV Solutions'},
                    {ticker: 'WXY', company_name: 'WXY Enterprises'},
                    {ticker: 'ZAB', company_name: 'ZAB Ltd.'},
                    {ticker: 'CDE', company_name: 'CDE Partners'},
                    {ticker: 'FGH', company_name: 'FGH Inc.'}
                ]
            },
            {
                source: 'Analyst',
                peers: [
                    {ticker: 'IJK', company_name: 'IJK Financial'},
                    {ticker: 'LMN', company_name: 'LMN Retail'},
                    {ticker: 'OPQ', company_name: 'OPQ Manufacturing'}
                ]
            }
        ];
    }

    get benchmarks() {
        return ['SPX', 'QQQ', 'NASDAQ'];
    }

    get otherCompanies(): Company[] {
        return [
            {ticker: 'AAPL', company_name: 'Apple Inc.'},
            {ticker: 'ABBV', company_name: 'AbbVie Inc.'},
            {ticker: 'ABT', company_name: 'Abbott Laboratories'},
            {ticker: 'ADBE', company_name: 'Adobe Inc.'},
            {ticker: 'AMZN', company_name: 'Amazon.com, Inc.'},
            {ticker: 'AVGO', company_name: 'Broadcom Inc.'},
            {ticker: 'BAC', company_name: 'Bank of America Corporation'},
            {ticker: 'BRK.B', company_name: 'Berkshire Hathaway Inc.'},
            {ticker: 'COST', company_name: 'Costco Wholesale Corporation'},
            {ticker: 'CRM', company_name: 'Salesforce, Inc.'},
            {ticker: 'CSCO', company_name: 'Cisco Systems, Inc.'},
            {ticker: 'CVX', company_name: 'Chevron Corporation'},
            {ticker: 'DHR', company_name: 'Danaher Corporation'},
            {ticker: 'DIS', company_name: 'The Walt Disney Company'},
            {ticker: 'GOOGL', company_name: 'Alphabet Inc.'},
            {ticker: 'HD', company_name: 'The Home Depot, Inc.'},
            {ticker: 'HON', company_name: 'Honeywell International Inc.'},
            {ticker: 'INTC', company_name: 'Intel Corporation'},
            {ticker: 'JNJ', company_name: 'Johnson & Johnson'},
            {ticker: 'JPM', company_name: 'JPMorgan Chase & Co.'},
            {ticker: 'KO', company_name: 'The Coca-Cola Company'},
            {ticker: 'LIN', company_name: 'Linde plc'},
            {ticker: 'LLY', company_name: 'Eli Lilly and Company'},
            {ticker: 'MA', company_name: 'Mastercard Incorporated'},
            {ticker: 'MCD', company_name: "McDonald's Corporation"},
            {ticker: 'MDT', company_name: 'Medtronic plc'},
            {ticker: 'META', company_name: 'Meta Platforms, Inc.'},
            {ticker: 'MRK', company_name: 'Merck & Co., Inc.'},
            {ticker: 'MSFT', company_name: 'Microsoft Corporation'},
            {ticker: 'NFLX', company_name: 'Netflix, Inc.'},
            {ticker: 'NKE', company_name: 'NIKE, Inc.'},
            {ticker: 'NVDA', company_name: 'NVIDIA Corporation'},
            {ticker: 'ORCL', company_name: 'Oracle Corporation'},
            {ticker: 'PEP', company_name: 'PepsiCo, Inc.'},
            {ticker: 'PFE', company_name: 'Pfizer Inc.'},
            {ticker: 'PG', company_name: 'Procter & Gamble Company'},
            {ticker: 'PM', company_name: 'Philip Morris International Inc.'},
            {ticker: 'QCOM', company_name: 'QUALCOMM Incorporated'},
            {ticker: 'T', company_name: 'AT&T Inc.'},
            {ticker: 'TMO', company_name: 'Thermo Fisher Scientific Inc.'},
            {ticker: 'TSLA', company_name: 'Tesla, Inc.'},
            {ticker: 'TXN', company_name: 'Texas Instruments Incorporated'},
            {ticker: 'UNH', company_name: 'UnitedHealth Group Incorporated'},
            {ticker: 'UNP', company_name: 'Union Pacific Corporation'},
            {ticker: 'V', company_name: 'Visa Inc.'},
            {ticker: 'VZ', company_name: 'Verizon Communications Inc.'},
            {ticker: 'WFC', company_name: 'Wells Fargo & Company'},
            {ticker: 'WMT', company_name: 'Walmart Inc.'},
            {ticker: 'XOM', company_name: 'Exxon Mobil Corporation'}
        ];
    }
}
