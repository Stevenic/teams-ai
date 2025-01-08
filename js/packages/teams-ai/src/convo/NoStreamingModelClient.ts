/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity, Attachment, TurnContext } from "botbuilder-core";
import { Citation } from "../prompts";
import { ModelClient } from "../types";


export class NoStreamingModelClient implements ModelClient {
    private readonly _context: TurnContext;
    private readonly _enableFeedbackLoop: boolean;
    private readonly _attachments: Attachment[] = [];
    private readonly _citations: Citation[] = [];
    private _text: string = '';

    public constructor(context: TurnContext, enableFeedbackLoop: boolean) {
        this._context = context;
        this._enableFeedbackLoop = enableFeedbackLoop;
    }

    public get isCancellationRequested(): boolean {
        return false;
    }

    public async endTurn(): Promise<void> {
        if (this._text.length > 0 || this._attachments.length > 0) {
            // Construct the activity
            const activity: Partial<Activity> = { text: this._text };
            if (this._attachments.length > 0) {
                activity.attachments = this._attachments;
            }
            if (this._citations.length > 0) {
                activity.channelData = { citations: this._citations };
            }

            // Add feedback loop setting
            if (this._enableFeedbackLoop) {
                activity.channelData = activity.channelData || {};
                activity.channelData.feedbackLoop = true;
            }

            // Send the activity
            await this._context.sendActivity(activity);
        }
    }

    public queueTextChunk(text: string, citations?: Citation[]): void {
        this._text += text;
        if (citations) {
            this._citations.push(...citations);
        }
    }

    public queueAttachment(attachment: Attachment): void {
        this._attachments.push(attachment);
    }
}