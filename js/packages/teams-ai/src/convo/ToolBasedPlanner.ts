/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { AI } from '../AI';
import { ChatCompletionAction, ModelConfiguration, ModelFactory } from '../models';
import { NoPromptFunctions, PromptUtilities } from '../prompts';
import { Planner, Plan } from '../planners/Planner';
import { TurnState } from '../TurnState';
import { Memory, MemoryFork } from '../MemoryFork';
import { ActionCall, ModelClient, PromptResponseStatus } from '../types';
import { ToolDefinition, ToolResponse, ToolResponseStatus } from '../tools';
import { StreamingModelClient } from './StreamingModelClient';
import { NoStreamingModelClient } from './NoStreamingModelClient';

export type ToolMap = Map<string, ToolDefinition<any>>;

export abstract class ToolBasedPlanner<TState extends TurnState> implements Planner<TState> {
    private readonly _modelConfig: ModelConfiguration;
    private readonly _modelFactory: ModelFactory;
    private readonly _tools: ToolMap = new Map();

    /**
     * Creates a new `ToolBasedPlanner` instance.
     * @param model Configuration for model to use.
     * @param modelFactory Factory that creates the planners model and tokenizer.
     * @param tools Optional. Tools to register with the planner.
     */
    public constructor(model: ModelConfiguration, modelFactory: ModelFactory, tools?: ToolDefinition<any>[]) {
        this._modelConfig = model;
        this._modelFactory = modelFactory;
        if (tools) {
            // Register tools
            tools.forEach(tool => this._tools.set(tool.definition.name, tool));
        }
    }

    /**
     * Gets the tools registered with the planner.
     */
    public get tools(): ChatCompletionAction[] {
        return Array.from(this._tools.values()).map(tool => tool.definition);
    }
    
    /**
     * Registers a new tool with the planner.
     * @param definition The tools definition.
     * @returns The planner instance for chaining purposes.
     */
    public tool<TParameters extends Record<string, any> | undefined>(tool: ToolDefinition<TParameters>): this {
        this._tools.set(tool.definition.name, tool);
        return this;
    }

    /**
     * Starts a new task.
     * @remarks
     * This method is called when the AI system is ready to start a new task. The planner should
     * generate a plan that the AI system will execute. Returning an empty plan signals that
     * there is no work to be performed.
     *
     * The planner should take the users input from `state.temp.input`.
     * @param {TurnContext} context Context for the current turn of conversation.
     * @param {TState} state Application state for the current turn of conversation.
     * @param {AI<TState>} ai The AI system that is generating the plan.
     * @returns {Promise<Plan>} The plan that was generated.
     */
    public async beginTask(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
        return await this.continueTask(context, state, ai);
    }

    /**
     * Continues the current task.
     * @remarks
     * This method is called when the AI system has finished executing the previous plan and is
     * ready to continue the current task. The planner should generate a plan that the AI system
     * will execute. Returning an empty plan signals that the task is completed and there is no work
     * to be performed.
     *
     * The output from the last plan step that was executed is passed to the planner via `state.temp.input`.
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {TState} state - Application state for the current turn of conversation.
     * @param {AI<TState>} ai - The AI system that is generating the plan.
     * @returns {Promise<Plan>} The plan that was generated.
     */
    public async continueTask(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
        // create model client
        const enableFeedbackLoop = ai.enableFeedbackLoop;
        const client: ModelClient = this._modelConfig.stream === true ? new StreamingModelClient(context, enableFeedbackLoop) :new NoStreamingModelClient(context, enableFeedbackLoop) ;

        // Ensure we should continue
        if (!await this.onBeforeTurn(context, state, client)) {
            // Return an empty plan
            return EMPTY_PLAN;
        }

        try {
            // Get model options
            const developerMessage = await this.getDeveloperMessage(context, state);
            const historyVariable = this.getHistoryVariable(context, state);
            const tools = await this.getToolMap(context, state);

            // Create memory fork
            // - Defer persisting conversation history changes until end of the turn.
            const memory = new MemoryFork(state);

            // Complete the prompt
            // - TODO: Add logic for streaming support
            const result = await this.completePrompt(context, memory, client, developerMessage, tools, historyVariable);
            if (result.status == 'cancelled') {
                // Return an empty plan
                return EMPTY_PLAN;
            } else if (result.status != 'success') {
                throw result.error!;
            }
    
            // Merge forked memory changes back to state
            memory.mergeChanges(state);

            // Return an empty plan
            return EMPTY_PLAN;
        } finally {
            // Clean up any state
            await this.onAfterTurn(context, state, client);

            // End the turn
            await client.endTurn();
        }
    }

    protected abstract getDeveloperMessage(context: TurnContext, state: TState): Promise<string>;

    protected getHistoryVariable(context: TurnContext, state: TState): string {
        return `conversation.history`;
    }

    protected getToolMap(context: TurnContext, state: TState): Promise<ToolMap> {
        return Promise.resolve(this._tools);
    }

    protected onBeforeTurn(context: TurnContext, state: TState, client: ModelClient): Promise<boolean> {
        return Promise.resolve(true);
    }

    protected onAfterTurn(context: TurnContext, state: TState, client: ModelClient): Promise<void> {
        return Promise.resolve();
    }

    protected onSendText(context: TurnContext, memory: Memory, client: ModelClient, text: string): Promise<void> {
        client.queueTextChunk(text);
        return Promise.resolve();
    }

