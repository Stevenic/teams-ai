import { Memory, ModelClient, ToolDefinition, ToolResponse } from "@microsoft/teams-ai";
import { TurnContext } from "botbuilder";

export interface PlaceOrderParameters {
    customer_name: string;
    order_items: OrderItem[];
}

export interface OrderItem {
    item_name: string;
    quantity: number;
    special_requests: string;
}

export class PlaceOrderTool implements ToolDefinition<PlaceOrderParameters> {
    readonly definition = {
        name: "place_order",
        description: "Places a food order. Returns an order number.",
        strict: true,
        parameters: {
          "type": "object",
          "required": [
            "customer_name",
            "order_items"
          ],
          "properties": {
            "customer_name": {
              "type": "string",
              "description": "Name of the customer placing the order"
            },
            "order_items": {
              "type": "array",
              "description": "List of food items in the order",
              "items": {
                "type": "object",
                "properties": {
                  "item_name": {
                    "type": "string",
                    "description": "Name of the food item"
                  },
                  "quantity": {
                    "type": "number",
                    "description": "Quantity of the food item ordered"
                  },
                  "special_requests": {
                    "type": "string",
                    "description": "Any special requests for the food item (optional)"
                  }
                },
                "required": [
                  "item_name",
                  "quantity",
                  "special_requests"
                ],
                "additionalProperties": false
              }
            }
          },
          "additionalProperties": false
        }
    };

    public beginTool(context: TurnContext, memory: Memory, client: ModelClient, parameters: PlaceOrderParameters): Promise<ToolResponse> {
        const order = parameters as PlaceOrderParameters;
        const orderNumber = Math.ceil(Math.random() * 999);
        return Promise.resolve({ status: 'completed', content: `Order ${orderNumber} placed for ${order.customer_name}` });
    }
}
