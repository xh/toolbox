import {merge} from 'lodash';

import {HoistModel, managed, XH} from '@xh/hoist/core';
import {start} from '@xh/hoist/promise';
import {action, bindable, observable} from '@xh/hoist/mobx';
import {PendingTaskModel} from '@xh/hoist/utils/async';


@HoistModel
export class FetchApiTestModel {

    @bindable testServer;
    @bindable testMethod;
    @observable response = null;
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
        {
            value: 'fetch',
            label: 'fetch (GET)'
        }, 'getJson', 'postJson', 'putJson', 'deleteJson'
    ]

    @managed
    loadModel = new PendingTaskModel();

    constructor() {
        this.setTestServer(this.testServers[0].value);
        this.setTestMethod(this.testMethods[0].value);
    }

    async testCodeGroupAsync(codeGroup) {
        const testedCodes = [],
            tests = this.codes
                .filter(it => it.code >= codeGroup && it.code <= codeGroup + 99)
                .map(it => {
                    testedCodes.push(it.code);
                    return this.doTestAsync(it.code);
                });

        Promise.all(tests)
            .then(responses => {
                this.setResponse(
                    responses.map((response, idx) => {
                        const code = testedCodes[idx];
                        return this.formatResponse(response, code);
                    })
                );
            })
            .linkTo(this.loadModel);
    }

    async testCodeAsync(code) {
        this.doTestAsync(code)
            .then((resp) => this.setResponse(this.formatResponse(resp, code)))
            .linkTo(this.loadModel);
    }

    async doTestAsync(code) {
        return start(() => {
            if (this.testMethod == 'fetch') return this.doFetchAsync(code);
            return  XH.fetchService[this.testMethod](this.requestOptions(code));
        })
            .catch((err) => this.handleError(err));
    }

    async doFetchAsync(code) {
        return XH.fetch(this.requestOptions(code))
            .then(async (resp) => {
                const output = this.getResponseProps(resp);
                output.headers = this.getResponseHeaders(resp);
                output.body = await this.getResponseBodyAsync(resp);
                return output;
            });
    }

    handleError(err) {
        let ret;
        if (err.name.includes('HTTP Error')) {
            ret = err;
        } else {
            ret = {
                name: err.name,
                message: err.message
            };
        }

        return ret;   
    }

    formatResponse(response, code) {
        const description = this.codes.find(it => it.code == code).description;

        return {
            code,
            description,
            response
        };
    }

    @action 
    setResponse(obj) {
        this.response = JSON.stringify(obj, undefined, 2);
    }

    requestOptions(code) {
        const ret = {
            fetchOpts: {
                credentials: this.useCreds ? 'include' : 'omit'
            },
            url: `${this.testServer}${code}`,
            headers: {
                'Expect': code == 100 ? '100-continue' : undefined
            }
        };

        if (this.testMethod == 'fetch') {
            merge(ret, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
        }

        return ret;
    }

    get useCreds() {
        return !this.testServer.includes('httpstat');
    }

    getResponseProps(resp) {
        const ret = {};
        for (let p in resp) {
            const type = typeof resp[p];
            
            if (type == 'string' || type == 'number' || type == 'boolean') {
                ret[p] = resp[p];
            }
        }
        return ret;
    }

    getResponseHeaders(resp) {
        const ret = {};
        resp.headers.forEach((val, key) => {
            ret[key] = val;
        });
        return ret;
    }

    async getResponseBodyAsync(resp) {
        const ct = resp.headers.get('Content-Type');
        let method;
        switch (true) {
            case ct?.includes('json') :
                method = 'json';
                break;
            default:
                method = 'text';
                break;
        }

        try {
            return await resp[method]();
        } catch (error) {
            return null;
        } 
    }

    codes = [
        {
            code: 100,
            description: 'Continue'
        },
        {
            code: 101,
            description: 'Switching Protocols'
        },
        {
            code: 102,
            description: 'Processing'
        },
        {
            code: 103,
            description: 'Early Hints'
        },
        {
            code: 200,
            description: 'OK'
        },
        {
            code: 201,
            description: 'Created'
        },
        {
            code: 202,
            description: 'Accepted'
        },
        {
            code: 203,
            description: 'Non-Authoritative Information'
        },
        {
            code: 204,
            description: 'No Content'
        },
        {
            code: 205,
            description: 'Reset Content'
        },
        {
            code: 206,
            description: 'Partial Content'
        },
        {
            code: 207,
            description: 'Multi-Status'
        },
        {
            code: 208,
            description: 'Already Reported'
        },
        {
            code: 226,
            description: 'I\'M Used'
        },
        {
            code: 300,
            description: 'Multiple Choices'
        },
        {
            code: 301,
            description: 'Moved Permanently'
        },
        {
            code: 302,
            description: 'Found'
        },
        {
            code: 303,
            description: 'See Other'
        },
        {
            code: 304,
            description: 'Not Modified'
        },
        {
            code: 305,
            description: 'Use Proxy'
        },
        {
            code: 306,
            description: 'Unused'
        },
        {
            code: 307,
            description: 'Temporary Redirect'
        },
        {
            code: 308,
            description: 'Permanent Redirect'
        },
        {
            code: 400,
            description: 'Bad Request'
        },
        {
            code: 401,
            description: 'Unauthorized'
        },
        {
            code: 402,
            description: 'Payment Required'
        },
        {
            code: 403,
            description: 'Forbidden'
        },
        {
            code: 404,
            description: 'Not Found'
        },
        {
            code: 405,
            description: 'Method Not Allowed'
        },
        {
            code: 406,
            description: 'Not Acceptable'
        },
        {
            code: 407,
            description: 'Proxy Authentication Required'
        },
        {
            code: 408,
            description: 'Request Timeout'
        },
        {
            code: 409,
            description: 'Conflict'
        },
        {
            code: 410,
            description: 'Gone'
        },
        {
            code: 411,
            description: 'Length Required'
        },
        {
            code: 412,
            description: 'Precondition Failed'
        },
        {
            code: 413,
            description: 'Request Entity Too Large'
        },
        {
            code: 414,
            description: 'Request-URI Too Long'
        },
        {
            code: 415,
            description: 'Unsupported Media Type'
        },
        {
            code: 416,
            description: 'Requested Range Not Satisfiable'
        },
        {
            code: 417,
            description: 'Expectation Failed'
        },
        {
            code: 418,
            description: 'I\'m a teapot'
        },
        {
            code: 421,
            description: 'Misdirected Request'
        },
        {
            code: 422,
            description: 'Unprocessable Entity'
        },
        {
            code: 423,
            description: 'Locked'
        },
        {
            code: 424,
            description: 'Failed Dependency'
        },
        {
            code: 425,
            description: 'Too Early'
        },
        {
            code: 426,
            description: 'Upgrade Required'
        },
        {
            code: 428,
            description: 'Precondition Required'
        },
        {
            code: 429,
            description: 'Too Many Requests'
        },
        {
            code: 431,
            description: 'Request Header Fields Too Large'
        },
        {
            code: 451,
            description: 'Unavailable For Legal Reasons'
        },
        {
            code: 499,
            description: 'Client Closed Request'
        },
        {
            code: 500,
            description: 'Internal Server Error'
        },
        {
            code: 501,
            description: 'Not Implemented'
        },
        {
            code: 502,
            description: 'Bad Gateway'
        },
        {
            code: 503,
            description: 'Service Unavailable'
        },
        {
            code: 504,
            description: 'Gateway Timeout'
        },
        {
            code: 505,
            description: 'HTTP Version Not Supported'
        },
        {
            code: 506,
            description: 'Variant Also Negotiates'
        },
        {
            code: 507,
            description: 'Insufficient Storage'
        },
        {
            code: 508,
            description: 'Loop Detected'
        },
        {
            code: 510,
            description: 'Not Extended'
        },
        {
            code: 511,
            description: 'Network Authentication Required'
        },
        {
            code: 520,
            description: 'Web server is returning an unknown error'
        },
        {
            code: 522,
            description: 'Connection timed out'
        },
        {
            code: 524,
            description: 'A timeout occurred'
        },
        {
            code: 599,
            description: 'Network Connect Timeout Error'
        }
    ]
}