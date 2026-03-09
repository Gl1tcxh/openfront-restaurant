import { StoreSettingsPage } from './StoreSettingsPage'
import { getStoreSettings } from '@/features/storefront/lib/data/menu'

export async function StoreSettingsPageServer() {
  const initialSettings = await getStoreSettings()
  return <StoreSettingsPage initialSettings={initialSettings} />
}

export default StoreSettingsPageServer
