import { AzureOpenAIModelConfiguration, Memory, ModelBasedTool, ModelClient, OpenAIModelConfiguration, OpenAIModelFactory, ToolResponse } from "@microsoft/teams-ai";
import { TurnContext } from "botbuilder";

export interface EditTeamsManifestToolParameters {
    details: string;
    manifest: string;
}

export interface EditTeamsManifestToolConfiguration {
    model: OpenAIModelConfiguration | AzureOpenAIModelConfiguration;
    manifestSchema: string;
}

export class EditTeamsManifestTool extends ModelBasedTool<EditTeamsManifestToolParameters> {
    private readonly _manifestSchema: string;

    public constructor(configuration: EditTeamsManifestToolConfiguration) {
        super(configuration.model, new OpenAIModelFactory(configuration.model));
        this._manifestSchema = configuration.manifestSchema;
    } 

    public readonly definition = {
        name: 'edit_teams_manifest',
        description: 'Applies changes to a previously created Teams Manifest.',
        strict: true,
        parameters: {
            "type": "object",
            "required": [
                "details",
                "manifest"
            ],
            "properties": {
                "details": {
                    "type": "string",
                    "description": "Detailed description of the changes to make to the card template."
                },
                "manifest": {
                    "type": "string",
                    "description": "The manifest JSON to edit."
                }

            },
            "additionalProperties": false
        }
    };

    public async beginTool(context: TurnContext, memory: Memory, client: ModelClient, parameters: EditTeamsManifestToolParameters): Promise<ToolResponse> {
        // Populate memory with the manifest schema and details
        memory.setValue('temp.manifestSchema', this._manifestSchema);
        memory.setValue('temp.details', parameters.details);
        memory.setValue('temp.manifest', parameters.manifest);

        // Call the model
        const response = await this.completeText(context, memory, client, USER_MESSAGE, DEVELOPER_MESSAGE);
        if (client.isCancellationRequested) {
            return { status: 'cancelled' };
        } else if (response.status !== 'success') {
            return { status: 'error', content: `Error editing manifest: ${response.status} - ${response.error}` };
        }

        // Return the generated card
        const content = response.message?.content;
        return Promise.resolve({ status: 'completed', content });
    }
}

const DEVELOPER_MESSAGE = `<TEAMS_MANIFEST_SCHEMA>
{{$temp.cardSchema}}

<TEAMS_MANIFEST>
{{$temp.manifest}}`;

const USER_MESSAGE = `<CHANGE_DETAILS>
{{$temp.details}}

<INSTRUCTIONS>
Apply the CHANGE_DETAILS to the TEAMS_MANIFEST and return the modified manifest as JSON.`;