    protected onBeginTool<TParameters extends Record<string, any> | undefined>(context: TurnContext, memory: Memory, client: ModelClient, tool: ToolDefinition<TParameters>, parameters: TParameters): Promise<ToolResponse> {
        return tool.beginTool(context, memory, client, parameters);
    }

    private async completePrompt(context: TurnContext, memory: Memory, client: ModelClient, developerMessage: string, tools: ToolMap, historyVariable: string, textSent: boolean = false): Promise<CompletePromptResponse> {
        // Create model and tokenizer
        const model = this._modelFactory.createInferenceModel();
        const tokenizer = this._modelFactory.createTokenizer();
        const functions = new NoPromptFunctions();

        // Update the conversation history with the input or tool response
        const completion = this._modelConfig.completion;
        const maxInputTokens = completion.max_input_tokens ?? 2048;
        await PromptUtilities.addInputToHistory(context, memory, functions, tokenizer, historyVariable, maxInputTokens);

        // Create the prompt template
        const actions = Array.from(tools.values()).map(tool => tool.definition);
        const template = await PromptUtilities.createPromptWithHistory(context, memory, functions, tokenizer, developerMessage, historyVariable, completion, actions);

        // Call model and check result
        const result = await model.completePrompt(context, memory, functions, tokenizer, template);
        if (result.status != 'success') {
            return result;
        } else if (client.isCancellationRequested) {
            return { status: 'cancelled' };
        }

        // Add response to history
        const message = result.message!;
        PromptUtilities.addOutputToHistory(context, memory, historyVariable, message);

        // Check for text output
        if (message.content) {
            // Send the message to the user
            // - Start a new paragraph if we've already sent text
            const text = textSent ? `\n\n${message.content}` : message.content;
            await this.onSendText(context, memory, client, text);
            textSent = true;
        }
        
        // Check for end of turn
        if (!Array.isArray(message.action_calls) || message.action_calls.length == 0) {
            return { status: 'success' };
        }

        // Process the tool outputs
        memory.setValue(ACTION_OUTPUTS_VARIABLE, {});
        const toolCalls: Promise<ToolResponseStatus>[] = [];
        for (const action_call of message.action_calls) {
            const promise = this.callAction(context, memory, client, tools, action_call, historyVariable);
            toolCalls.push(promise);
        }

        // Wait for all tool calls to complete and check for cancellation
        const responses = await Promise.all(toolCalls);
        if (client.isCancellationRequested) {
            return { status: 'cancelled' };
        }

        // Check for a direct reply being sent?
        // - Sending a direct reply stops the model from sending any additional text.
        const directReplies = responses.filter(response => response == 'reply_sent');
        if (directReplies.length > 0) {
            // Append tool outputs to history
            const actionOutputs: Record<string, string> = memory.getValue(ACTION_OUTPUTS_VARIABLE) ?? {};
            for (const id in actionOutputs) {
                const output = actionOutputs[id];
                PromptUtilities.addToolCallToHistory(context, memory, historyVariable, id, output);
            }

            return { status: 'success' };
        } else {
            // Send the tool outputs to the model for processing
            return await this.completePrompt(context, memory, client, developerMessage, tools, historyVariable, textSent);
        }
    }

    private async callAction(context: TurnContext, memory: Memory, client: ModelClient, tools: ToolMap, call: ActionCall, historyVariable: string): Promise<ToolResponseStatus> {
        const name = call.function.name;
        const tool = tools.get(name);
        if (!tool) {
            // Return error to model
            this.setActionOutput(memory, call.id, `A tool named '${name}' wasn't found.`);
            return 'error';
        }

        // Parse parameters
        let parameters: Record<string, any> | undefined = undefined;
        try {
            if (call.function.arguments) {
                parameters = JSON.parse(call.function.arguments);
            }
        } catch (err: unknown) {
            // Return error to model
            this.setActionOutput(memory, call.id, `Error parsing parameters for tool '${name}': ${(err as Error).message}`);
            return 'error';
        }

        // Begin the tool call
        try {
            // Call the tool
            const response = await this.onBeginTool(context, memory, client, tool, parameters);
            
            // Set the action output as needed
            switch (response.status) {
                case 'completed':
                case 'reply_sent':
                    this.setActionOutput(memory, call.id, response.content ?? 'tool completed');
                    break;
                case 'cancelled':
                    if (!client.isCancellationRequested) {
                        // The tool was cancelled for some reason other than the client cancelling
                        // the request so we will end up treating it as a normal tool completion.
                        this.setActionOutput(memory, call.id, 'tool was cancelled');
                    }
                    break;
                case 'error':
                    this.setActionOutput(memory, call.id, `Error calling tool '${name}': ${response.content}`);
                    break;
                default:
                    throw new Error(`Unexpected tool response status: ${response.status}`);
            }

            // Return the status
            return response.status;
        } catch (err: unknown) {
            // Return error to model
            this.setActionOutput(memory, call.id, `Error calling tool '${name}': ${(err as Error).message}`);
            return 'error';
        }
    }

    private setActionOutput(memory: Memory, id: string, output: string): void {
        const actionOutputs: Record<string, string> = memory.getValue(ACTION_OUTPUTS_VARIABLE) ?? {};
        actionOutputs[id] = output;
        memory.setValue(ACTION_OUTPUTS_VARIABLE, actionOutputs);
    }
}

const ACTION_OUTPUTS_VARIABLE = `temp.actionOutputs`;

const EMPTY_PLAN: Plan = { type: 'plan', commands: [] };

interface CompletePromptResponse {
    status: PromptResponseStatus;
    error?: Error;
}