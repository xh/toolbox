import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {HoistModel, managed, PlainObject, TaskObserver, XH} from '@xh/hoist/core';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {merge} from 'lodash';
import {codes} from './Codes';
import {codeGroupBtns, fetchServiceFeatures, individualBtns} from './TabPanels';
import {FetchOptions} from '@xh/hoist/svc';

export class FetchApiTestModel extends HoistModel {
    @bindable testServer;
    @bindable testMethod: string;
    @bindable testCorrelationIds = true;
    @observable outcome = null;

    referenceSite = 'https://httpstatuses.com/';

    testServers = [
        {
            value: 'fetchTest?status=',
            label: 'Toolbox'
        },
        {
            value: 'https://httpstat.us/',
            label: 'httpstat.us'
        }
    ];

    testMethods = [
        {value: 'fetch', label: 'fetch (GET)'},
        {value: 'getJson'},
        {value: 'postJson'},
        {value: 'putJson'},
        {value: 'deleteJson'}
    ];

    @managed
    taskModel = TaskObserver.trackLast();

    @managed
    testsTabModel = new TabContainerModel({
        tabs: [
            {
                id: 'groups',
                title: 'Code Groups',
                content: codeGroupBtns
            },
            {
                id: 'individual',
                title: 'Individual Codes',
                content: individualBtns
            },
            {
                id: 'fetchServiceFeatures',
                title: 'FetchService Features',
                content: fetchServiceFeatures
            }
        ]
    });

    constructor() {
        super();
        makeObservable(this);
        this.testServer = this.testServers[0].value;
        this.testMethod = this.testMethods[0].value;
    }

    async testCodeGroupAsync(codeGroup) {
        const testedCodes = [],
            tests = codes
                .filter(it => it.code >= codeGroup && it.code <= codeGroup + 99)
                .map(it => {
                    testedCodes.push(it.code);
                    return this.doTestAsync(it.code);
                });

        Promise.all(tests)
            .then(responses => {
                this.setOutcome(
                    responses.map((response, idx) => {
                        const code = testedCodes[idx];
                        return this.formatOutcome(response, code);
                    })
                );
            })
            .linkTo(this.taskModel);
    }

    async testCodeAsync(code) {
        this.doTestAsync(code)
            .then(resp => this.setOutcome(this.formatOutcome(resp, code)))
            .linkTo(this.taskModel);
    }

    private async doTestAsync(code) {
        return wait()
            .then(() => {
                if (this.testMethod === 'fetch') return this.doFetchAsync({code});
                return XH.fetchService[this.testMethod](this.requestOptions({code}));
            })
            .catch(err => this.handleError(err));
    }

    private async doFetchAsync(opts: {code; delay?; autoAbortKey?; timeout?}) {
        const {code, delay, autoAbortKey, timeout} = opts;
        return XH.fetch(this.requestOptions({code, delay, autoAbortKey, timeout})).then(
            async resp => {
                const output = this.getResponseProps(resp);
                output.headers = this.getResponseHeaders(resp);
                output.body = await this.getResponseBodyAsync(resp);
                return output;
            }
        );
    }

    // This does not test an abort that happens after the fetch has returned
    // but before/during the async response.json() operation.
    // It is not possible to test that progromatically on FetchService.
    async testAbortAsync() {
        const autoAbortKey = 'abort-test',
            code = 200,
            delay = 5000;

        wait()
            .then(() => {
                if (this.testMethod === 'fetch')
                    return this.doFetchAsync({code, delay, autoAbortKey});
                return XH.fetchService[this.testMethod](
                    this.requestOptions({code, delay, autoAbortKey})
                );
            })
            .catch(err => this.handleError(err))
            .then(resp => this.setOutcome(this.formatOutcome(resp, code)))
            .linkTo(this.taskModel);

        wait(1).then(() => {
            if (this.testMethod === 'fetch') return this.doFetchAsync({code, autoAbortKey});
            return XH.fetchService[this.testMethod](this.requestOptions({code, autoAbortKey}));
        });
    }

    async testTimeoutAsync() {
        const code = 200,
            delay = 30000,
            timeout = {
                interval: 5000,
                message: 'Fetch timed out as expected after 5ms'
            };

        wait()
            .then(() => {
                if (this.testMethod === 'fetch') return this.doFetchAsync({code, delay, timeout});
                return XH.fetchService[this.testMethod](
                    this.requestOptions({code, delay, timeout})
                );
            })
            .catch(err => this.handleError(err))
            .then(resp => this.setOutcome(this.formatOutcome(resp, code)))
            .linkTo(this.taskModel);
    }

    private handleError(err) {
        let ret;
        if (err.name.includes('HTTP Error')) {
            ret = err;
        } else {
            ret = {
                name: err.name,
                message: err.message
            };
            if (err.correlationId) {
                ret.correlationId = err.correlationId;
            }
        }

        return ret;
    }

    private formatOutcome(response, code) {
        // Early out on fetch features
        if (response.name === 'Fetch Timeout' || response.name === 'Fetch Aborted') {
            return {
                fetchError: response,
                response: null
            };
        }

        const description = codes.find(it => it.code == code).description;

        return {
            code,
            description,
            response
        };
    }

    @action
    private setOutcome(obj) {
        this.outcome = JSON.stringify(obj, undefined, 2);
    }

    private requestOptions(opts: {code; delay?; autoAbortKey?; timeout?}) {
        const {code, delay, autoAbortKey, timeout} = opts;
        const sep = this.testServer.includes('fetchTest') ? '&' : '?',
            sleepParam = delay ? sep + 'sleep=' + delay : '';
        const ret: FetchOptions = {
            fetchOpts: {
                credentials: this.useCreds ? 'include' : 'omit'
            },
            url: `${this.testServer}${code}${sleepParam}`,
            headers: {
                Expect: code === 100 ? '100-continue' : undefined
            },
            autoAbortKey,
            timeout,
            correlationId: this.testCorrelationIds
        };

        if (this.testMethod === 'fetch') {
            merge(ret, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });
        }

        return ret;
    }

    private get useCreds() {
        return !this.testServer.includes('httpstat');
    }

    getResponseProps(resp): PlainObject {
        const ret = {};
        for (let p in resp) {
            const type = typeof resp[p];

            if (type == 'string' || type == 'number' || type == 'boolean') {
                ret[p] = resp[p];
            }
        }
        return ret;
    }

    private getResponseHeaders(resp): PlainObject {
        const ret = {};
        resp.headers.forEach((val, key) => {
            ret[key] = val;
        });
        return ret;
    }

    private async getResponseBodyAsync(resp) {
        const ct = resp.headers.get('Content-Type');
        let method;
        switch (true) {
            case ct?.includes('json'):
                method = 'json';
                break;
            default:
                method = 'text';
                break;
        }

        try {
            return resp[method]();
        } catch (error) {
            return null;
        }
    }
}
