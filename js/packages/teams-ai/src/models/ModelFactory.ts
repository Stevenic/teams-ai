/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PromptCompletionModel } from "./PromptCompletionModel";
import { PromptTemplateConfig } from "../prompts";
import { Tokenizer } from "../tokenizers";

export interface ModelConfiguration extends PromptTemplateConfig {
    logRequests?: boolean;
    retryPolicy?: number[];
    stream?: boolean;
}

export interface ModelFactory {
    createInferenceModel(): PromptCompletionModel;
    createTokenizer(): Tokenizer;
}