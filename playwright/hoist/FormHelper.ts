import {PlainObject} from '@xh/hoist/core/types/Types';
import {HoistPage} from './HoistPage';
import {FormModel} from '@xh/hoist/cmp/form';
import {Page} from '@playwright/test';
import {isNil} from 'lodash';

export class FormHelper {
    constructor(
        private readonly hoistPage: HoistPage,
        readonly testId: string
    ) {}

    //-------------------------
    // Model-based helpers
    //-------------------------
    get exists(): Promise<boolean> {
        return this.page.evaluate<boolean, string>(
            testId => window.XH.getModelByTestId<FormModel>(testId) != null,
            this.testId
        );
    }

    get isDirty(): Promise<boolean> {
        return this.page.evaluate<boolean, string>(
            testId => window.XH.getModelByTestId<FormModel>(testId).isDirty,
            this.testId
        );
    }

    get isValid(): Promise<boolean> {
        return this.page.evaluate<boolean, string>(
            testId => window.XH.getModelByTestId<FormModel>(testId).isValid,
            this.testId
        );
    }

    get allErrors(): Promise<string[]> {
        return this.page.evaluate<string[], string>(
            testId => window.XH.getModelByTestId<FormModel>(testId).allErrors,
            this.testId
        );
    }

    async getData(dirtyOnly: boolean): Promise<PlainObject> {
        return this.page.evaluate<PlainObject, [string, boolean]>(
            ([testId, dirtyOnly]) =>
                window.XH.getModelByTestId<FormModel>(testId).getData(dirtyOnly),
            [this.testId, dirtyOnly]
        );
    }

    async reset(): Promise<void> {
        return this.page.evaluate<void, string>(
            testId => window.XH.getModelByTestId<FormModel>(testId).reset(),
            this.testId
        );
    }

    //-------------------------
    // Field-level model-based helpers
    //-------------------------
    async hasField(fieldName: string): Promise<boolean> {
        return this.page.evaluate<boolean, [string, string]>(
            ([testId, fieldName]) =>
                !isNil(window.XH.getModelByTestId<FormModel>(testId).getField(fieldName)),
            [this.testId, fieldName]
        );
    }

    async setValues(values: PlainObject): Promise<void> {
        return this.page.evaluate<void, [string, PlainObject]>(
            ([testId, values]) =>
                window.XH.getModelByTestId<FormModel>(testId).setValues(values),
            [this.testId, values]
        );
    }

    async ensureValues(values: PlainObject): Promise<void> {
        return this.page.evaluate<void, [string, PlainObject]>(
            ([testId, values]) => {
                const data = window.XH.getModelByTestId<FormModel>(testId).getData();
                for (const [key, value] of Object.entries(values)) {
                    if (data[key] !== value)
                        throw new Error(
                            `Expected ${key} to be ${value}, but found ${data[key]}.`
                        );
                }
            },
            [this.testId, values]
        );
    }

    async getFieldValue(fieldName: string): Promise<any> {
        return this.page.evaluate<any, [string, string]>(
            ([testId, fieldName]) =>
                window.XH.getModelByTestId<FormModel>(testId).getField(fieldName).value,
            [this.testId, fieldName]
        );
    }

    async isFieldValid(fieldName: string): Promise<boolean> {
        return this.page.evaluate<boolean, [string, string]>(
            ([testId, fieldName]) =>
                window.XH.getModelByTestId<FormModel>(testId).getField(fieldName).isValid,
            [this.testId, fieldName]
        );
    }

    async isFieldDisabled(fieldName: string): Promise<boolean> {
        return this.page.evaluate<boolean, [string, string]>(
            ([testId, fieldName]) =>
                window.XH.getModelByTestId<FormModel>(testId).getField(fieldName).disabled,
            [this.testId, fieldName]
        );
    }

    async isFieldDirty(fieldName: string): Promise<boolean> {
        return this.page.evaluate<boolean, [string, string]>(
            ([testId, fieldName]) =>
                window.XH.getModelByTestId<FormModel>(testId).getField(fieldName).isDirty,
            [this.testId, fieldName]
        );
    }

    async isFieldReadOnly(fieldName: string): Promise<boolean> {
        return this.page.evaluate<boolean, [string, string]>(
            ([testId, fieldName]) =>
                window.XH.getModelByTestId<FormModel>(testId).getField(fieldName).readonly,
            [this.testId, fieldName]
        );
    }

    async isFieldValidating(fieldName: string): Promise<boolean> {
        return this.page.evaluate<boolean, [string, string]>(
            ([testId, fieldName]) =>
                window.XH.getModelByTestId<FormModel>(testId).getField(fieldName)
                    .isValidationPending,
            [this.testId, fieldName]
        );
    }

    //-------------------------
    // Implementation
    //-------------------------
    private get page(): Page {
        return this.hoistPage.page;
    }
}
