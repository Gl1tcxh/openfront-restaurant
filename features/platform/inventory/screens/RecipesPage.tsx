'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, DollarSign, Clock, ChefHat, AlertTriangle, RefreshCw } from 'lucide-react'
import { gql, request } from 'graphql-request'

interface Recipe {
  id: string
  name: string
  menuItem: { id: string; name: string; price: string } | null
  recipeIngredients: RecipeIngredient[] | null
  yield: number
  prepTime: number | null
  instructions: string | null
  totalCost: number | null
  costPerServing: number | null
  foodCostPercentage: number | null
}

interface RecipeIngredient {
  ingredientId: string
  quantity: number
  unit: string
}

interface Ingredient {
  id: string
  name: string
  unit: string
  costPerUnit: string | null
}

interface MenuItem {
  id: string
  name: string
  price: string
}

const GET_RECIPES = gql`
  query GetRecipes {
    recipes(orderBy: { name: asc }) {
      id
      name
      menuItem { id name price }
      recipeIngredients
      yield
      prepTime
      instructions
      totalCost
      costPerServing
      foodCostPercentage
    }
    ingredients(orderBy: { name: asc }) {
      id
      name
      unit
      costPerUnit
    }
    menuItems(orderBy: { name: asc }) {
      id
      name
      price
    }
  }
`

const CREATE_RECIPE = gql`
  mutation CreateRecipe($data: RecipeCreateInput!) {
    createRecipe(data: $data) { id name }
  }
`

const UPDATE_RECIPE = gql`
  mutation UpdateRecipe($id: ID!, $data: RecipeUpdateInput!) {
    updateRecipe(where: { id: $id }, data: $data) { id name }
  }
`

const DELETE_RECIPE = gql`
  mutation DeleteRecipe($id: ID!) {
    deleteRecipe(where: { id: $id }) { id }
  }
`

function getFoodCostColor(percentage: number | null): string {
  if (!percentage) return 'text-muted-foreground'
  if (percentage <= 28) return 'text-green-600'
  if (percentage <= 35) return 'text-yellow-600'
  return 'text-red-600'
}

