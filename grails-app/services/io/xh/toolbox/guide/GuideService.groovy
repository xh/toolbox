package io.xh.toolbox.guide

import io.xh.hoist.BaseService
import io.xh.hoist.exception.NotFoundException
import io.xh.hoist.exception.RoutineRuntimeException
import io.xh.hoist.json.JSONSerializer

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ThreadLocalRandom

import static io.xh.hoist.util.DateTimeUtils.HOURS
import static io.xh.hoist.util.DateTimeUtils.MINUTES
import static io.xh.hoist.util.StringUtils.elide

/**
 * Emulates a retrieval-augmented guideline assistant, for the Chat Kit's server mode demo: a backend
 * that owns its conversations and streams answers in a dialect of its own. It stands in for an
 * external RAG service, so that the client recipe can be built and tested without one. It makes no
 * LLM calls. Answers are scripted from keyword retrieval over a small library of invented lending
 * desk guidelines, in `src/main/resources/guide`.
 *
 * Query stream - Server-Sent Events, each frame `data: <json>` with no `event` field, typed by its
 * `type`:
 *   - `chunk {text}` - the next piece of the answer.
 *   - `reset {}` - discard the answer so far, as more chunks follow. Sent when an answer draws on
 *     more than one document: a first draft cites only the best passage, then the answer restarts.
 *   - `final_summary {answer, sources, sourceType, queryId, duplicate?}` - last, on success.
 *     `answer` is the authoritative text. Each source is `{documentId, friendlyName, excerpt,
 *     marker}`, where `marker` is the `n` of the `[n]` that cites it in the answer.
 *   - `error {message}` - the answer failed, and the stream ends. A question that contains `#fail`
 *     fails partway, to show this path.
 *   - `duplicate_in_progress {message, retryAfterSeconds}` - the only frame, when the request's
 *     `idempotencyKey` matches a run still in progress.
 *
 * Idempotency - a request whose `idempotencyKey` matches a finished run gets that run's
 * `final_summary` again, with `duplicate: true`, and starts no new run. A failed run frees its key.
 * Keys are kept for an hour.
 *
 * Conversations - the client mints the session id, and the first query with a new `sessionId`
 * creates the chat, titled from the question. A query with no `sessionId` is a one-off, saved
 * nowhere. A disconnect does not cancel a run, as the backend has no cancel: the run finishes at
 * once, unstreamed, and saves its answer, so a later load of the chat shows it.
 *
 * DEMO STORAGE - chats, messages, feedback and idempotency keys live in memory on this server node,
 * keyed by Hoist username. They are not shared across a cluster, and are lost on restart. Clear
 * Caches in the Admin Console resets them.
 */
class GuideService extends BaseService {

    private List<GuideDocument> documents = []

    // username -> sessionId -> chat
    private final Map<String, Map<String, GuideChat>> chatsByUser = new ConcurrentHashMap<>()

    // "username|idempotencyKey" -> run
    private final Map<String, GuideRun> runs = new ConcurrentHashMap<>()

    @Override
    protected void init() {
        documents = DOCUMENT_IDS.collect {
            def resource = applicationContext.getResource("classpath:guide/${it}.md")
            new GuideDocument(it, resource.inputStream.getText('UTF-8'))
        }
        createTimer(name: 'pruneTimer', runFn: this.&pruneRuns, interval: 10 * MINUTES)
    }

    List<GuideDocument> listDocuments() {
        return documents
    }

    /** A document of the library, by id. Throws a 404 for a document the library does not have. */
    GuideDocument getDocument(String documentId) {
        def ret = documents.find { it.id == documentId }
        if (!ret) throw new NotFoundException('Document not found.')
        return ret
    }

