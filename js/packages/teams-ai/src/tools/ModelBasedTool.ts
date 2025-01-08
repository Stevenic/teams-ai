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
import { ChatCompletionAction, ModelConfiguration, ModelFactory } from "../models";
import { NoPromptFunctions, Prompt, PromptSection, PromptTemplateConfig, PromptUtilities, SystemMessage, UserMessage } from "../prompts";
import { ModelClient } from "../types/ModelClient";
import { CompletionConfig, PromptResponse } from "../types";

export interface BaseModelConfig extends PromptTemplateConfig {
    logRequests?: boolean;
    retryPolicy?: number[];
    stream?: boolean;
}

export interface OpenAIModelConfig extends BaseModelConfig {
    apiKey: string;
    endpoint?: string;
    organization?: string;
    project?: string;
}

export interface AzureOpenAIModelConfig extends BaseModelConfig {
    azureEndpoint: string;
    azureApiKey?: string;
    azureADTokenProvider?: () => Promise<string>;
    azureApiVersion?: string;
}

export abstract class ModelBasedTool<TParameters extends Record<string, any> | undefined> implements ToolDefinition<TParameters> {
    private readonly _configuration: ModelConfiguration;
    private readonly _modelFactory: ModelFactory;
    
    /**
     * Configures the model to use.
     * @param configuration Model to use for inference.
     * @param modelFactory Factory for creating models.
     */
    public constructor(configuration: ModelConfiguration, modelFactory: ModelFactory) {
        this._configuration = configuration;
        this._modelFactory = modelFactory;
    }    

    /**
     * Schema definition of the tool.
     */
    public abstract readonly definition: ChatCompletionAction;

    /**
     * Called when the tool is first started.
     * @param context Turn context.
     * @param memory Memory in storage.
     * @param client Interface for communicating with the client.
     * @param parameters Parameters for the tool.
     * @returns Promise with the tools response.
     */
    public abstract beginTool(context: TurnContext, memory: Memory, client: ModelClient, parameters: TParameters): Promise<ToolResponse>;

    /**
     * Completes a prompt using the configured model.
     * @param context Turn context.
     * @param memory Memory in storage.
     * @param client Interface for communicating with the client.
     * @param prompt Prompt to complete.
     * @returns Promise with the model calls response.
     */
    protected async completePrompt(context: TurnContext, memory: Memory, client: ModelClient, prompt: PromptSection, completionOptions?: Partial<CompletionConfig>): Promise<PromptResponse<string>> {
        // Create model and tokenizer
        const model = this._modelFactory.createInferenceModel();
        const tokenizer = this._modelFactory.createTokenizer();
        const functions = new NoPromptFunctions();

        // Create prompt template
        const completion: CompletionConfig = { ...this._configuration.completion, ...completionOptions };
        const template = PromptUtilities.createPromptTemplate(prompt, completion);

        // Call model and check for cancellation
        const result = await model.completePrompt(context, memory, functions, tokenizer, template);
        if (result.status == 'success' && client.isCancellationRequested) {
            return { status: 'cancelled' };
        }

        return result;
    }

    /**
     * Calls the model with a prompt that's expected to return text.
     * @param context Turn context.
     * @param memory Memory in storage.
     * @param client Interface for communicating with the client.
     * @param userMessage User message to prompt with.
     * @param developerMessage Optional. Developer message to include.
     * @returns Promise with the model calls response.
     */
    protected async completeText(context: TurnContext, memory: Memory, client: ModelClient, userMessage: string, developerMessage?: string): Promise<PromptResponse<string>> {
        // Create prompt sections
        const sections: PromptSection[] = [
            new UserMessage(userMessage)
        ];
        if (developerMessage) {
            sections.unshift(new SystemMessage(developerMessage));
        }

        // Call model with prompt
        return this.completePrompt(context, memory, client, new Prompt(sections));
    }
}