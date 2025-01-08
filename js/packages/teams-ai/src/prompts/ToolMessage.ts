/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { Memory } from '../MemoryFork';
import { Tokenizer } from '../tokenizers';
import { Message } from './Message';
import { PromptFunctions } from './PromptFunctions';
import { RenderedPromptSection } from './PromptSection';
import { PromptSectionBase } from './PromptSectionBase';

/**
 * A section capable of rendering an individual tool message.
 */
export class ToolMessage extends PromptSectionBase {
    private readonly _action_call_id: string;
    private readonly _output: string;
    private _length: number = -1;

    /**
     * Creates a new 'ToolMessage' instance.
     * @param {string} action_call_id ID of the action/tool that was called.
     * @param {string} output Output of the action/tool call.
     * @param {number} tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     */
    public constructor(action_call_id: string, output: string, tokens: number = -1) {
        super(tokens, true, '\n', 'tool: ');
        this._action_call_id = action_call_id;
        this._output = output;
    }

    /**
     * @private
     * @param {TurnContext} context Turn context for the message to be rendered.
     * @param {Memory} memory Memory in storage.
     * @param {PromptFunctions} functions Prompt functions.
     * @param {Tokenizer} tokenizer Tokenizer.
     * @param {number} maxTokens Max tokens to be used for rendering.
     * @returns {Promise<RenderedPromptSection<Message<any>[]>>} Rendered prompt section.
     */
    public async renderAsMessages(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        maxTokens: number
    ): Promise<RenderedPromptSection<Message<any>[]>> {
        // Calculate and cache length
        if (this._length < 0) {
            this._length = tokenizer.encode(this._output).length;
        }

        // Return output
        const role = 'tool';
        const content = this._output;
        const action_call_id = this._action_call_id;
        const messages: Message<string>[] = [{ role, content, action_call_id }];
        return this.returnMessages(messages, this._length, tokenizer, maxTokens);
    }
}