export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)

  const [form, setForm] = useState({
    name: '',
    menuItemId: '',
    yield: 1,
    prepTime: 15,
    instructions: '',
    recipeIngredients: [] as RecipeIngredient[],
  })

  const fetchData = useCallback(async () => {
    try {
      const data = await request('/api/graphql', GET_RECIPES)
      setRecipes((data as any).recipes || [])
      setIngredients((data as any).ingredients || [])
      setMenuItems((data as any).menuItems || [])
    } catch (err) {
      console.error('Error fetching recipes:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const resetForm = () => {
    setForm({
      name: '',
      menuItemId: '',
      yield: 1,
      prepTime: 15,
      instructions: '',
      recipeIngredients: [],
    })
    setEditingRecipe(null)
  }

  const handleOpenDialog = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe)
      setForm({
        name: recipe.name,
        menuItemId: recipe.menuItem?.id || '',
        yield: recipe.yield,
        prepTime: recipe.prepTime || 15,
        instructions: recipe.instructions || '',
        recipeIngredients: recipe.recipeIngredients || [],
      })
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const data: any = {
        name: form.name,
        yield: form.yield,
        prepTime: form.prepTime,
        instructions: form.instructions || null,
        recipeIngredients: form.recipeIngredients,
      }

      if (form.menuItemId) {
        data.menuItem = { connect: { id: form.menuItemId } }
      }

      if (editingRecipe) {
        await request('/api/graphql', UPDATE_RECIPE, { id: editingRecipe.id, data })
      } else {
        await request('/api/graphql', CREATE_RECIPE, { data })
      }

      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (err) {
      console.error('Error saving recipe:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recipe?')) return
    try {
      await request('/api/graphql', DELETE_RECIPE, { id })
      fetchData()
    } catch (err) {
      console.error('Error deleting recipe:', err)
    }
  }

  const addIngredient = () => {
    setForm({
      ...form,
      recipeIngredients: [...form.recipeIngredients, { ingredientId: '', quantity: 1, unit: 'lb' }],
    })
  }

  const removeIngredient = (index: number) => {
    const updated = [...form.recipeIngredients]
    updated.splice(index, 1)
    setForm({ ...form, recipeIngredients: updated })
  }

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...form.recipeIngredients]
    updated[index] = { ...updated[index], [field]: value }
    setForm({ ...form, recipeIngredients: updated })
  }

  const getIngredientName = (id: string) => {
    return ingredients.find(i => i.id === id)?.name || 'Unknown'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recipes & Food Costing</h1>
          <p className="text-muted-foreground">
            {recipes.length} recipes - Track ingredient costs and food cost percentages
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Recipe
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Food Cost %</p>
              <p className="text-2xl font-bold">
                {recipes.length > 0
                  ? (recipes.reduce((s, r) => s + (r.foodCostPercentage || 0), 0) / recipes.length).toFixed(1)
                  : '0'}%
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Cost Items</p>
              <p className="text-2xl font-bold">
                {recipes.filter(r => (r.foodCostPercentage || 0) > 35).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <ChefHat className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Recipes</p>
              <p className="text-2xl font-bold">{recipes.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1">
        <ScrollArea className="h-[calc(100vh-350px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipe</TableHead>
                <TableHead>Menu Item</TableHead>
                <TableHead className="text-right">Cost/Serving</TableHead>
                <TableHead className="text-right">Menu Price</TableHead>
                <TableHead className="text-right">Food Cost %</TableHead>
                <TableHead className="text-right">Prep Time</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No recipes yet. Add your first recipe to start tracking food costs.
                  </TableCell>
                </TableRow>
              ) : (
                recipes.map((recipe) => (
                  <TableRow key={recipe.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenDialog(recipe)}>
                    <TableCell className="font-medium">{recipe.name}</TableCell>
                    <TableCell>
                      {recipe.menuItem ? (
                        <Badge variant="outline">{recipe.menuItem.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      ${(recipe.costPerServing || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {recipe.menuItem ? `$${parseFloat(recipe.menuItem.price).toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${getFoodCostColor(recipe.foodCostPercentage)}`}>
                      {recipe.foodCostPercentage ? `${recipe.foodCostPercentage.toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {recipe.prepTime ? (
                        <span className="flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {recipe.prepTime}m
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDelete(recipe.id) }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecipe ? 'Edit Recipe' : 'Add Recipe'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recipe Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Grilled Salmon"
                />
              </div>
              <div>
                <Label>Link to Menu Item</Label>
                <Select value={form.menuItemId} onValueChange={(v) => setForm({ ...form, menuItemId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select menu item" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} (${parseFloat(item.price).toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Yield (servings)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.yield}
                  onChange={(e) => setForm({ ...form, yield: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label>Prep Time (minutes)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.prepTime}
                  onChange={(e) => setForm({ ...form, prepTime: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Ingredients</Label>
                <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Ingredient
                </Button>
              </div>
              {form.recipeIngredients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 border rounded">
                  No ingredients added yet
                </p>
              ) : (
                <div className="space-y-2">
                  {form.recipeIngredients.map((ri, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select
                        value={ri.ingredientId}
                        onValueChange={(v) => updateIngredient(idx, 'ingredientId', v)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ing) => (
                            <SelectItem key={ing.id} value={ing.id}>
                              {ing.name} (${ing.costPerUnit || '0'}/{ing.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="w-20"
                        value={ri.quantity}
                        onChange={(e) => updateIngredient(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="Qty"
                      />
                      <Select value={ri.unit} onValueChange={(v) => updateIngredient(idx, 'unit', v)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                          <SelectItem value="oz">oz</SelectItem>
                          <SelectItem value="liter">liter</SelectItem>
                          <SelectItem value="each">each</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeIngredient(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Instructions</Label>
              <Textarea
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="Preparation steps..."
                rows={4}
              />
            </div>

            <Button onClick={handleSave} className="w-full">
              {editingRecipe ? 'Update Recipe' : 'Create Recipe'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RecipesPage
