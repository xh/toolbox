import {describe, expect, it} from 'vitest';
import {stripLeakedTags} from './GuideApi';

/**
 * The backend's model can leak markup into an answer. The chat and the store both clean it with
 * stripLeakedTags, so it must drop the blocks whose content is not for the user, keep the text of
 * stray tags, and handle a block that is still streaming.
 */
describe('stripLeakedTags', () => {
    it('drops thinking and function call blocks with their content', () => {
        const text =
            '<thinking>Check reserves.</thinking>No. ' +
            '<function_calls><invoke name="search"><parameter name="q">gifts</parameter>' +
            '</invoke></function_calls>[1]';
        expect(stripLeakedTags(text)).toBe('No. [1]');
    });

    it('drops a block that is still streaming', () => {
        expect(stripLeakedTags('No. [1]<thinking>But wait')).toBe('No. [1]');
        expect(stripLeakedTags('No. [1]<function_calls><invoke name="se')).toBe('No. [1]');
    });

    it('drops stray tags and keeps their text', () => {
        const text =
            '<answer>No. <reason>Gifts cannot cover reserves.</reason> ' +
            '<invoke name="x">[1]</invoke><parameter name="y"></parameter></answer>';
        expect(stripLeakedTags(text)).toBe('No. Gifts cannot cover reserves. [1]');
    });

    it('drops a tag cut off at the end of streaming text', () => {
        ['<', '</', '<thin', '<function_ca', '</invo', '<parameter name="q', '<reason'].forEach(
            tail => expect(stripLeakedTags(`No. [1]${tail}`, true)).toBe('No. [1]')
        );
    });

    it('keeps a cut-off tag in finished text, and prose that is not a tag', () => {
        expect(stripLeakedTags('No. [1]<thin')).toBe('No. [1]<thin');
        expect(stripLeakedTags('DTI < 43', true)).toBe('DTI < 43');
        expect(stripLeakedTags('See <b', true)).toBe('See <b');
        expect(stripLeakedTags('See <answers here', true)).toBe('See <answers here');
    });

    it('leaves clean text alone', () => {
        expect(stripLeakedTags('Use a 3% cap if DTI < 43% and LTV > 80%. [1]')).toBe(
            'Use a 3% cap if DTI < 43% and LTV > 80%. [1]'
        );
    });
});
