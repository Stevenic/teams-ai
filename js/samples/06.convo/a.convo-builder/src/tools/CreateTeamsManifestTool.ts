import { AzureOpenAIModelConfiguration, Memory, ModelBasedTool, ModelClient, OpenAIModelConfiguration, OpenAIModelFactory, ToolResponse } from "@microsoft/teams-ai";
import { TurnContext } from "botbuilder";
import { v4 } from "uuid";

export interface CreateTeamsManifestToolParameters {
    details: string;
}

export interface CreateTeamsManifestToolConfiguration {
    model: OpenAIModelConfiguration | AzureOpenAIModelConfiguration;
    manifestSchema: string;
}

export class CreateTeamsManifestTool extends ModelBasedTool<CreateTeamsManifestToolParameters> {
    private readonly _manifestSchema: string;

    public constructor(configuration: CreateTeamsManifestToolConfiguration) {
        super(configuration.model, new OpenAIModelFactory(configuration.model));
        this._manifestSchema = configuration.manifestSchema;
    } 

    public readonly definition = {
        name: 'create_teams_manifest',
        description: 'Creates a new JSON manifest for a Teams chatbot.',
        strict: true,
        parameters: {
            "type": "object",
            "required": [
                "details"
            ],
            "properties": {
                "details": {
                    "type": "string",
                    "description": "Detailed description of the bot to create the manifest for. Include the bots name, description, website, and any specific feature requests from the user."
                }
            },
            "additionalProperties": false
        }
    };

    public async beginTool(context: TurnContext, memory: Memory, client: ModelClient, parameters: CreateTeamsManifestToolParameters): Promise<ToolResponse> {
        // Populate memory with the manifest schema and details
        memory.setValue('temp.manifestSchema', this._manifestSchema);
        memory.setValue('temp.details', parameters.details);
        memory.setValue('temp.appId', v4());

        // Call the model
        const response = await this.completeText(context, memory, client, USER_MESSAGE, DEVELOPER_MESSAGE);
        if (client.isCancellationRequested) {
            return { status: 'cancelled' };
        } else if (response.status !== 'success') {
            return { status: 'error', content: `Error creating manifest: ${response.status} - ${response.error}` };
        }

        // Return the generated card
        const content = response.message?.content;
        return Promise.resolve({ status: 'completed', content });
    }
}

const DEVELOPER_MESSAGE = `<TEAMS_MANIFEST_SCHEMA>
{{$temp.cardSchema}}

<EXAMPLE_MANIFEST>
{
    "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.19/MicrosoftTeams.schema.json",
    "version": "1.0.0",
    "manifestVersion": "1.19",
    "id": "{{$temp.appId}}",
    "packageName": "[bots-domain].[short-name]",
    "name": {
        "short": "[short-name]",
        "full": "[Bots Full Name]"
    },
    "developer": {
        "name": "[organization if known or placeholder]",
        "websiteUrl": "https://[bot-domain]",
        "privacyUrl": "https://[bot-domain]/privacy",
        "termsOfUseUrl": "https://[bot-domain]/terms"
    },
    "description": {
        "short": "[short description of chatbot]",
        "full": "This chatbot is designed to [describe functionality based on chatbot requirements]."
    },
    "icons": {
        "outline": "outline.png",
        "color": "color.png"
    },
    "accentColor": "[requested accent color or #FFFFFF]",
    "staticTabs": [
        {
            "entityId": "conversations",
            "scopes": ["personal"]
        },
        {
            "entityId": "about",
            "scopes": ["personal"]
        }
    ],
    "bots": [
        {
            "botId": "[bot-id if known or placeholder]",
            "scopes": ["personal", "team", "groupChat"],
            "isNotificationOnly": false,
            "supportsCalling": false,
            "supportsVideo": false,
            "supportsFiles": false
        }
    ],
    "validDomains": [
        "[bot-domain]"
    ]
}


<NEW_APP_ID>
{{$temp.appId}}`;

const USER_MESSAGE = `<DETAILS>
{{$temp.details}}

<INSTRUCTIONS>
Use the provided DETAILS to create a new JSON manifest for a Teams chatbot.`;
