// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/*
All of these responses where generated by GPT using a prompt similar to:

```
Here's a JavaScript string literal template:

`I couldn't find a ${item} on your ${list} list.`

Create a JavaScript array with 7 variations of the template.
The variations should be helpful, creative, clever, and very friendly.
The variations should always use the back tick `` syntax.
The variations should always include ${item} and ${list} variables.
```

7 variations were asked for so that we can remove the 2 we like the least.
*/

/**
 * This method is used for greeting and return rendom responses.
 */
export function greeting(): string {
    return getRandomResponse([
        'Welcome to DevOps Bot! Type /reset to delete all existing work items.',
        "Hello! I'm DevOps Bot. Use /reset to delete all your work items.",
        "Hi there! I'm here to help you manage your work items. Use /reset to delete all workitems.",
        "Greetings! I'm DevOps Bot. Type /reset to delete all your work items.",
        'Hey there! DevOps Bot here. You can use /reset to delete all work items.'
    ]);
}

/**
 * This method is used to reset the work items and starting with freshly.
 */
export function reset(): string {
    return getRandomResponse([
        'Resetting all work items. All work items have been deleted.',
        'Starting fresh. All work items have been reset.',
        'All work items have been cleared. Ready for new work item!',
        'Cleaning slate. All work items have been reset.',
        'All work items have been wiped. Ready for new work item!'
    ]);
}

/**
 * This method return random response if the work item not found.
 * @param list
 * @param item
 */
export function itemNotFound(list: string, item: string): string {
    return getRandomResponse([
        `I'm sorry, I couldn't locate a ${item} in your ${list} list.`,
        `I don't see a ${item} on your ${list} list.`,
        `It looks like you don't have a ${item} on your ${list} list.`,
        `I'm sorry, I don't see a ${item} on your ${list} list.`,
        `I couldn't find a ${item} listed on your ${list} list.`
    ]);
}

/**
 * This method return random responses if the work item found.
 * @param list
 * @param item
 */
export function itemFound(list: string, item: string): string {
    return getRandomResponse([
        `I found ${item} in your ${list} list.`,
        `It looks like ${item} is in your ${list} list.`,
        `You have a ${item} in your ${list} list.`,
        `The ${item} was found in your ${list} list.`,
        `A ${item} appears to be in your ${list} list.`
    ]);
}

/**
 * This method return random response no list found.
 */
export function noListsFound(): string {
    return getRandomResponse([
        `You don't have any work items created yet.`,
        `It looks like you don't have any work items yet.`,
        `No work items have been created yet.`,
        `You don't have any work tiems created yet.`
    ]);
}

/**
 * This method return random response for any unknown action.
 * @param action
 */
export function unknownAction(action: string): string {
    return getRandomResponse([
        `I'm sorry, I'm not sure how to ${action}.`,
        `I don't know the first thing about ${action}.`,
        `I'm not sure I'm the best person to help with ${action}.`,
        `I'm still learning about ${action}, but I'll try my best.`,
        `I'm afraid I'm not experienced enough with ${action}.`
    ]);
}

/**
 * This method return random response if the prompt is off the topic.
 */
export function offTopic(): string {
    return getRandomResponse([
        `I'm sorry, I'm not sure I can help you with that.`,
        `I'm sorry, I'm afraid I'm not allowed to talk about such things.`,
        `I'm sorry, I'm not sure I'm the right person to help you with that.`,
        `I wish I could help you with that, but it's not something I can talk about.`,
        `I'm sorry, I'm not allowed to discuss that topic.`
    ]);
}

/**
 * This method return random response from the list of items in the array.
 * @param responses
 */
function getRandomResponse(responses: string[]): string {
    const i = Math.floor(Math.random() * (responses.length - 1));
    return responses[i];
}