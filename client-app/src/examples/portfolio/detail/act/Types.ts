export type Ticker = string;

export interface Company {
    ticker: Ticker;
    company_name: string;
}

export interface PeerGroup {
    source: string;
    peers: Company[];
}
