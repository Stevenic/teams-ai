/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder-core";
import { ToolsAugmentation } from "../augmentations";
import { ChatCompletionAction } from "../models";
import { CompletionConfig } from "../types";
import { PromptSection } from "./PromptSection";
import { PromptTemplate, PromptTemplateConfig } from "./PromptTemplate";
import { Memory } from "../MemoryFork";
import { PromptFunctions } from "./PromptFunctions";
import { Tokenizer } from "../tokenizers";
import { Message } from "./Message";
import { UserInputMessage } from "./UserInputMessage";
import { ConversationHistory } from "./ConversationHistory";
import { TemplateSection } from "./TemplateSection";
import { Prompt } from "./Prompt";

export class PromptUtilities {
    /**
     * Adds the user input or tool output to the conversation history.
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {Memory} memory - Memory to use for rendering.
     * @param {PromptFunctions} functions - Prompt functions to use for rendering.
     * @param {Tokenizer} tokenizer - Tokenizer to use for encoding text.
     * @param {string} historyVariable - Variable name for the conversation history. 
     * @param {number} maxInputTokens - Maximum number of tokens allowed.
     */
    public static async addInputToHistory(context: TurnContext, memory: Memory, functions: PromptFunctions, tokenizer: Tokenizer, historyVariable: string, maxInputTokens: number): Promise<void> {
        // Get the current conversation history
        const history: Message[] = memory.getValue(historyVariable) ?? [];

        // Check for tool outputs
        const actionOutputs: Record<string, string> = memory.getValue(ACTION_OUTPUTS_VARIABLE) ?? {};
        if (Object.keys(actionOutputs).length > 0) {
            // Append each tool output to history 
            for (const action_call_id in actionOutputs) {
                const content = actionOutputs[action_call_id] ?? 'tool called';
                history.push({ role: 'tool', content, action_call_id });
            }
        } else {
            // Render user input that might contain images or other attachments
            const section = new UserInputMessage();
            const rendered = await section.renderAsMessages(context, memory, functions, tokenizer, maxInputTokens);
            if (rendered.output.length > 0) {
                history.push(...rendered.output);
            }
        }

        // Update the conversation history
        memory.setValue(historyVariable, history);
    }

    /**
     * Adds the models output to the conversation history.
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {Memory} memory - Memory to use for rendering.
     * @param {string} historyVariable - Variable name for the conversation history. 
     * @param {Message} message - Message to add to the history. 
     */
    public static addOutputToHistory(context: TurnContext, memory: Memory, historyVariable: string, message: Message<string>): void {
        // Get the current conversation history
        const history: Message[] = memory.getValue(historyVariable) ?? [];

        // Add the new output to the history
        history.push(message);

        // Update the conversation history
        memory.setValue(historyVariable, history);
    }

    /**
     * Adds a tools output directly to the conversation history.
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {Memory} memory - Memory to use for rendering.
     * @param {string} historyVariable - Variable name for the conversation history. 
     * @param {string} action_call_id - Identifier for the tool action call.
     * @param {string} content - Content to add to the history. 
     */
    public static addToolCallToHistory(context: TurnContext, memory: Memory, historyVariable: string, action_call_id: string, content: string): void {
        // Get the current conversation history
        const history: Message[] = memory.getValue(historyVariable) ?? [];

        // Add the tools output to the history
        history.push({ role: 'tool', content, action_call_id });

        // Update the conversation history
        memory.setValue(historyVariable, history);
    }

    /**
     * Creates a simple prompt template that can optionally use tools.
     * @param {PromptSection} prompt Prompt for the template.
     * @param {CompletionConfig} completion Model configuration for the prompt.
     * @param {ChatCompletionAction[]} actions Optional tools for the prompt.
     * @returns {PromptTemplate} The created prompt template.
     */
    public static createPromptTemplate(prompt: PromptSection, completion: CompletionConfig, actions?: ChatCompletionAction[]): PromptTemplate {
        // Define prompts config
            const config: PromptTemplateConfig = {
            schema: 1.1,
            type: 'completion',
            completion,
            augmentation: {
                augmentation_type: 'none'
            }
        };

        // Create a tools augmentation instance
        let augmentation: ToolsAugmentation | undefined = undefined;
        if (actions) {
            config.augmentation!.augmentation_type = 'tools';
            augmentation = new ToolsAugmentation();
        }

        // Return the prompt template
        return {
            name: 'prompt',
            prompt,
            config,
            actions,
            augmentation
        };
    }
    
    /**
     * Creates a prompt template with a developer message and conversation history.
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {Memory} memory - Memory to use for rendering.
     * @param {PromptFunctions} functions - Prompt functions to use for rendering.
     * @param {Tokenizer} tokenizer - Tokenizer to use for encoding text.
     * @param {string} developerMessage - Developer message to include in the prompt.
     * @param {string} historyVariable - Variable name for the conversation history. 
     * @param {CompletionConfig} completion - Model configuration for the prompt.
     * @param {ChatCompletionAction[]} actions - Optional tools for the prompt.
     * @returns {Promise<PromptTemplate>} The created prompt template.
     */
    public static async createPromptWithHistory(context: TurnContext, memory: Memory, functions: PromptFunctions, tokenizer: Tokenizer, developerMessage: string, historyVariable: string, completion: CompletionConfig, actions?: ChatCompletionAction[]): Promise<PromptTemplate> {
        // Measure the length of the developer message
        // - TODO: Replace 'system' with 'developer' once OpenAI change goes through.
        const maxInputTokens = completion.max_input_tokens ?? 2048;
        const developerSection = new TemplateSection(developerMessage, 'system');
        const rendered = await developerSection.renderAsText(context, memory, functions, tokenizer, maxInputTokens);
        let consumedTokens = rendered.length;

        // Add the length of any tool definitions
        if (actions) {
            actions.forEach(tool => consumedTokens += tokenizer.encode(JSON.stringify(tool)).length);
        }

        // Ensure there's some room for conversation state
        const maxHistoryTokens = maxInputTokens - consumedTokens;
        if (maxHistoryTokens < 1000) {
            throw new Error(`Not enough tokens for programs conversation history.`);
        }

        // Define prompt
        const prompt = new Prompt([
            developerSection,
            new ConversationHistory(historyVariable, maxHistoryTokens)
        ]);

        return PromptUtilities.createPromptTemplate(prompt, completion, actions);
    }
}

/**
 * @private
 */
const ACTION_OUTPUTS_VARIABLE = `temp.actionOutputs`;