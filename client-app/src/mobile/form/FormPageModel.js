import {FormModel, field, required, lengthIs} from '@xh/hoist/cmp/form';
import {movies} from '../../core/data';

@FormModel
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