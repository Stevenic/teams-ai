import { AzureOpenAIModelConfiguration, Memory, ModelBasedTool, ModelClient, OpenAIModelConfiguration, OpenAIModelFactory, ToolResponse } from "@microsoft/teams-ai";
import { TurnContext } from "botbuilder";

export interface CreateAdaptiveCardToolParameters {
    details: string;
}

export interface CreateAdaptiveCardToolConfiguration {
    model: OpenAIModelConfiguration | AzureOpenAIModelConfiguration;
    cardSchema: string;
}

export class CreateAdaptiveCardTool extends ModelBasedTool<CreateAdaptiveCardToolParameters> {
    private readonly _cardSchema: string;

    public constructor(configuration: CreateAdaptiveCardToolConfiguration) {
        super(configuration.model, new OpenAIModelFactory(configuration.model));
        this._cardSchema = configuration.cardSchema;
    } 

    public readonly definition = {
        name: 'create_adaptive_card',
        description: 'Creates a new JSON based template for creating Adaptive Cards. The returned template includes [place holders] for data binding the card.',
        strict: true,
        parameters: {
            "type": "object",
            "required": [
                "details"
            ],
            "properties": {
                "details": {
                    "type": "string",
                    "description": "Detailed description of the Adaptive Card template to create."
                }
            },
            "additionalProperties": false
        }
    };

    public async beginTool(context: TurnContext, memory: Memory, client: ModelClient, parameters: CreateAdaptiveCardToolParameters): Promise<ToolResponse> {
        // Populate memory with the card schema and details
        memory.setValue('temp.cardSchema', this._cardSchema);
        memory.setValue('temp.details', parameters.details);

        // Call the model
        const response = await this.completeText(context, memory, client, USER_MESSAGE, DEVELOPER_MESSAGE);
        if (client.isCancellationRequested) {
            return { status: 'cancelled' };
        } else if (response.status !== 'success') {
            return { status: 'error', content: `Error creating card: ${response.status} - ${response.error}` };
        }

        // Return the generated card
        const content = response.message?.content;
        return Promise.resolve({ status: 'completed', content });
    }
}

const DEVELOPER_MESSAGE = `<ADAPTIVE_CARD_SCHEMA>
{{$temp.cardSchema}}

<CARD_DEFAULTS>
The TableCell "style" should use "emphasis" for column labels.
Buttons should use Action.Submit by default and include a "data" field called "verb" with the name of the action to perform.`;

const USER_MESSAGE = `<DETAILS>
{{$temp.details}}

<INSTRUCTIONS>
Generate a new Adaptive Card template based on the DETAILS provided.
Unless specified in the DETAILS, follow the recommendations listed under CARD_DEFAULTS.
The card will be rendered using Microsoft Teams and should use schema version 1.5 or less.
Use [place holders] to identify data binding fields. Tables, lists, and fact sets can show an [example row] or [example item].`;
