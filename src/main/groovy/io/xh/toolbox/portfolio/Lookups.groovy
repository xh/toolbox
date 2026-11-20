package io.xh.toolbox.portfolio


class Lookups {

    static final List SECTORS = ['Financials', 'Healthcare', 'Real Estate', 'Technology', 'Consumer Products', 'Manufacturing', 'Energy', 'Other', 'Utilities']
    static final List REGIONS = ['US', 'BRIC', 'Emerging Markets', 'EU', 'Asia/Pac']

    static final List MODELS = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul']
    static final List FUNDS = ['Oak Mount', 'Black Crescent', 'Winter Star', 'Red River', 'Hudson Bay']

    /** Each fund's portfolio manager and investment style. */
    static final Map<String, Map<String, String>> FUND_PROFILES = [
        'Oak Mount'     : [manager: 'Dana Whitfield', style: 'Long/Short'],
        'Black Crescent': [manager: 'Marcus Oyelaran', style: 'Macro'],
        'Winter Star'   : [manager: 'Ingrid Solberg', style: 'Credit'],
        'Red River'     : [manager: 'Tomas Reyes', style: 'Long/Short'],
        'Hudson Bay'    : [manager: 'Priya Natarajan', style: 'Multi-Strategy']
    ]
    static final List TRADERS = ['Freda Klecko', 'London Rohan', 'Kennedy Hills', 'Linnea Trolley', 'Pearl Hellens', 'Jimmy Falcon', 'Fred Corn', 'Robert Greer', 'HedgeSys', 'Susan Major']

    static final Map<String, List<String>> INDUSTRIES = [
        'Financials'       : ['Banks', 'Insurance', 'Asset Management'],
        'Healthcare'       : ['Pharma', 'Biotech', 'Medical Devices'],
        'Real Estate'      : ['REITs', 'Real Estate Services'],
        'Technology'       : ['Semiconductors', 'Software', 'Hardware'],
        'Consumer Products': ['Retail', 'Beverages', 'Apparel'],
        'Manufacturing'    : ['Industrial Machinery', 'Aerospace & Defense', 'Chemicals'],
        'Energy'           : ['Oil & Gas', 'Renewables'],
        'Other'            : ['Diversified', 'Conglomerates'],
        'Utilities'        : ['Electric', 'Water']
    ]

    /** Countries by region, each as [country, ccy]. */
    static final Map<String, List<List<String>>> COUNTRIES = [
        'US'              : [['United States', 'USD']],
        'BRIC'            : [['Brazil', 'BRL'], ['India', 'INR'], ['China', 'CNY']],
        'Emerging Markets': [['Mexico', 'MXN'], ['South Africa', 'ZAR'], ['Indonesia', 'IDR']],
        'EU'              : [['Germany', 'EUR'], ['France', 'EUR'], ['Netherlands', 'EUR'], ['Italy', 'EUR']],
        'Asia/Pac'        : [['Japan', 'JPY'], ['Australia', 'AUD'], ['Hong Kong', 'HKD'], ['Singapore', 'SGD']]
    ]

    static final List STRATEGIES = ['Long/Short Equity', 'Merger Arb', 'Global Macro', 'Credit', 'Event Driven']
    static final List BOOKS = ['Core', 'Tactical', 'Hedge']

    /** Each trader sits in one strategy. */
    static final Map<String, String> TRADER_STRATEGIES = [TRADERS, STRATEGIES * 2].transpose().collectEntries()

}
