/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder-core";
import { Memory } from "../MemoryFork";
import { ToolDefinition, ToolResponse, ToolResponseStatus } from "./ToolDefinition";
import { ModelClient } from "../types";

export interface SetVariableToolParameters {
    scope: 'conversation' | 'user';
    name: string;
    value: string;
}

export class SetVariableTool implements ToolDefinition<SetVariableToolParameters> {
    public readonly definition = {
        name: 'set_variable',
        description: 'Sets a program variable to a value. Both user and conversation scoped variables can be set.',
        strict: true,
        parameters: {
            "type": "object",
            "required": [
                "scope",
                "name",
                "value"
            ],
            "properties": {
                "scope": {
                    "type": "string",
                    "enum": [
                        "conversation",
                        "user"
                    ],
                    "description": "The scope in which the variable is set. User variables are visible only to the user but for all conversations while conversation variables are visible to all users for the current conversation."
                },
                "name": {
                    "type": "string",
                    "description": "The name of the variable to set."
                },
                "value": {
                    "type": "string",
                    "description": "The value to assign to the variable. Empty string will clear the variable."
                }
            },
            "additionalProperties": false
        }
    };

    public beginTool(context: TurnContext, memory: Memory, client: ModelClient, parameters: SetVariableToolParameters): Promise<ToolResponse> {
        // Get variable dictionary
        const scope = parameters.scope === 'user' ? 'user' : 'conversation';
        const variableName = `${scope}.variables`;
        const variables: Record<string, string> = memory.getValue(variableName) || {};

        // Update variables
        let status: ToolResponseStatus = 'completed';
        let content: string;
        const { name, value } = parameters;
        if (value) {
            variables[name] = value;
            content = `variable updated`;
        } else if (variables.hasOwnProperty(name)) {
            delete variables[name];
            content = `variable deleted`;
        } else {
            status = 'error';
            content = `variable not found`;
        }

        // Save variables
        memory.setValue(variableName, variables);
        return Promise.resolve({ status, content });
    }
}