import { Application, TeamsAttachmentDownloader, ConvoPlanner, TeamsAdapter, GenerateImageTool, NewSessionTool, SendAdaptiveCardTool, ToolDefinition } from '@microsoft/teams-ai';
import { MemoryStorage, TurnContext } from 'botbuilder';
import path from 'path';
import { readFileSync } from 'fs'
import { CreateAdaptiveCardTool } from './tools/CreateAdaptiveCardTool';
import { EditAdaptiveCardTool } from './tools/EditAdaptiveCardTool';
import { CreateTeamsManifestTool } from './tools/CreateTeamsManifestTool';
import { EditTeamsManifestTool } from './tools/EditTeamsManifestTool';

if (!process.env.OPENAI_KEY && !process.env.AZURE_OPENAI_KEY) {
    throw new Error(
        'Missing environment variables - please check that (AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT) or OPENAI_KEY is set.'
    );
}

export function createBot(adapter: TeamsAdapter, botAppId: string): (context: TurnContext) => Promise<boolean> {
    // Load model, code, and data files
    const filesFolder = path.join(__dirname, '../files');
    const persona = readFileSync(path.join(filesFolder, 'persona.txt'), 'utf8');
    const modelConfig = JSON.parse(readFileSync(path.join(filesFolder, 'model.json'), 'utf8'));
    const code = readFileSync(path.join(filesFolder, 'program.convo'), 'utf8');
    const convoSpec = readFileSync(path.join(filesFolder, 'convo-spec.md'), 'utf8');
    const manifestSchema = readFileSync(path.join(filesFolder, 'manifest-schema.yaml'), 'utf8');
    const cardSchema = readFileSync(path.join(filesFolder, 'card-schema.yaml'), 'utf8');

    // Initialize PROGRAM_DATA
    const data = `<CONVO_SPEC>\n${convoSpec}`;

    // Define model
    const model = {
        ...modelConfig,
        apiKey: process.env.OPENAI_KEY,
        apiKeyOrTokenProvider: process.env.AZURE_OPENAI_KEY,
        logRequests: true
    };

    // Define list of tools
    const tools: ToolDefinition<any>[] = [
        new NewSessionTool(),
        new SendAdaptiveCardTool(),
        new CreateAdaptiveCardTool({ model, cardSchema }),
        new EditAdaptiveCardTool({ model, cardSchema }),
        new CreateTeamsManifestTool({ model, manifestSchema }),
        new EditTeamsManifestTool({ model, manifestSchema }),
    ];

    // Add GenerateImageTool if OpenAI key is set
    if (process.env.OPENAI_KEY) {
        tools.push(new GenerateImageTool({ apiKey: process.env.OPENAI_KEY }));
    }

    // Define planner
    const planner = new ConvoPlanner({
        persona,
        model,
        program: {
            code,
            data
        },
        tools
    });

    // Create attachment downloader
    const attachmentDownloader = new TeamsAttachmentDownloader({ adapter, botAppId });

    // Define storage and application
    const storage = new MemoryStorage();
    const app = new Application({
        adapter,
        botAppId,
        storage,
        ai: {
            planner
        },
        fileDownloaders: [
            attachmentDownloader
        ],
        longRunningMessages: true
    });

    // Export bots run() function
    return (context: TurnContext) => app.run(context);
}
