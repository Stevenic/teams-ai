/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Attachment } from "botframework-schema";
import { Citation } from "../prompts";

export interface ModelClient {
    /**
     * Returns true if the client has requested the current operation be cancelled.
     */
    readonly isCancellationRequested: boolean;

    /**
     * Ends the current turn, allowing the bot to send any queued messages.
     */
    endTurn(): Promise<void>;

    /**
     * Queues a text chunk to be sent to the user.
     * @param text Text to send.
     * @param citations Optional citations to include in the message.
     */
    queueTextChunk(text: string, citations?: Citation[]): void;

    /**
     * Queues a message attachment to be sent to the user.
     * @param attachment Attachment to send.
     */
    queueAttachment(attachment: Attachment): void;
}