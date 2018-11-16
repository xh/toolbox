import {HoistModel} from '@xh/hoist/core';
import {FormSupport, field, required, lengthIs} from '@xh/hoist/field';
import {movies} from '../../core/data';

@HoistModel
@FormSupport
export class FormPageModel {

    @field(required, lengthIs({min: 8}))
    name = null;

    @field(required)
    movie = null;

    @field()
    salary = null;

    @field()
    notes = null;

    @field('Search')
    searchQuery = null;

    movies = movies;

    constructor() {
        this.initFields({});
    }
}