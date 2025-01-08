import { AzureOpenAIModelConfiguration, Memory, ModelBasedTool, ModelClient, OpenAIModelConfiguration, OpenAIModelFactory, ToolResponse } from "@microsoft/teams-ai";
import { TurnContext } from "botbuilder";

export interface EditAdaptiveCardToolParameters {
    details: string;
    card: string;
}

export interface EditAdaptiveCardToolConfiguration {
    model: OpenAIModelConfiguration | AzureOpenAIModelConfiguration;
    cardSchema: string;
}

export class EditAdaptiveCardTool extends ModelBasedTool<EditAdaptiveCardToolParameters> {
    private readonly _cardSchema: string;

    public constructor(configuration: EditAdaptiveCardToolConfiguration) {
        super(configuration.model, new OpenAIModelFactory(configuration.model));
        this._cardSchema = configuration.cardSchema;
    } 

    public readonly definition = {
        name: 'edit_adaptive_card',
        description: 'Applies changes to a previously created Adaptive Card template.',
        strict: true,
        parameters: {
            "type": "object",
            "required": [
                "details",
                "card"
            ],
            "properties": {
                "details": {
                    "type": "string",
                    "description": "Detailed description of the changes to make to the card template."
                },
                "card": {
                    "type": "string",
                    "description": "The Adaptive Card template to edit. Use the card template with [place holders] and not any generated sample cards."
                }
            },
            "additionalProperties": false
        }
    };

    public async beginTool(context: TurnContext, memory: Memory, client: ModelClient, parameters: EditAdaptiveCardToolParameters): Promise<ToolResponse> {
        // Populate memory with the card schema and details
        memory.setValue('temp.cardSchema', this._cardSchema);
        memory.setValue('temp.details', parameters.details);
        memory.setValue('temp.card', parameters.card);

        // Call the model
        const response = await this.completeText(context, memory, client, USER_MESSAGE, DEVELOPER_MESSAGE);
        if (client.isCancellationRequested) {
            return { status: 'cancelled' };
        } else if (response.status !== 'success') {
            return { status: 'error', content: `Error editing card: ${response.status} - ${response.error}` };
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
Buttons should use Action.Submit by default and include a "data" field called "verb" with the name of the action to perform.

<ADAPTIVE_CARD_TEMPLATE>
{{$temp.card}}`;

const USER_MESSAGE = `<CHANGE_DETAILS>
{{$temp.details}}

<INSTRUCTIONS>
Apply the CHANGE_DETAILS to the ADAPTIVE_CARD_TEMPLATE and return the modified card template.
Unless specified in the CHANGE_DETAILS, follow the recommendations listed under CARD_DEFAULTS.
The card will be rendered using Microsoft Teams and should use schema version 1.5 or less.
Use [place holders] to identify data binding fields. Tables, lists, and fact sets can show an [example row] or [example item].`;
