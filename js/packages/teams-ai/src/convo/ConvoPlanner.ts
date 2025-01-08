/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { ConvoTurnState } from './ConvoTurnState';
import { ToolBasedPlanner } from './ToolBasedPlanner';
import { AzureOpenAIModelConfiguration, OpenAIModelConfiguration, OpenAIModelFactory } from '../models';
import { ToolDefinition, SetVariableTool } from '../tools';
import { ModelClient } from '../types';

/**
 * Options used to configure an `ConvoPlanner` instance.
 * @template TState Optional. Type of application state.
 */
export interface ConvoPlannerOptions<TState extends ConvoTurnState = ConvoTurnState> {
    /**
     * Configuration for model to use.
     */
    model: OpenAIModelConfiguration | AzureOpenAIModelConfiguration;

    /**
     * Convo program to execute. 
     * @remarks
     * This can either be a program definition or a function that returns a program definition.
     */
    program: ConvoProgram | ConvoProgramFactory<TState>;

    /**
     * If true the current users Name and ID will be excluded from the prompt.
     * @remarks
     * Default is false. 
     */
    excludeUserInfo?: boolean;

    /**
     * Optional. Additional execution instructions to include in the prompt sent to the model.
     * @remarks
     * This can also be set dynamically in a `beforeTurn` event. When dynamically set, any value
     * set here will be ignored.
     */
    instructions?: string;

    /**
     * Optional. Persona of the chat bot.
     * @remarks
     * This persona will be included in the prompt to frame its function. The default persona is 
     * "You are a Microsoft Teams chat bot."
     */
    persona?: string;

    /**
     * Optional. Tools to register with the planner.
     */
    tools?: ToolDefinition<any>[];
}

export interface ConvoProgram {
    code: string;
    name?: string;
    data?: string;
}

export type ConvoSystemVariables = 'date' | 'persona' | 'instructions' | 'programCode' | 'programData' | 'variables';

/**
 * Factory function used to dynamically define a convo program.
 * @template TState Optional. Type of application state.
 * @param context Context for the current turn of conversation.
 * @param state Application state for the current turn of conversation.
 * @param planner The action planner that is generating the prompt.
 * @returns A promise that resolves to the program definition to use.
 */
export type ConvoProgramFactory<TState extends ConvoTurnState = ConvoTurnState> = (
    context: TurnContext,
    state: TState,
    planner: ConvoPlanner<TState>
) => Promise<ConvoProgram>;


export class ConvoPlanner<TState extends ConvoTurnState = ConvoTurnState> extends ToolBasedPlanner<TState> {
    private readonly _persona: string;
    private readonly _instructions?: string;
    private readonly _programFactory: ConvoProgramFactory<TState>;
    private readonly _excludeUserInfo: boolean;

    /**
     * Creates a new `ConvoPlanner` instance.
     * @param {ConvoPlannerOptions<TState>} options Options used to configure the planner.
     */
    public constructor(options: ConvoPlannerOptions<TState>) {
        super(options.model, new OpenAIModelFactory(options.model), [new SetVariableTool(), ...(options.tools || [])]);
        this._instructions = options.instructions;
        this._persona = options.persona ?? 'You are a Microsoft Teams chat bot.';
        this._excludeUserInfo = options.excludeUserInfo ?? false;
        if (typeof options.program == 'function') {
            this._programFactory = options.program;
        } else {
            this._programFactory = () => Promise.resolve(options.program as ConvoProgram);
        }
    }

    public get instructions(): string | undefined {
        return this._instructions;
    }

    protected getDeveloperMessage(context: TurnContext, state: TState): Promise<string> {
        return Promise.resolve(DEVELOPER_MESSAGE);
    }
    
    protected getHistoryVariable(context: TurnContext, state: TState): string {
        const programName = state.temp.programName;
        state.temp.historyVariableName = programName ? `conversation.${programName}_history` : `conversation.history`;
        return state.temp.historyVariableName;
    }

    protected async onBeforeTurn(context: TurnContext, state: TState, client: ModelClient): Promise<boolean> {
        // Determine the program to run and save to temp state
        // - We determine the program to use at the start of the turn. If actions are called we
        //   will use the same program when task execution is continued. 
        const program = await this._programFactory(context, state, this);
        state.temp.programCode = program.code;
        state.temp.programName = program.name ?? '';
        state.temp.programData = program.data ?? '';

        // Set persona and additional instructions
        state.temp.persona = this._persona;
        if (this._instructions && !state.temp.instructions) {
            state.temp.instructions = this._instructions;
        }

        // Initialize date
        state.temp.date = new Date().toISOString();

        // Populate user info
        if (!this._excludeUserInfo) {
            state.temp.userInfo = `user_name: ${context.activity.from.name}\nuser_id: ${context.activity.from.id}`;
        }

        return true;
    }
}

const DEVELOPER_MESSAGE = `{{$temp.persona}}
The PROGRAM below defines how you should manage conversations with a user.

<PROGRAM>
{{$temp.programCode}}

<PROGRAM_DATA>
{{$temp.programData}}

<SYSTEM_VARIABLES>
date: {{$temp.date}}
{{$temp.variables}}

<CONVERSATION_VARIABLES>
{{$conversation.variables}}

<USER_VARIABLES>
{{$user.variables}}
{{$temp.userInfo}}

<INSTRUCTIONS>
Run the specified PROGRAM by executing each step.
Use the conversation history and VARIABLES to track where you are in the program.
Use PROGRAM_DATA for additional context.
{{$temp.instructions}}`;
