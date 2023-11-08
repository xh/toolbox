import {PlainObject} from '@xh/hoist/core/types/Types';
import {HoistPage} from './HoistPage';
import {FormModel} from '@xh/hoist/cmp/form';
import {Page} from '@playwright/test';

export class FormHelper {
    constructor(
        private readonly hoistPage: HoistPage,
        private readonly testId: string
    ) {}

    //-------------------------
    // Form-level helpers
    //-------------------------
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

    getData(dirtyOnly: boolean): Promise<PlainObject> {
        return this.page.evaluate<PlainObject, [string, boolean]>(
            ([testId, dirtyOnly]) =>
                window.XH.getModelByTestId<FormModel>(testId).getData(dirtyOnly),
            [this.testId, dirtyOnly]
        );
    }

    reset(): Promise<void> {
        return this.page.evaluate<void, string>(
            testId => window.XH.getModelByTestId<FormModel>(testId).reset(),
            this.testId
        );
    }

    //-------------------------
    // Field-level helpers
    //-------------------------

    setValues(values: PlainObject): Promise<void> {
        return this.page.evaluate<void, [string, PlainObject]>(
            ([testId, values]) => window.XH.getModelByTestId<FormModel>(testId).setValues(values),
            [this.testId, values]
        );
    }

    getFieldValue(fieldName: string): Promise<any> {
        return this.page.evaluate<any, [string, string]>(
            ([testId, fieldName]) =>
                window.XH.getModelByTestId<FormModel>(testId).getField(fieldName).value,
            [this.testId, fieldName]
        );
    }

    isFieldValid(fieldName: string): Promise<boolean> {
        return this.page.evaluate<boolean, [string, string]>(
            ([testId, fieldName]) =>
                window.XH.getModelByTestId<FormModel>(testId).getField(fieldName).isValid,
            [this.testId, fieldName]
        );
    }

    isFieldDisabled(fieldName: string): Promise<boolean> {
        return this.page.evaluate<boolean, [string, string]>(
            ([testId, fieldName]) =>
                window.XH.getModelByTestId<FormModel>(testId).getField(fieldName).disabled,
            [this.testId, fieldName]
        );
    }

    isFieldDirty(fieldName: string): Promise<boolean> {
        return this.page.evaluate<boolean, [string, string]>(
            ([testId, fieldName]) =>
                window.XH.getModelByTestId<FormModel>(testId).getField(fieldName).isDirty,
            [this.testId, fieldName]
        );
    }

    isFieldReadOnly(fieldName: string): Promise<boolean> {
        return this.page.evaluate<boolean, [string, string]>(
            ([testId, fieldName]) =>
                window.XH.getModelByTestId<FormModel>(testId).getField(fieldName).readonly,
            [this.testId, fieldName]
        );
    }

    isFieldValidating(fieldName: string): Promise<boolean> {
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
