const {GoogleGenerativeAI, HarmCategory, HarmBlockThreshold} = require('@google/generative-ai'),
    {GoogleAIFileManager} = require('@google/generative-ai/server'),
    fs = require('fs'),
    _ = require('lodash');

require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY,
    genAI = new GoogleGenerativeAI(apiKey),
    fileManager = new GoogleAIFileManager(apiKey);

const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash'
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain'
};

async function run() {
    const outFile = createOutputFileForCurrRun();

    const files = [await uploadToGemini('docs/master-list.pdf', 'application/pdf')];
    await waitForFilesActive(files);

    const chatSession = model.startChat({
        generationConfig,
        history: []
    });

    const initPrompt = [
        {
            fileData: {
                mimeType: files[0].mimeType,
                fileUri: files[0].uri
            }
        },
        {
            text: `
I am building MusicClub, an application for my local music appreciation club.

## About me and you
- I know how to build the application and what I want to do there. You are assisting me with
extracting the raw data I need in a structured format so I can then commence my work.

## About MusicClub
- The members of the club meet monthly at a host member's home or other location. The host selects
a year, e.g. 1983, and everyone comes to the club on the meeting night with a song from that year
to play.

- In some meetings a member might play multiple primary songs.

- At most meetings, members might also play songs in a "bonus round". These are typically - but not
always - also from the same year, and are alternate picks the member found. These are less important
than the primary picks, which are featured in the main list for each meeting, Sometimes the section
with bonus tracks is labelled "extra credit" or "encore".

- Some meetings do not fit the standard format - eg meeting 89 "The first meeting of Docuclüb." -
and do not have a featured year. These meetings can be omitted from the data extraction. Leave a
gap in the meeting numbers if this occurs.

- The club secretary has provided the history of club meetings into the attached PDF. This will be
the raw source of our data, which we will need to extract.

## Schema for Data Extraction
You will analyze the provided PDF document and extract the data it contains into a JSON schema.
The primary object will be the Meeting, which represents each individual meeting of the club.
It will include the date, the location, the year of music, and the songs played by each member.
Each song played will be represented as a separate Play object, which will include the member's
name and the identifying song information, as much as can be extracted.

- Any data points that cannot be extracted can be returned as null.
- Use the meeting number as the ID for the Meeting object.
- Use {meeting-id}-{play-number} as the ID for the Play object.
- Use YYYY-MM-DD format for the meeting dates.
- If there is additional unstructured text associated with either a Meeting or Play, include it in
the notes field.
- If data for a possible play is very minimal, it is OK to omit it entirely. We want to favor
extracting clean and usable data over extracting everything in the document.
- Some

SCHEMA:
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "Play": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "member": { "type": "string" },
        "artist": { "type": "string" },
        "title": { "type": "string" },
        "album": { "type": "string" },
        "isBonus": { "type": "boolean" },
        "notes": { "type": "string" }
      },
      "required": ["id", "member", "artist", "title", "album", "isBonus", "notes"]
    },
    "Meeting": {
      "type": "object",
      "properties": {
        "id": { "type": "number" },
        "date": { "type": "string", "format": "date" },
        "year": { "type": "string" },
        "location": { "type": "string" },
        "notes": { "type": "string" },
        "plays": {
          "type": "array",
          "items": { "$ref": "#/definitions/Play" }
        }
      },
      "required": ["id", "date", "year", "location", "plays"]
    }
  }
}

## Next Steps
Extract the data for meetings 1-4 and return as JSON`
        }
    ];

    const result = await chatSession.sendMessage(initPrompt);
    processResults(outFile, '1-4', result.response.text());

    [
        '5-8',
        '9-12',
        '13-16',
        '17-20',
        '21-24',
        '25-28',
        '29-32',
        '33-36',
        '37-40',
        '41-44',
        '45-48',
        '49-52',
        '53-56',
        '57-60',
        '61-64',
        '65-68',
        '69-72',
        '73-76',
        '77-80',
        '81-84',
        '85-88',
        '89-92',
        '93-96',
        '97-100',
        '101-103'
    ].forEach(async mtgs => {
        try {
            console.log(`Asking gemini to extract meetings ${mtgs}...`);
            const result = await chatSession.sendMessage(
                    `Extract the data for meetings ${mtgs} and return as JSON`
                ),
                txt = result.response.text();
            processResults(outFile, mtgs, txt);
        } catch (e) {
            console.error('Error extracting meetings:' + mtgs, e);
        }
    });
}

function processResults(outfile: string, meetings: string, txt: string) {
    console.log(`Processing results for meetings ${meetings}`);
    txt = txt.replace(/^```json/g, '').replace(/```$/g, '');
    try {
        const newMtgs: [] = JSON.parse(txt);
        console.log(`Processed JSON OK for meetings ${meetings}`);
        if (!_.isArray(newMtgs)) throw new Error(`Output is not an array`);

        const currJSON = fs.readFileSync(outfile, 'utf8'),
            currMtgs: [] = JSON.parse(currJSON),
            comboMtgs = [...currMtgs, ...newMtgs];

        fs.writeFileSync(outfile, JSON.stringify(comboMtgs, null, 2));
    } catch (e) {
        console.error('Error parsing JSON:', e);
        console.log('Response:', txt);
    }
}

function createOutputFileForCurrRun(): string {
    const fileName = `./out/run-${Date.now()}.json`;
    fs.writeFileSync(fileName, '[]');
    console.log(`Created output file: ${fileName}`);
    return fileName;
}

/**
 * Uploads the given file to Gemini.
 * See https://ai.google.dev/gemini-api/docs/prompting_with_media
 */
async function uploadToGemini(path, mimeType) {
    const uploadResult = await fileManager.uploadFile(path, {
        mimeType,
        displayName: path
    });
    const file = uploadResult.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
    return file;
}

/**
 * Waits for the given files to be active.
 *
 * Some files uploaded to the Gemini API need to be processed before they can
 * be used as prompt inputs. The status can be seen by querying the file's
 * "state" field.
 *
 * This implementation uses a simple blocking polling loop. Production code
 * should probably employ a more sophisticated approach.
 */
async function waitForFilesActive(files) {
    console.log('Waiting for file processing...');
    for (const name of files.map(file => file.name)) {
        let file = await fileManager.getFile(name);
        while (file.state === 'PROCESSING') {
            process.stdout.write('.');
            await new Promise(resolve => setTimeout(resolve, 10_000));
            file = await fileManager.getFile(name);
        }
        if (file.state !== 'ACTIVE') {
            throw Error(`File ${file.name} failed to process`);
        }
    }
    console.log('...all files ready\n');
}

run();
