/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// import { TurnContext } from "botbuilder-core";
// import { BasePlannerModelOptions } from "./ToolBasedPlanner";
// import { Memory, MemoryFork } from "../MemoryFork";
// import { ConvoProgramDefinition } from "./ConvoPlanner";
// import { PromptResponse } from "../types";
// import axios from 'axios';
// import { ChatCompletionAction } from "../models";

// export interface ConvoWriterOptions {
//     /**
//      * Model options to use.
//      */
//     model: BasePlannerModelOptions;

//     /**
//      * Optional. Additional program generation instructions to include in the prompt sent to the model.
//      */
//     additionalInstructions?: string;

//     /**
//      * Optional. URL for the Convo Specification file to use.
//      * @remarks
//      * Defaults to `https://raw.githubusercontent.com/Stevenic/convo/refs/heads/main/convo-spec.md`
//      */
//     convoSpecUrl?: string;
// }

// export class ConvoWriter {
//     private readonly _model: BasePlannerModelOptions;
//     private readonly _additionalInstructions?: string;
//     private readonly _convoSpecUrl: string;
//     private _convoSpec?: string;

//     constructor(options: ConvoWriterOptions) {
//         this._model = options.model;
//         this._additionalInstructions = options.additionalInstructions;
//         this._convoSpecUrl = options.convoSpecUrl || 'https://raw.githubusercontent.com/Stevenic/convo/refs/heads/main/convo-spec.md';
//     }

//     public async createProgram(context: TurnContext, memory: Memory, description: string, tools: ChatCompletionAction[]): Promise<PromptResponse<ConvoProgramDefinition>> {
//         // Ensure the convo spec is loaded
//         const convoSpec = await this.getConvoSpec();

//         // Fork memory to avoid modifying the original memory object
//         const fork = new MemoryFork(memory);
//         fork.setValue('temp.description', description);
//         fork.setValue('temp.tools', tools);
//         fork.setValue('temp.convoSpec', convoSpec);
//         if (this._additionalInstructions) {
//             fork.setValue('temp.additionalInstructions', this._additionalInstructions);
//         }

//     }

//     private async getConvoSpec(): Promise<string> {
//         if (!this._convoSpec) {
//             const response = await axios.get(this._convoSpecUrl);
//             this._convoSpec = response.data as string;
//         }

//         return this._convoSpec;
//     }
// }

// const CREATE_DEVELOPER_MESSAGE = `
// The user is developing a chat bot for Microsoft Teams using the Teams AI Library. 
// They need to create a program that will generate a conversation based on a provided PROGRAM_DESCRIPTION. 
// The chat bot has the following tools available to it:

// <AVALIABLE_TOOLS>
// {{$temp.tools}}

// <CONVO_SPECIFICATION>
// {{$temp.convoSpec}}
// `;

// const CREATE_USER_MESSAGE = `
// <PROGRAM_DESCRIPTION>
// {{$temp.description}}

// <INSTRUCTIONS>
// Use the CONVO_SPECIFICATION to create a program that conforms to the provided PROGRAM_DESCRIPTION.
// {{$temp.additionalInstructions}}
// `;