/**
 * Query streams recorded from the Toolbox `guide/query` endpoint (see `GuideService.groovy`), as
 * the raw `text/event-stream` bodies the server sent, for the codec and model specs.
 */

/** A two-document answer: a first draft, a `reset`, the full answer, then `final_summary`. */
export const RESET_STREAM = String.raw`data: {"type":"chunk","text":"Checking Property and"}

data: {"type":"chunk","text":" Appraisal"}

data: {"type":"chunk","text":" first. An appraisal"}

data: {"type":"chunk","text":" stays"}

data: {"type":"chunk","text":" valid for"}

data: {"type":"chunk","text":" 120 days from"}

data: {"type":"chunk","text":" its effective date."}

data: {"type":"chunk","text":" An update"}

data: {"type":"reset"}

data: {"type":"chunk","text":"Here is what"}

data: {"type":"chunk","text":" the guidelines say,"}

data: {"type":"chunk","text":" from Property"}

data: {"type":"chunk","text":" and Appraisal"}

data: {"type":"chunk","text":" and Policy"}

data: {"type":"chunk","text":" Exceptions:\n\n- An"}

data: {"type":"chunk","text":" appraisal stays valid"}

data: {"type":"chunk","text":" for 120"}

data: {"type":"chunk","text":" days from its"}

data: {"type":"chunk","text":" effective date. An"}

data: {"type":"chunk","text":" update with a"}

data: {"type":"chunk","text":" recertification"}

data: {"type":"chunk","text":" of value"}

data: {"type":"chunk","text":" extends it once,"}

data: {"type":"chunk","text":" by up"}

data: {"type":"chunk","text":" to"}

data: {"type":"chunk","text":" 60 days. [1]"}

data: {"type":"chunk","text":"\n-"}

data: {"type":"chunk","text":" The"}

data: {"type":"chunk","text":" desk"}

data: {"type":"chunk","text":" answers exception"}

data: {"type":"chunk","text":" requests within"}

data: {"type":"chunk","text":" two"}

data: {"type":"chunk","text":" business days."}

data: {"type":"chunk","text":" An"}

data: {"type":"chunk","text":" approved exception is"}

data: {"type":"chunk","text":" valid for the"}

data: {"type":"chunk","text":" life of"}

data: {"type":"chunk","text":" the"}

data: {"type":"chunk","text":" loan file,"}

data: {"type":"chunk","text":" and expires"}

data: {"type":"chunk","text":" if the file"}

data: {"type":"chunk","text":" is withdrawn."}

data: {"type":"chunk","text":" [2]"}

data: {"type":"chunk","text":"\n\nCheck the cited"}

data: {"type":"chunk","text":" passages before you"}

data: {"type":"chunk","text":" rely"}

data: {"type":"chunk","text":" on this"}

data: {"type":"chunk","text":" answer."}

data: {"type":"final_summary","answer":"Here is what the guidelines say, from Property and Appraisal and Policy Exceptions:\n\n- An appraisal stays valid for 120 days from its effective date. An update with a recertification of value extends it once, by up to 60 days. [1]\n- The desk answers exception requests within two business days. An approved exception is valid for the life of the loan file, and expires if the file is withdrawn. [2]\n\nCheck the cited passages before you rely on this answer.","sources":[{"documentId":"property-appraisal","friendlyName":"Property and Appraisal","excerpt":"An appraisal stays valid for 120 days from its effective date. An update with a recertification of value extends it once, by up to 60 days.","marker":1},{"documentId":"policy-exceptions","friendlyName":"Policy Exceptions","excerpt":"The desk answers exception requests within two business days. An approved exception is valid for the life of the loan file, and expires if the file is withdrawn.","marker":2}],"sourceType":"library","queryId":"f35aec16-c870-416d-8585-e045fa7226dd"}

`;

/** A retry of the same `idempotencyKey` after the run finished - the stored `final_summary` again. */
export const REPLAY_STREAM = String.raw`data: {"type":"final_summary","answer":"Here is what the guidelines say, from Property and Appraisal and Policy Exceptions:\n\n- An appraisal stays valid for 120 days from its effective date. An update with a recertification of value extends it once, by up to 60 days. [1]\n- The desk answers exception requests within two business days. An approved exception is valid for the life of the loan file, and expires if the file is withdrawn. [2]\n\nCheck the cited passages before you rely on this answer.","sources":[{"documentId":"property-appraisal","friendlyName":"Property and Appraisal","excerpt":"An appraisal stays valid for 120 days from its effective date. An update with a recertification of value extends it once, by up to 60 days.","marker":1},{"documentId":"policy-exceptions","friendlyName":"Policy Exceptions","excerpt":"The desk answers exception requests within two business days. An approved exception is valid for the life of the loan file, and expires if the file is withdrawn.","marker":2}],"sourceType":"library","queryId":"f35aec16-c870-416d-8585-e045fa7226dd","duplicate":true}

`;

/** A retry of the same `idempotencyKey` while the run is still going. */
export const DUPLICATE_STREAM = String.raw`data: {"type":"duplicate_in_progress","message":"An identical request is already being processed.","retryAfterSeconds":4}

`;

/** An answer that fails partway, after its reset. */
export const ERROR_STREAM = String.raw`data: {"type":"chunk","text":"Checking"}

data: {"type":"chunk","text":" Credit Standards first."}

data: {"type":"chunk","text":" A"}

data: {"type":"chunk","text":" credit report must"}

data: {"type":"chunk","text":" be no"}

data: {"type":"chunk","text":" more than"}

data: {"type":"chunk","text":" 120"}

data: {"type":"chunk","text":" days old on"}

data: {"type":"chunk","text":" the note date."}

data: {"type":"chunk","text":" Order"}

data: {"type":"reset"}

data: {"type":"chunk","text":"Here"}

data: {"type":"chunk","text":" is what the"}

data: {"type":"chunk","text":" guidelines say, from"}

data: {"type":"chunk","text":" Credit Standards"}

data: {"type":"chunk","text":" and Debt-to-Income Limits:"}

data: {"type":"chunk","text":"\n\n- A credit"}

data: {"type":"chunk","text":" report must be"}

data: {"type":"chunk","text":" no more"}

data: {"type":"chunk","text":" than"}

data: {"type":"chunk","text":" 120"}

data: {"type":"chunk","text":" days old"}

data: {"type":"chunk","text":" on"}

data: {"type":"chunk","text":" the note date."}

data: {"type":"error","message":"The answer failed partway. Try again."}

`;
