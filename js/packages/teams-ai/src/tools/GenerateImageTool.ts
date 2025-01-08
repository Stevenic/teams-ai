/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import OpenAI from "openai";
import { TurnContext } from "botbuilder-core";
import { Memory } from "../MemoryFork";
import { ToolDefinition, ToolResponse } from "./ToolDefinition";
import { ModelClient } from "../types";

export interface GenerateImageToolOptions {
    apiKey: string;
}

export interface GenerateImageToolParameters {
    /**
     * Prompt to use for generating image.
     */
    prompt: string;

    /**
     * Requested size of the generated image.
     */
    shape: 'square' | 'landscape' | 'portrait';

    /**
     * Requested quality of the generated image.
     */
    quality: 'standard' | 'hd';

    /**
     * Style of the generated image.
     */
    style: 'vivid' | 'natural';
}

export class GenerateImageTool implements ToolDefinition<GenerateImageToolParameters> {
    private readonly _apiKey: string;

    public constructor(options: GenerateImageToolOptions) {
        this._apiKey = options.apiKey;
    }

    public readonly definition = {
        name: 'generate_image',
        description: `Creates an an AI generated image using DALL-E 3. 
        The url of the generated image is returned.
        Return the image as markdown ![image description](url) unless otherwise requested.`,
        strict: true,
        parameters: {
            "type": "object",
            "properties": {
              "prompt": {
                "type": "string",
                "description": "Prompt to use for generating image."
              },
              "shape": {
                "type": "string",
                "enum": ["square", "landscape", "portrait"],
                "description": "Requested size of the generated image. Default to square."
              },
              "quality": {
                "type": "string",
                "enum": ["standard", "hd"],
                "description": "Requested quality of the generated image. Default to standard."
              },
              "style": {
                "type": "string",
                "enum": ["vivid", "natural"],
                "description": "Style of the generated image. Default to natural."
              }
            },
            "required": ["prompt", "shape", "quality", "style"],
            "additionalProperties": false
          }
    };

    public async beginTool(context: TurnContext, memory: Memory, client: ModelClient, parameters: GenerateImageToolParameters): Promise<ToolResponse> {
        const { prompt, shape, quality, style } = parameters;

        // Create client
        const apiKey = this._apiKey
        const apiClient = new OpenAI({ apiKey });
    
        // Identify image size
        let size: "1024x1024" | "1792x1024" | "1024x1792";
        switch (shape) {
            case 'square':
            default:
                size = "1024x1024";
                break;
            case 'landscape':
                size = "1792x1024";
                break;
            case 'portrait':
                size = "1024x1792";
                break;
        }
    
        try {
            const response = await apiClient.images.generate({
                model: "dall-e-3",
                response_format: "url",
                n: 1,
                prompt,
                size,
                quality,
                style
            });
        
            if (response.data.length > 0 && response.data[0].url !== undefined) {
                return { status: 'completed', content: `Generated Image: ${response.data[0].url}` };
            } else {
                return { status: 'error', content: `No image generated.` };
            }
        } catch (err: unknown) {
            return { status: 'error', content: `Error generating image: ${(err as Error).toString()}` };
        }    
    }
}