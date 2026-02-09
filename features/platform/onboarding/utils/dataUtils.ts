import { RESTAURANT_TEMPLATES } from '../config/templates';

export function getItemsFromJsonData(jsonData: any, sectionType: string): string[] {
  if (!jsonData) return [];

  switch (sectionType) {
    case 'storeInfo':
      return jsonData.storeInfo ? [jsonData.storeInfo.name || 'Store Settings'] : ['Store Settings'];
    case 'kitchenStations':
      return (jsonData.kitchenStations || []).map((s: any) => s.name || 'Unknown Station');
    case 'floors':
      return (jsonData.floors || []).map((f: any) => f.name || 'Unknown Floor');
    case 'sections':
      return (jsonData.sections || []).map((s: any) => s.name || 'Unknown Section');
    case 'tables':
      return (jsonData.tables || []).map((t: any) => `Table ${t.tableNumber}`);
    case 'paymentMethods':
      return (jsonData.paymentMethods || []).map((p: any) => p.name || 'Unknown Payment Method');
    case 'categories':
      return (jsonData.categories || []).map((c: any) => c.name || 'Unknown Category');
    case 'menuItems':
      return (jsonData.menuItems || []).map((m: any) => m.name || 'Unknown Item');
    case 'modifiers':
      return (jsonData.modifiers || []).map((m: any) => m.name || 'Unknown Modifier');
    default:
      return [];
  }
}

export function getSeedForTemplate(template: 'full' | 'minimal' | 'custom', seedData: any) {
  const templateToUse = template === 'custom' ? 'minimal' : template;
  const tpl = RESTAURANT_TEMPLATES[templateToUse];
  
  return {
    storeInfo: seedData.storeInfo,
    kitchenStations: (seedData.kitchenStations || []).filter((s: any) =>
      tpl.displayNames.kitchenStations.includes(s.name)
    ),
    floors: (seedData.floors || []).filter((f: any) =>
      tpl.displayNames.floors.includes(f.name)
    ),
    sections: (seedData.sections || []).filter((s: any) =>
      tpl.displayNames.sections.includes(s.name)
    ),
    tables: (seedData.tables || []).filter((t: any) =>
      tpl.displayNames.tables.includes(`Table ${t.tableNumber}`)
    ),
    paymentMethods: (seedData.paymentMethods || []).filter((p: any) =>
      tpl.displayNames.paymentMethods.includes(p.name)
    ),
    categories: (seedData.categories || []).filter((c: any) =>
      tpl.displayNames.categories.includes(c.name)
    ),
    menuItems: (seedData.menuItems || []).filter((m: any) =>
      tpl.displayNames.menuItems.includes(m.name)
    ),
    modifiers: (seedData.modifiers || []).filter((m: any) =>
      tpl.displayNames.modifiers.includes(m.name)
    ),
  };
}
