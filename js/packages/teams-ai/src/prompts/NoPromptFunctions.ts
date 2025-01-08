/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PromptFunctions } from "../prompts";

export class NoPromptFunctions implements PromptFunctions {
    public hasFunction(name: string): boolean {
        return false;
    }

    public getFunction(name: string): never {
        throw new Error(`Function '${name}' is not defined.`);
    }

    public async invokeFunction(
        name: string,
        context: any,
        memory: any,
        tokenizer: any,
        args: string[]
    ): Promise<any> {
        throw new Error(`Function '${name}' is not defined.`);
    }
}