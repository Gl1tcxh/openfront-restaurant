/**
 * KDS (Kitchen Display System) Page - Server Component
 * Displays incoming orders by kitchen station
 */

import React from 'react'
import { KDSClient } from './KDSClient'

export async function KDSPage() {
  return <KDSClient />
}

export default KDSPage
