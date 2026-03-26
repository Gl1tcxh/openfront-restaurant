import { ListPage } from '@/features/dashboard/screens/ListPage'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export function MenuItemListPage({ searchParams }: PageProps) {
  return <ListPage listKey="menu-items" searchParams={searchParams} />
}

export default MenuItemListPage
