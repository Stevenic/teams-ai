/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { OpenAIModel, PromptCompletionModel } from ".";
import { GPTTokenizer, Tokenizer } from "../tokenizers";
import { ModelConfiguration, ModelFactory } from "./ModelFactory";

export interface OpenAIModelConfiguration extends ModelConfiguration {
    apiKey: string;
    endpoint?: string;
    organization?: string;
    project?: string;
}

export interface AzureOpenAIModelConfiguration extends ModelConfiguration {
    azureEndpoint: string;
    azureApiKey?: string;
    azureADTokenProvider?: () => Promise<string>;
    azureApiVersion?: string;
}

export class OpenAIModelFactory implements ModelFactory {
    private readonly _configuration: OpenAIModelConfiguration | AzureOpenAIModelConfiguration;
    
    /**
     * Creates a new `OpenAIModelFactory` instance.
     * @param configuration Model to use for inference.
     */
    public constructor(configuration: OpenAIModelConfiguration | AzureOpenAIModelConfiguration) {
        this._configuration = configuration;
    }    

    public createInferenceModel(): PromptCompletionModel {
        const useSystemMessages = true;
        const { model, seed } = this._configuration.completion;
        if ((this._configuration as AzureOpenAIModelConfiguration).azureEndpoint) {
            const { azureEndpoint, azureApiKey, azureADTokenProvider, logRequests, retryPolicy, stream } = this._configuration as AzureOpenAIModelConfiguration;
            return new OpenAIModel({
                azureApiKey,
                azureADTokenProvider,
                azureDefaultDeployment: model!,
                azureEndpoint,
                logRequests,
                retryPolicy,
                seed,
                useSystemMessages,
                stream
            });
        } else {
            const { apiKey, endpoint, project, logRequests, retryPolicy, stream } = this._configuration as OpenAIModelConfiguration;
            return new OpenAIModel({
                apiKey,
                defaultModel: model!,
                endpoint,
                project,
                logRequests,
                retryPolicy,
                seed,
                useSystemMessages,
                stream
            });
        }
    }
    
    public createTokenizer(): Tokenizer {
        return new GPTTokenizer();
    }
}