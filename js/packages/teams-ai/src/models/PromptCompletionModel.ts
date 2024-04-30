/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';
import { Message, PromptFunctions, PromptTemplate } from '../prompts';
import { Tokenizer } from '../tokenizers';
import { Memory } from '../MemoryFork';

/**
 * An AI model that can be used to complete prompts.
 */
export interface PromptCompletionModel {
    /**
     * Completes a prompt.
     * @param context Current turn context.
     * @param memory An interface for accessing state values.
     * @param functions Functions to use when rendering the prompt.
     * @param tokenizer Tokenizer to use when rendering the prompt.
     * @param template Prompt template to complete.
     * @returns A `PromptResponse` with the status and message.
     */
    completePrompt(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        template: PromptTemplate
    ): Promise<PromptResponse<string>>;
}

/**
 * Status of the prompt response.
 * @remarks
 * `success` - The prompt was successfully completed.
 * `error` - An error occurred while completing the prompt.
 * `rate_limited` - The request was rate limited.
 * `invalid_response` - The response was invalid.
 * `too_long` - The rendered prompt exceeded the `max_input_tokens` limit.
 */
export type PromptResponseStatus = 'success' | 'error' | 'rate_limited' | 'invalid_response' | 'too_long' | 'stream';

/**
 * Response returned by a `PromptCompletionClient`.
 * @template TContent Optional. Type of the content in the message. Defaults to `unknown`.
 */
export interface PromptResponse<TContent = unknown> {
    /**
     * Status of the prompt response.
     */
    status: PromptResponseStatus;

    /**
     * User input message sent to the model. `undefined` if no input was sent.
     */
    input?: Message<any>;

    /**
     * Message returned.
     * @remarks
     * This will be populated if the status is `success`.
     */
    message?: Message<TContent>;

    /**
     * Response as a stream of chunks.
     * @remarks
     * This will be populated if the status is `stream`.
     */
    stream?: PromptResponseStream<TContent>;

    /**
     * Error returned.
     * @remarks
     * This will be populated if the status is not 'success' or 'stream'.
     */
    error?: Error;
}

/**
 * Stream of chunks returned by a `PromptCompletionModel`.
 * @template TContent Optional. Type of the content in the message. Defaults to `unknown`.
 */
export interface PromptResponseStream<TContent = unknown> {
    /**
     * Retrieves the next chunk of the response.
     * @remarks
     * Returns `undefined` if the stream is complete.
     */
    nextChunk(): Promise<PromptResponseChange<TContent>|undefined>;
}

/**
 * An individual delta in a prompt response stream.
 * @template TContent Optional. Type of the content in the message. Defaults to `unknown`.
 */
export interface PromptResponseChange<TContent = unknown> {
    /**
     * Status of the prompt response.
     */
    status: PromptResponseStatus;

    /**
     * Returns `true` if the prompt is complete.
     */
    isComplete: boolean;

    /**
     * Next chunk of the response.
     */
    delta?: Partial<Message<TContent>>;

    /**
     * Error returned if any.
     */
    error?: Error;
}
