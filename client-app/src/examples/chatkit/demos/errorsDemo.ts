import {
    errorEvents,
    ScriptedChatTransport,
    scriptedDelay,
    textEvents
} from '@xh/hoist-chat-kit/transport';
import {Icon} from '@xh/hoist/icon';
import {markdown} from './scriptUtils';
import type {ChatKitDemo} from './Types';

/**
 * A reply that fails partway, with the error and a Retry button shown under it - then, on retry,
 * a long reply to stop with the composer's Stop button.
 */
export const errorsDemo: ChatKitDemo = {
    id: 'errors',
    title: 'Errors and stop',
    description: 'A failed reply to retry, a long one to stop',
    icon: Icon.warning(),
    heading: 'Get a failed reply, then a long one',
    intro:
        'The first reply fails partway with a server error - click Retry. The retry writes a ' +
        'long answer: click Stop in the composer at any point to cut it short.',
    suggestions: [
        {text: 'Summarize this quarter for the investment committee'},
        {text: 'Draft the monthly client letter'}
    ],
    createChatConfig: () => ({
        transport: new ScriptedChatTransport({
            delayMs: 30,
            // The first attempt at each user message fails. Retry and Regenerate then succeed.
            respond: (request, {attempt}) => (attempt === 0 ? createFailure() : createReply())
        })
    })
};

//------------------
// Implementation
//------------------

function createFailure() {
    return [
        scriptedDelay(500),
        textEvents(
            'Here is a summary of the quarter for the committee. Performance was driven by ' +
                'three themes, starting with'
        ),
        scriptedDelay(700),
        errorEvents('The model is overloaded. Please try again.', 'overloaded_error')
    ];
}

function createReply() {
    return [scriptedDelay(500), textEvents(LONG_REPLY, {chunkSize: 4})];
}

const LONG_REPLY = markdown(`
    ## Third quarter review

    The fund returned **4.2%** in the quarter, against **2.9%** for its benchmark. Three themes
    drove the result, and one detracted.

    ### What worked

    **1. Semiconductors early in the quarter.** We added to chip designers in July, ahead of a
    strong earnings season. The position returned 18% before we trimmed it in September, and it
    accounts for about half of the quarter's excess return. Demand for data center hardware
    continued to beat estimates, and the companies we own raised guidance for the year.

    **2. Software margins.** Our large software holdings kept costs flat while revenue grew in
    the low teens. Operating margins rose by two points on average. We expect this to continue
    into next year, as hiring stays slow and the gains from automation reach the income
    statement.

    **3. Rates.** We cut duration in August, ahead of the move higher in yields. The bond sleeve
    lost less than its benchmark as a result, and the cash we raised let us buy into the
    September sell-off at better prices.

    ### What did not

    Our consumer internet names lagged. Advertising spend slowed in August, and two of our
    holdings cut their outlook for the fourth quarter. We have reduced the position, but we
    still like the long-term case: these companies generate cash, buy back stock, and have room
    to grow in new markets.

    ### Positioning

    We enter the fourth quarter with a smaller tilt to technology than at mid-year, and more in
    healthcare and industrials. Cash is 4% of the fund, at the top of our range, which gives us
    room to act if markets fall further.

    ### Risks we are watching

    - **Valuations** in the largest technology names are high by historical standards.
    - **Rates** could rise further if inflation proves sticky.
    - **Elections** in several large economies may bring policy changes that affect trade.
    - **Concentration** in the benchmark makes it harder to beat without owning the same names.

    ### Outlook

    We remain constructive. Earnings are growing, balance sheets are strong, and the economy has
    slowed without stalling. We will keep adding to quality companies on weakness, and keep a
    close eye on the risks above. We look forward to discussing the quarter at the next meeting.
`);
