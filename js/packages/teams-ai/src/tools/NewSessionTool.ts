/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder-core";
import { Memory } from "../MemoryFork";
import { ToolDefinition, ToolResponse } from "./ToolDefinition";
import { Message } from "../prompts";
import { ModelClient } from "../types";

export class NewSessionTool implements ToolDefinition<undefined> {
    public readonly definition = {
        name: 'new_session',
        description: 'Starts a new session by clearing the conversation history and any set CONVERSATION_VARIABLES. This will not clear USER_VARIABLES.'
    };

    public async beginTool(context: TurnContext, memory: Memory, client: ModelClient, parameters: undefined): Promise<ToolResponse> {
        // Clear any history before the last user message
        const historyVariableName = memory.getValue('temp.historyVariableName') as string || 'conversation.history';
        const history: Message[] = memory.getValue(historyVariableName) || [];
        const lastUserMessage = history.filter(m => m.role === 'user').pop();
        if (lastUserMessage) {
            const index = history.indexOf(lastUserMessage);
            memory.setValue(historyVariableName, history.slice(0, index + 1));
        } else {
            return Promise.resolve({ status: 'error', content: `Error: No user messages found in history.` });
        }
        
        // Clear conversation variables
        memory.setValue('conversation.variables', {});
        return Promise.resolve({ status: 'completed', content: `New session started.` });
    }
}