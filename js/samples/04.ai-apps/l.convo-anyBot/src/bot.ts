import { Application, AI, PromptManager, OpenAIModel, ActionPlanner, DefaultConversationState, TurnState } from '@microsoft/teams-ai';
import { MemoryStorage, TurnContext } from 'botbuilder';
import path from 'path';

if (!(process.env.AZURE_OPENAI_KEY && process.env.AZURE_OPENAI_ENDPOINT) && !process.env.OPENAI_KEY) {
    throw new Error(
        'Missing environment variables - please check that (AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT) or OPENAI_KEY is set.'
    );
}

// Create AI components
const model = new OpenAIModel({
    // OpenAI Support
    apiKey: process.env.OPENAI_KEY!,
    defaultModel: 'gpt-4o',

    // Azure OpenAI Support
    azureApiKey: process.env.AZURE_OPENAI_KEY!,
    azureDefaultDeployment: 'gpt-4o',
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    azureApiVersion: '2023-03-15-preview',

    // Request logging
    logRequests: false,
    stream: true
});

const prompts = new PromptManager({
    promptsFolder: path.join(__dirname, '../src/prompts')
});

const planner = new ActionPlanner({
    model,
    prompts,
    defaultPrompt: 'tools'
});

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ConversationState extends DefaultConversationState {
    memories: Record<string, string>;
    sub_program: string;
}
type ApplicationTurnState = TurnState<ConversationState>;


// Define storage and application
const storage = new MemoryStorage();
const app = new Application<ApplicationTurnState>({
    storage,
    ai: {
        planner
    }
});

// Export bots run() function
export const run = (context: TurnContext) => app.run(context);

app.message('/reset', async (context, state) => {
    state.deleteConversationState();
    await context.sendActivity(`Ok lets start this over.`);
});

interface CreateProgram {
    code: string;
}

app.ai.action<CreateProgram>('create_program', async (context, state, program) => {
    // Ensure the conversation state has a memories object
    state.conversation.memories = state.conversation.memories || {};

    // Store the program and clear memory
    state.conversation.sub_program = program.code;
    state.conversation.memories = {};
    console.log(`<NEW_PROGRAM>\n${program.code}`);
    return `program stored`;
});

interface MemoryUpdate {
    name: string;
    value: string;
}

app.ai.action<MemoryUpdate>('update_memory', async (context, state, update) => {
    // Ensure the conversation state has a memories object
    state.conversation.memories = state.conversation.memories || {};

    // Update the memory
    state.conversation.memories[update.name] = update.value;
    console.log(`Memory updated: ${update.name} = ${update.value}`);
    return `memory updated`;
});

app.ai.action(AI.HttpErrorActionName, async (context, state, data) => {
    await context.sendActivity('An AI request failed. Please try again later.');
    return AI.StopCommandName;
});
