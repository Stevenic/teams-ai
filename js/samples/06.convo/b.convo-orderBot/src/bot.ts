import { Application, TeamsAttachmentDownloader, ConvoPlanner, TeamsAdapter, GenerateImageTool, SendAdaptiveCardTool } from '@microsoft/teams-ai';
import { MemoryStorage, TurnContext } from 'botbuilder';
import path from 'path';
import { readFileSync } from 'fs'
import { PlaceOrderTool } from './tools/PlaceOrderTool';

if (!process.env.OPENAI_KEY && !process.env.AZURE_OPENAI_KEY) {
    throw new Error(
        'Missing environment variables - please check that (AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT) or OPENAI_KEY is set.'
    );
}

export function createBot(adapter: TeamsAdapter, botAppId: string): (context: TurnContext) => Promise<boolean> {
    // Load model, code, and data files
    const filesFolder = path.join(__dirname, '../files');
    const model = JSON.parse(readFileSync(path.join(filesFolder, 'model.json'), 'utf8'));
    const code = readFileSync(path.join(filesFolder, 'program.convo'), 'utf8');
    const menu = readFileSync(path.join(filesFolder, 'menu.md'), 'utf8');
    const order_card = readFileSync(path.join(filesFolder, 'order-card.json'), 'utf8');

    // Define program data
    const data = `<MENU>\n${menu}\n\n<ORDER_CARD>\n${order_card}`;

    // Define planner
    const planner = new ConvoPlanner({
        model: {
            ...model,
            apiKey: process.env.OPENAI_KEY,
            apiKeyOrTokenProvider: process.env.AZURE_OPENAI_KEY,
            logRequests: true
        },
        program: {
            code,
            data
        },
        tools: [
            new PlaceOrderTool(),
            new GenerateImageTool({
                apiKey: process.env.OPENAI_KEY!
            }),
            new SendAdaptiveCardTool()
        ]
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
