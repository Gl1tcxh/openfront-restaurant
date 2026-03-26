import type { MenuItem } from "./store-data"

export function getMenuItemHref(itemId: string): string {
  return `/menu/${itemId}`
}

export function getMenuItemImageUrl(item: MenuItem): string {
  const firstImage = item.menuItemImages?.[0]
  if (firstImage?.image?.url) return firstImage.image.url
  if (firstImage?.imagePath) return firstImage.imagePath
  return "/placeholder.jpg"
}

export function getMenuItemDescriptionText(description: MenuItem["description"]): string {
  if (typeof description === "string") return description
  if (typeof description === "object" && description?.document) {
    const extractText = (node: any): string => {
      if (!node) return ""
      if (typeof node === "string") return node
      if (Array.isArray(node)) return node.map(extractText).join(" ")
      if (node.children) return extractText(node.children)
      if (node.text) return node.text
      if (node.leaves) return node.leaves.map(extractText).join(" ")
      return ""
    }

    return extractText(description.document)
  }

  return ""
}
