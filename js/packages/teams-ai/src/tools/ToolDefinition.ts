/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder-core";
import { ChatCompletionAction } from "../models";
import { Memory } from "../MemoryFork";
import { ModelClient } from "../types/ModelClient";

export interface ToolDefinition<TParameters extends Record<string, any> | undefined> {
    /**
     * Schema definition of the tool.
     */
    readonly definition: ChatCompletionAction;

    /**
     * Called when the tool is first started.
     * @param context Turn context.
     * @param memory Memory in storage.
     * @param client Interface for communicating with the client.
     * @param parameters Parameters for the tool.
     * @returns Promise with the tools response.
     */
    beginTool(context: TurnContext, memory: Memory, client: ModelClient, parameters: TParameters): Promise<ToolResponse>;
}

export interface ToolResponse {
    status: ToolResponseStatus;
    content?: string;
}

export type ToolResponseStatus = 'completed' | 'reply_sent' | 'cancelled' | 'error';