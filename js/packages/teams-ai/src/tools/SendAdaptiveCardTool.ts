/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext, CardFactory } from "botbuilder-core";
import { Validator, ValidationError } from 'jsonschema';
import { Memory } from "../MemoryFork";
import { ToolDefinition, ToolResponse } from "./ToolDefinition";
import { ModelClient } from "../types";
import { ADAPTIVE_CARD_SCHEMA } from "./AdaptiveCardSchema";

const FIXING_CARD_VARIABLE = 'temp.SendAdaptiveCardTool_fixingCard';

export interface SendAdaptiveCardToolParameters {
    card: string;
}

export class SendAdaptiveCardTool implements ToolDefinition<SendAdaptiveCardToolParameters> {
    public readonly definition = {
        name: 'send_adaptive_card',
        description: 'Sends an adaptive card to the user. The card will be rendered using Microsoft Teams so should be version 1.5 or earlier.',
        strict: true,
        parameters: {
            "type": "object",
            "required": [
                "card"
            ],
            "properties": {
                "card": {
                    "type": "string",
                    "description": "JSON string representing the adaptive card to be sent."
                }
            },
            "additionalProperties": false
        }
    };

    public async beginTool(context: TurnContext, memory: Memory, client: ModelClient, parameters: SendAdaptiveCardToolParameters): Promise<ToolResponse> {
        // Parse card
        let card: any;
        try {
            card = JSON.parse(parameters.card);
        } catch (error) {
            return this.returnError(memory, `Error parsing card: The card isn't valid JSON.`, 'Ensure the card is a valid JSON string and try again.');
        }

        // Validate card
        const validator = new Validator();
        const result = validator.validate(card, ADAPTIVE_CARD_SCHEMA);
        if (!result.valid) {
            const fixes = result.errors.map((error) => this.getErrorFix(error)).join('\n');
            return this.returnError(memory, `Error validating card: The card doesn't match the Adaptive Card schema.`, `Fix the following issues and try again:\n${fixes}`);
        }

        // Send card to the client
        memory.setValue(FIXING_CARD_VARIABLE, false);
        const attachemnt = CardFactory.adaptiveCard(card);
        client.queueAttachment(attachemnt);

        // Signal that a reply was sent.
        // - This will avoid the model from trying to return an additional response.
        return { status: 'reply_sent' };
    }

    private returnError(memory: Memory, error: string, correctiveAction: string): ToolResponse {
        // Only try to fix the card once
        let content: string;
        if (memory.getValue(FIXING_CARD_VARIABLE) == true) {
            memory.setValue(FIXING_CARD_VARIABLE, false);
            content = `${error}\nNotify user that there was a problem sending them an Adaptive Card based response.`;
        } else {
            memory.setValue(FIXING_CARD_VARIABLE, true);
            content = `${error}\n${correctiveAction}`;
        }

        return { status: 'error', content };
    }

    
    /**
     * @private
     * @param {ValidationError} error Error in the JSON object
     * @returns {string} How to fix the given error.
     */
    private getErrorFix(error: ValidationError): string {
        // Get argument as a string
        let arg: string;
        if (Array.isArray(error.argument)) {
            arg = error.argument.join(',');
        } else if (typeof error.argument === 'object') {
            arg = JSON.stringify(error.argument);
        } else {
            arg = error.argument.toString();
        }

        switch (error.name) {
            case 'type':
                // field is of the wrong type
                return `convert "${error.property}" to a ${arg}`;
            case 'anyOf':
                // field is not one of the allowed types
                return `convert "${error.property}" to one of the allowed types in the provided schema.`;
            case 'additionalProperties':
                // field has an extra property
                return `remove the "${arg}" property from ${
                    error.property == 'instance' ? 'the JSON object' : `"${error.property}"`
                }`;
            case 'required':
                // field is missing a required property
                return `add the "${arg}" property to ${
                    error.property == 'instance' ? 'the JSON object' : `"${error.property}"`
                }`;
            // TODO: jsonschema does not validate formats by default. https://github.com/microsoft/teams-ai/issues/1080
            case 'format':
                // field is not in the correct format
                return `change the "${error.property}" property to be a ${arg}`;
            case 'uniqueItems':
                // field has duplicate items
                return `remove all duplicate items from "${error.property}"`;
            case 'enum':
                // field is not one of the allowed values
                arg = error.message.split(':')[1].trim();
                return `change the "${error.property}" property to be one of these values: ${arg}`;
            case 'const':
                // field is not the correct value
                return `change the "${error.property}" property to be ${arg}`;
            default:
                return `"${error.property}" ${error.message}. Fix that`;
        }
    }
}