    //------------------------
    // Query
    //------------------------
    /**
     * Answer a question, passing the JSON of each SSE frame to `onFrame` as it is due.
     *
     * Throws before the first frame for an invalid request. `onFrame` returns false once the client
     * has gone. The run then finishes at once, with no more frames, and still saves its answer.
     *
     * @param request - `{question, sessionId?, documentIds?, idempotencyKey?}`. An empty or missing
     *      `documentIds` searches the whole library.
     */
    void query(Map request, String username, Closure<Boolean> onFrame) {
        def disallowed = request.keySet() - REQUEST_KEYS
        if (disallowed) {
            throw new RoutineRuntimeException("Request key(s) not accepted: ${disallowed.join(', ')}.")
        }
        def question = (request.question as String)?.trim()
        if (!question) throw new RoutineRuntimeException('A question is required.')
        if (question.size() > MAX_QUESTION_CHARS) {
            throw new RoutineRuntimeException("A question must be at most $MAX_QUESTION_CHARS characters.")
        }

        def documentIds = (request.documentIds ?: []) as List<String>,
            answer = composeAnswer(question, documentIds),
            failing = question.contains(FAIL_TRIGGER),
            steps = planSteps(answer, failing),
            run = new GuideRun(expectedEndAt: System.currentTimeMillis() + (steps.sum { it.delayMs } as long)),
            key = request.idempotencyKey ? "$username|$request.idempotencyKey" : null

        if (key) {
            // Claim the key, unless a run that has not failed holds it.
            def holder = runs.compute(key) { k, prev -> prev && !prev.failed ? prev : run }
            if (!holder.is(run)) {
                onFrame(serialize(
                    holder.finalSummary ?
                        holder.finalSummary + [duplicate: true] :
                        [
                            type             : 'duplicate_in_progress',
                            message          : 'An identical request is already being processed.',
                            retryAfterSeconds: holder.secondsLeft
                        ]
                ))
                return
            }
        }

        logDebug('Answering guide query', [sessionId: request.sessionId, sources: answer.sources.size()])
        def chat = request.sessionId ? openChat(username, request.sessionId as String, question) : null,
            streaming = true
        try {
            for (step in steps) {
                if (streaming) sleep(step.delayMs)
                streaming = streaming && onFrame(serialize(step.frame))
            }
            if (!streaming) logDebug('Client disconnected - finished guide query unstreamed')
            if (failing) {
                run.failed = true
                return
            }

            def finalSummary = [
                type      : 'final_summary',
                answer    : answer.text,
                sources   : answer.sources,
                sourceType: answer.sourceType,
                queryId   : UUID.randomUUID().toString()
            ]
            // Save before the final frame, so a load right after the stream ends sees the answer.
            if (chat && userChats(username).get(chat.sessionId)?.is(chat)) {
                chat.addMessage([
                    queryId    : finalSummary.queryId,
                    question   : question,
                    answer     : answer.text,
                    sources    : answer.sources,
                    sourceType : answer.sourceType,
                    documentIds: documentIds,
                    createdAt  : System.currentTimeMillis().intdiv(1000)
                ])
            }
            run.finalSummary = finalSummary
            if (streaming) onFrame(serialize(finalSummary))
        } catch (Throwable t) {
            run.failed = true
            throw t
        } finally {
            if (chat) closeChat(username, chat)
        }
    }

    //------------------------
    // Chats, messages and feedback
    //------------------------
    /** The user's chats, most recently active first. */
    List<GuideChat> listChats(String username) {
        return userChats(username).values().sort { -it.lastActivityAt }
    }

    /** A chat's messages, oldest first. Throws a 404 for a chat the user does not have. */
    List<Map> listMessages(String username, String sessionId) {
        return getChat(username, sessionId).messages
    }

    Map renameChat(String username, String sessionId, String title) {
        title = title?.trim()
        if (!title) throw new RoutineRuntimeException('A title is required.')
        def chat = getChat(username, sessionId)
        chat.title = elide(title, MAX_TITLE_CHARS)
        return [sessionId: sessionId, title: chat.title]
    }

    Map deleteChat(String username, String sessionId) {
        if (!userChats(username).remove(sessionId)) throw new NotFoundException('Chat not found.')
        return [sessionId: sessionId, deleted: true]
    }

