/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DefaultConversationState, DefaultUserState, DefaultTempState, TurnState } from "../TurnState";

/**
 * Extended turn state for a Convo based bot
 */
export type ConvoTurnState<
    TConversationState = ConvoConversationState, 
    TUserState = ConvoUserState, 
    TTempState = ConvoTempState
    > = TurnState<TConversationState, TUserState, TTempState>;

/**
 * Convo extensions to conversation state
 */
export interface ConvoConversationState extends DefaultConversationState {
    /**
     * Program variables for the current conversation.
     */
    variables?: Record<string, any>;
}

/**
 * Convo extensions to user state
 */
export interface ConvoUserState extends DefaultUserState {
    /**
     * Program variables specific to the current user.
     */
    variables?: Record<string, any>;
}

/**
 * Convo extensions to temp state
 */
export interface ConvoTempState extends DefaultTempState {
    /**
     * The current date.
     * @remarks
     * Automatically populated by the `ConvoPlanner` for each model call.
     */
    date: string;

    /**
     * Name of the variable used to store the conversation history.
     * @remarks
     * Set dynamically by the `ConvoPlanner` but should default to `conversation.history`.
     */
    historyVariableName?: string;

    /**
     * Additional program execution instructions.
     * @remarks
     * Populated from the `ConvoPlanner` options or set dynamically in a `beforeTurn` event.
     */
    instructions?: string;

    /**
     * Persona of the chat bot.
     */
    persona: string;

    /**
     * Convo program being executed for the current turn.
     * @remarks
     * Populated from the current program definition. 
     */
    programCode: string;

    /**
     * Data associated with the current Convo program.
     * @remarks
     * Populated from the current program definition. Empty if not specified.
     */
    programData: string;

    /**
     * Name of the Convo program being executed.
     * @remarks
     * Populated from the current program definition. Empty if not specified.
     */
    programName: string;

    /**
     * Information about the current user.
     * @remarks
     * Includes the users Name and ID populated from the received activity.
     */ 
    userInfo: string;

    /**
     * Additional read-only system variables.
     * @remarks
     * Can be set dynamically in a `beforeTurn` event.
     */
    variables?: Record<string, any>;
}