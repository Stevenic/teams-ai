/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Attachment, TurnContext } from "botbuilder-core";
import { Citation } from "../prompts";
import { ModelClient } from "../types";
import { StreamingResponse } from "../StreamingResponse";


export class StreamingModelClient implements ModelClient {
    private readonly _context: TurnContext;
    private readonly _streamer: StreamingResponse;
    private readonly _attachments: Attachment[] = [];

    public constructor(context: TurnContext, enableFeedbackLoop: boolean) {
        this._context = context;
        this._streamer = new StreamingResponse(context);
        this._streamer.setFeedbackLoop(enableFeedbackLoop);
    }

    public get isCancellationRequested(): boolean {
        return false;
    }

    public async endTurn(): Promise<void> {
        // End the stream and send any attachments
        await this._streamer.endStream();
        if (this._attachments.length > 0) {
            await this._context.sendActivity({ attachments: this._attachments });
        }
    }

    public queueTextChunk(text: string, citations?: Citation[]): void {
        this._streamer.queueTextChunk(text, citations);
    }

    public queueAttachment(attachment: Attachment): void {
        this._attachments.push(attachment);
    }
}