    /**
     * Rate an answer `up` or `down`, by the `queryId` of its `final_summary`. A down rating needs a
     * comment. A rating cannot be cleared, only changed, as with the real backend this emulates.
     */
    Map submitFeedback(String username, String queryId, String rating, String comment) {
        comment = comment?.trim()
        if (!(rating in ['up', 'down'])) {
            throw new RoutineRuntimeException('Rating must be "up" or "down".')
        }
        if (rating == 'down' && !comment) {
            throw new RoutineRuntimeException('A comment is required for a down rating.')
        }
        def message = userChats(username).values().findResult { chat ->
            chat.messages.find { it.queryId == queryId }
        }
        if (!message) throw new NotFoundException('Message not found.')

        message.feedback = rating
        message.comment = elide(comment, MAX_COMMENT_CHARS)
        return [queryId: queryId, rating: rating]
    }

    //------------------------
    // Implementation
    //------------------------
    private Map<String, GuideChat> userChats(String username) {
        return chatsByUser.computeIfAbsent(username) { new ConcurrentHashMap<>() }
    }

    private GuideChat getChat(String username, String sessionId) {
        def ret = userChats(username).get(sessionId)
        if (!ret) throw new NotFoundException('Chat not found.')
        return ret
    }

    /** The chat for a run, created on the first query of its session. */
    private GuideChat openChat(String username, String sessionId, String question) {
        def ret = userChats(username).computeIfAbsent(sessionId) {
            new GuideChat(sessionId, elide(question, NEW_TITLE_CHARS))
        }
        ret.startRun()
        return ret
    }

    /** End a run in its chat, and drop a chat whose only run failed. */
    private void closeChat(String username, GuideChat chat) {
        chat.endRun()
        if (!chat.running && !chat.messages) userChats(username).remove(chat.sessionId, chat)
    }

    /**
     * The answer to a question, from the passages that match the most of its terms. Returns its
     * `text`, its `sources`, its `sourceType` and - for an answer from more than one document - a
     * shorter `draft`, which streams first and is then reset.
     */
    private Map composeAnswer(String question, List<String> documentIds) {
        def terms = tokenize(question),
            minScore = terms.size() > 2 ? 2 : 1,
            library = documentIds ? documents.findAll { it.id in documentIds } : documents,
            hits = library
                .collectMany { doc -> doc.passages.collect { [doc: doc, passage: it] } }
                .each { it.score = tokenize(it.passage).intersect(terms).size() }
                .findAll { it.score >= minScore }
                .sort { -it.score }
                .take(MAX_SOURCES)

        if (!hits) return [text: NOT_FOUND_ANSWER, sources: [], sourceType: 'none']

        def docNames = hits.collect { it.doc.name }.unique(),
            sources = hits.withIndex().collect { hit, idx ->
                [
                    documentId  : hit.doc.id,
                    friendlyName: hit.doc.name,
                    excerpt     : elide(hit.passage, MAX_EXCERPT_CHARS),
                    marker      : idx + 1
                ]
            }
        def text = [
            "Here is what the guidelines say, from ${joinNames(docNames)}:",
            hits.withIndex().collect { hit, idx -> "- ${hit.passage} [${idx + 1}]" }.join('\n'),
            'Check the cited passages before you rely on this answer.'
        ].join('\n\n')

        return [
            text      : text,
            sources   : sources,
            sourceType: 'library',
            draft     : docNames.size() > 1 ? "Checking ${docNames[0]} first. ${hits[0].passage} [1]" : null
        ]
    }

    /**
     * The frames of an answer, each with the pause before it: the draft and a reset if there is one,
     * then the answer in chunks of one to three words. A failing answer stops a third of the way in
     * with an error. The first frame waits as long as a retrieval step might.
     */
    private List<Map> planSteps(Map answer, boolean failing) {
        def steps = []
        if (answer.draft) {
            def draft = chunk(answer.draft as String)
            steps += draft.take(Math.max(2, (draft.size() * 0.6) as int)).collect { chunkStep(it) }
            steps << [frame: [type: 'reset'], delayMs: random(300, 600)]
        }

        def chunks = chunk(answer.text as String)
        if (failing) {
            steps += chunks.take(chunks.size().intdiv(3)).collect { chunkStep(it) }
            steps << [frame: [type: 'error', message: 'The answer failed partway. Try again.'], delayMs: 400]
        } else {
            steps += chunks.collect { chunkStep(it) }
        }

        steps[0].delayMs += random(500, 900)
        return steps
    }

