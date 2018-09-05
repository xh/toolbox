import {HoistModel} from '@xh/hoist/core';
import {FieldSupport, field, required, lengthIs} from '@xh/hoist/field';
import {movies} from '../../core/data';

@HoistModel
@FieldSupport
export class FormPageModel {

    @field(required, lengthIs({min: 8}))
    name = null;

    @field(required)
    movie = null;

    @field()
    notes = null;

    @field()
    searchQuery = null;

    movies = movies;

    constructor() {
        this.initFields({});
    }
}