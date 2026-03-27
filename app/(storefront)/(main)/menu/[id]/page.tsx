import MenuItemPage, {
  generateMetadata as generateMenuItemMetadata,
} from "@/features/storefront/screens/MenuItemPage"

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  return generateMenuItemMetadata(props)
}

export default MenuItemPage
