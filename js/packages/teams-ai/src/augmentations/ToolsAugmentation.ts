/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';
import { PromptResponse } from '../models';
import { Plan, PredictedSayCommand } from '../planners';
import { Tokenizer } from '../tokenizers';
import { Validation } from '../validators';
import { Augmentation, ServerAugmentationTypes } from './Augmentation';
import { PromptSection } from '../prompts';
import { Memory } from '../MemoryFork';

/**
 * A server-side 'tools' augmentation.
 * @remarks
 * This augmentation does not add any additional functionality to the prompt. It always
 * returns a `Plan` with a single `SAY` command containing the models response.
 */
export class ToolsAugmentation implements Augmentation<string> {
    /**
     * Type of server augmentation to use.
     */
    public readonly serverAugmentation: ServerAugmentationTypes = 'tools'; // TODO: Add serverAugmentation property.

    /**
     * @returns {PromptSection|undefined} Returns an optional prompt section for the augmentation.
     */
    public createPromptSection(): PromptSection | undefined {
        return undefined;
    }

    /**
     * Validates a response to a prompt.
     * @param {TurnContext} context - Context for the current turn of conversation with the user.
     * @param {Memory} memory - An interface for accessing state values.
     * @param {Tokenizer} tokenizer - Tokenizer to use for encoding and decoding text.
     * @param {PromptResponse<string>} response - Response to validate.
     * @param {number} remaining_attempts Number of remaining attempts to validate the response.
     * @returns {Validation} A `Validation` object.
     */
    public validateResponse(
        context: TurnContext,
        memory: Memory,
        tokenizer: Tokenizer,
        response: PromptResponse<string>,
        remaining_attempts: number
    ): Promise<Validation<string>> {
        // Validate that any tools being invoked pass schema validation.
        // - Look at the 'DO' validation for the 'sequence' augmentation as an example.
        throw "not implemented"
    }

    /**
     * Creates a plan given validated response value.
     * @param {TurnContext} context Context for the current turn of conversation.
     * @param {Memory} memory An interface for accessing state variables.
     * @param {PromptResponse<string>} response The validated and transformed response for the prompt.
     * @returns {Promise<Plan>} The created plan.
     */
    public createPlanFromResponse(
        context: TurnContext,
        memory: Memory,
        response: PromptResponse<string>
    ): Promise<Plan> {
        // Map the response into a plan object.
        // - Tool calls should get mapped to a 'DO' command and other responses to a 'SAY' command.
        // - We may potentially need to potentially round trip the tool_call_id and we'll want to do that
        //   the same way we do it for the AssistantsPlanner. See "SUBMIT_TOOL_OUTPUTS_VARIABLE".
        // - The tool too call will be in the response message which has a role of "assistants" and a "tool_calls" array
        //   where each tool has an "id", "type", and "function" field.
        // - we may want to unify the way the MonologueAugmentation and the SequenceAugmentation handle tool responses.
        throw "not implemented"
    }
}
