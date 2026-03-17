import { list, graphql } from "@keystone-6/core";
import {
  text,
  relationship,
  integer,
  decimal,
  json,
  virtual
} from "@keystone-6/core/fields";

import { isSignedIn, permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const Recipe = list({
  access: {
    operation: {
      query: () => true, // Public read for storefront
      create: permissions.canManageProducts,
      update: permissions.canManageProducts,
      delete: permissions.canManageProducts,
    },
  },
  ui: {
    listView: {
      initialColumns: ["name", "menuItem", "yield", "totalCost"],
    },
    labelField: "name",
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    
    menuItem: relationship({
      ref: 'MenuItem',
      many: false,
    }),

    recipeIngredients: json({
      ui: {
        description: 'Array of { ingredientId: string, quantity: number, unit: string }',
      },
    }),

    yield: integer({
      defaultValue: 1,
      ui: { description: 'Number of servings this recipe produces' },
    }),

    prepTime: integer({
      ui: { description: 'Preparation time in minutes' },
    }),

    instructions: text({
      ui: { displayMode: 'textarea' },
    }),

    totalCost: virtual({
      field: graphql.field({
        type: graphql.Float,
        async resolve(item, args, context) {
          if (!item.recipeIngredients) return 0;
          const ingredients = item.recipeIngredients as any[];
          let total = 0;
          for (const ri of ingredients) {
            if (!ri.ingredientId) continue;
            const ingredient = await context.sudo().query.Ingredient.findOne({
              where: { id: ri.ingredientId },
              query: 'costPerUnit'
            });
            if (ingredient?.costPerUnit) {
              total += parseFloat(ingredient.costPerUnit) * (ri.quantity || 0);
            }
          }
          return total;
        }
      })
    }),

    costPerServing: virtual({
      field: graphql.field({
        type: graphql.Float,
        async resolve(item, args, context) {
          if (!item.recipeIngredients) return 0;
          const ingredients = item.recipeIngredients as any[];
          let total = 0;
          for (const ri of ingredients) {
            if (!ri.ingredientId) continue;
            const ingredient = await context.sudo().query.Ingredient.findOne({
              where: { id: ri.ingredientId },
              query: 'costPerUnit'
            });
            if (ingredient?.costPerUnit) {
              total += parseFloat(ingredient.costPerUnit) * (ri.quantity || 0);
            }
          }
          return total / ((item as any).yield || 1);
        }
      })
    }),

    foodCostPercentage: virtual({
      field: graphql.field({
        type: graphql.Float,
        async resolve(item: any, args, context) {
          if (!item.menuItemId) return 0;
          const menuItem = await context.sudo().query.MenuItem.findOne({
            where: { id: item.menuItemId as string },
            query: 'price'
          });
          if (!menuItem?.price || parseFloat(menuItem.price) === 0) return 0;
          
          if (!item.recipeIngredients) return 0;
          const ingredients = item.recipeIngredients as any[];
          let total = 0;
          for (const ri of ingredients) {
            if (!ri.ingredientId) continue;
            const ingredient = await context.sudo().query.Ingredient.findOne({
              where: { id: ri.ingredientId },
              query: 'costPerUnit'
            });
            if (ingredient?.costPerUnit) {
              total += parseFloat(ingredient.costPerUnit) * (ri.quantity || 0);
            }
          }
          const costPerServing = total / (item.yield || 1);
          return (costPerServing / parseFloat(menuItem.price)) * 100;
        }
      })
    }),

    ...trackingFields,
  },
});
