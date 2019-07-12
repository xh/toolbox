package io.xh.toolbox.data

import io.xh.hoist.BaseService

class CompanyService extends BaseService {

    List<Map> getCompanies(){
        return [
                [name: 'ibm', location: 'yorktown house']
        ]
    }
}