    private Map chunkStep(String text) {
        return [frame: [type: 'chunk', text: text], delayMs: random(25, 70)]
    }

    /** Split text into chunks of one to three words, each with the whitespace before it. */
    private List<String> chunk(String text) {
        def words = text.findAll(/\s*\S+/),
            ret = []
        for (int i = 0; i < words.size(); ) {
            def end = Math.min(i + random(1, 4), words.size())
            ret << words.subList(i, end).join('')
            i = end
        }
        return ret
    }

    /** The distinct search terms in some text - lower case, without stop words or plural `s`. */
    private List<String> tokenize(String text) {
        def expanded = ALIASES.inject(text.toLowerCase()) { str, alias, words ->
            str.replaceAll(/\b$alias\b/, words)
        }
        return expanded
            .split(/[^a-z0-9]+/)
            .findAll { it.size() > 2 && !(it in STOP_WORDS) }
            .collect { it.size() > 3 && it.endsWith('s') ? it[0..-2] : it }
            .unique()
    }

    /** Names as prose - `A`, `A and B`, or `A, B and C`. */
    private static String joinNames(List<String> names) {
        return names.size() > 1 ? "${names[0..-2].join(', ')} and ${names.last()}" : names[0]
    }

    private static int random(int min, int max) {
        return ThreadLocalRandom.current().nextInt(min, max)
    }

    private static String serialize(Map frame) {
        return JSONSerializer.serialize(frame)
    }

    /** Drop finished runs, and their idempotency keys, after an hour. */
    private void pruneRuns() {
        def cutoff = System.currentTimeMillis() - HOURS
        runs.values().removeIf { !it.running && it.createdAt < cutoff }
    }

    @Override
    void clearCaches() {
        super.clearCaches()
        chatsByUser.clear()
        runs.clear()
    }

    @Override
    Map getAdminStats() {
        return [
            documents      : documents.size(),
            users          : chatsByUser.size(),
            chats          : chatsByUser.values().sum { it.size() } ?: 0,
            idempotencyKeys: runs.size()
        ]
    }

    private static final List<String> DOCUMENT_IDS = [
        'credit-standards', 'income-verification', 'debt-to-income',
        'assets-reserves', 'property-appraisal', 'policy-exceptions'
    ]

    private static final List<String> REQUEST_KEYS = ['question', 'sessionId', 'documentIds', 'idempotencyKey']

    /** Abbreviations a question may use, expanded to the words the guidelines use. */
    private static final Map<String, String> ALIASES = [
        dti : 'debt to income',
        fico: 'credit score',
        max : 'maximum',
        min : 'minimum',
        voe : 'verification of employment'
    ]

    private static final Set<String> STOP_WORDS = [
        'about', 'and', 'any', 'are', 'can', 'desk', 'does', 'for', 'from', 'guideline', 'guidelines',
        'have', 'how', 'loan', 'loans', 'many', 'much', 'our', 'should', 'that', 'the', 'there', 'this',
        'what', 'when', 'which', 'who', 'why', 'with', 'you', 'your'
    ] as Set

    private static final String FAIL_TRIGGER = '#fail'
    private static final String NOT_FOUND_ANSWER =
        'I could not find this in the guideline library. Try rephrasing the question, or search more documents.'

    private static final int MAX_QUESTION_CHARS = 4000
    private static final int MAX_SOURCES = 3
    private static final int MAX_EXCERPT_CHARS = 300
    private static final int NEW_TITLE_CHARS = 60
    private static final int MAX_TITLE_CHARS = 80
    private static final int MAX_COMMENT_CHARS = 2000
}
