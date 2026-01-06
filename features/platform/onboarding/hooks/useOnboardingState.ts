import { useState, useEffect } from 'react';
import { RESTAURANT_TEMPLATES } from '../config/templates';
import { getSeedForTemplate, getItemsFromJsonData } from '../utils/dataUtils';
import seedData from '../lib/seed.json';

export type OnboardingStep = 'template' | 'progress' | 'done';
export type TemplateType = 'full' | 'minimal';

export interface OnboardingState {
  step: OnboardingStep;
  selectedTemplate: TemplateType;
  currentJsonData: any;
  progressMessage: string;
  loadingItems: Record<string, string[]>;
  completedItems: Record<string, string[]>;
  error: string | null;
  itemErrors: Record<string, Record<string, string | undefined>>;
  isLoading: boolean;
}

const initialItemsState = {
  storeInfo: [],
  kitchenStations: [],
  floors: [],
  sections: [],
  tables: [],
  paymentMethods: [],
  categories: [],
  menuItems: [],
  modifiers: [],
};

export function useOnboardingState() {
  const [state, setState] = useState<OnboardingState>({
    step: 'template',
    selectedTemplate: 'full',
    currentJsonData: null,
    progressMessage: '',
    loadingItems: { ...initialItemsState },
    completedItems: { ...initialItemsState },
    error: null,
    itemErrors: {},
    isLoading: false,
  });

  useEffect(() => {
    const templateData = getSeedForTemplate(state.selectedTemplate, seedData);
    setState(prev => ({
      ...prev,
      currentJsonData: templateData,
    }));
  }, [state.selectedTemplate]);

  const setStep = (step: OnboardingStep) => {
    setState(prev => ({ ...prev, step }));
  };

  const setSelectedTemplate = (template: TemplateType) => {
    setState(prev => ({ ...prev, selectedTemplate: template }));
  };

  const setCurrentJsonData = (data: any) => {
    setState(prev => ({ ...prev, currentJsonData: data }));
  };

  const setIsLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setProgressMessage = (message: string) => {
    setState(prev => ({ ...prev, progressMessage: message }));
  };

  const getDisplayNamesFromData = (data: any) => {
    return {
      storeInfo: getItemsFromJsonData(data, 'storeInfo'),
      kitchenStations: getItemsFromJsonData(data, 'kitchenStations'),
      floors: getItemsFromJsonData(data, 'floors'),
      sections: getItemsFromJsonData(data, 'sections'),
      tables: getItemsFromJsonData(data, 'tables'),
      paymentMethods: getItemsFromJsonData(data, 'paymentMethods'),
      categories: getItemsFromJsonData(data, 'categories'),
      menuItems: getItemsFromJsonData(data, 'menuItems'),
      modifiers: getItemsFromJsonData(data, 'modifiers'),
    };
  };

  const setProgress = (message: string) => {
    setProgressMessage(message);

    const displayNames = state.currentJsonData
      ? getDisplayNamesFromData(state.currentJsonData)
      : RESTAURANT_TEMPLATES[state.selectedTemplate].displayNames;

    // Progress through sections in order
    if (message.includes('kitchen stations')) {
      setState(prev => ({
        ...prev,
        completedItems: {
          ...prev.completedItems,
          storeInfo: [...displayNames.storeInfo],
        },
        loadingItems: {
          ...prev.loadingItems,
          storeInfo: [],
        }
      }));
    } else if (message.includes('floors')) {
      setState(prev => ({
        ...prev,
        completedItems: {
          ...prev.completedItems,
          storeInfo: [...displayNames.storeInfo],
          kitchenStations: [...displayNames.kitchenStations],
        },
        loadingItems: {
          ...prev.loadingItems,
          kitchenStations: [],
        }
      }));
    } else if (message.includes('sections')) {
      setState(prev => ({
        ...prev,
        completedItems: {
          ...prev.completedItems,
          storeInfo: [...displayNames.storeInfo],
          kitchenStations: [...displayNames.kitchenStations],
          floors: [...displayNames.floors],
        },
        loadingItems: {
          ...prev.loadingItems,
          floors: [],
        }
      }));
    } else if (message.includes('tables')) {
      setState(prev => ({
        ...prev,
        completedItems: {
          ...prev.completedItems,
          storeInfo: [...displayNames.storeInfo],
          kitchenStations: [...displayNames.kitchenStations],
          floors: [...displayNames.floors],
          sections: [...displayNames.sections],
        },
        loadingItems: {
          ...prev.loadingItems,
          sections: [],
        }
      }));
    } else if (message.includes('payment')) {
      setState(prev => ({
        ...prev,
        completedItems: {
          ...prev.completedItems,
          storeInfo: [...displayNames.storeInfo],
          kitchenStations: [...displayNames.kitchenStations],
          floors: [...displayNames.floors],
          sections: [...displayNames.sections],
          tables: [...displayNames.tables],
        },
        loadingItems: {
          ...prev.loadingItems,
          tables: [],
        }
      }));
    } else if (message.includes('menu categories')) {
      setState(prev => ({
        ...prev,
        completedItems: {
          ...prev.completedItems,
          storeInfo: [...displayNames.storeInfo],
          kitchenStations: [...displayNames.kitchenStations],
          floors: [...displayNames.floors],
          sections: [...displayNames.sections],
          tables: [...displayNames.tables],
          paymentMethods: [...displayNames.paymentMethods],
        },
        loadingItems: {
          ...prev.loadingItems,
          paymentMethods: [],
        }
      }));
    } else if (message.includes('menu items')) {
      setState(prev => ({
        ...prev,
        completedItems: {
          ...prev.completedItems,
          storeInfo: [...displayNames.storeInfo],
          kitchenStations: [...displayNames.kitchenStations],
          floors: [...displayNames.floors],
          sections: [...displayNames.sections],
          tables: [...displayNames.tables],
          paymentMethods: [...displayNames.paymentMethods],
          categories: [...displayNames.categories],
        },
        loadingItems: {
          ...prev.loadingItems,
          categories: [],
        }
      }));
    } else if (message.includes('modifiers')) {
      setState(prev => ({
        ...prev,
        completedItems: {
          ...prev.completedItems,
          storeInfo: [...displayNames.storeInfo],
          kitchenStations: [...displayNames.kitchenStations],
          floors: [...displayNames.floors],
          sections: [...displayNames.sections],
          tables: [...displayNames.tables],
          paymentMethods: [...displayNames.paymentMethods],
          categories: [...displayNames.categories],
          menuItems: [...displayNames.menuItems],
        },
        loadingItems: {
          ...prev.loadingItems,
          menuItems: [],
        }
      }));
    } else if (message.includes('complete')) {
      setState(prev => ({
        ...prev,
        loadingItems: {
          ...prev.loadingItems,
          modifiers: [],
        },
        completedItems: {
          storeInfo: [...displayNames.storeInfo],
          kitchenStations: [...displayNames.kitchenStations],
          floors: [...displayNames.floors],
          sections: [...displayNames.sections],
          tables: [...displayNames.tables],
          paymentMethods: [...displayNames.paymentMethods],
          categories: [...displayNames.categories],
          menuItems: [...displayNames.menuItems],
          modifiers: [...displayNames.modifiers],
        }
      }));
    }
  };

  const setLoadingItems = (items: Record<string, string[]>) => {
    setState(prev => ({ ...prev, loadingItems: items }));
  };

  const setCompletedItems = (items: Record<string, string[]>) => {
    setState(prev => ({ ...prev, completedItems: items }));
  };

  const setItemErrors = (errors: Record<string, Record<string, string | undefined>>) => {
    setState(prev => ({ ...prev, itemErrors: errors }));
  };

  const setItemLoading = (type: string, item: string) => {
    setState(prev => ({
      ...prev,
      loadingItems: {
        ...prev.loadingItems,
        [type]: [...(prev.loadingItems[type] || []), item],
      },
      itemErrors: {
        ...prev.itemErrors,
        [type]: prev.itemErrors[type] ? {
          ...prev.itemErrors[type],
          [item]: undefined
        } : {}
      }
    }));
  };

  const setItemCompleted = (type: string, item: string) => {
    setState(prev => ({
      ...prev,
      loadingItems: {
        ...prev.loadingItems,
        [type]: (prev.loadingItems[type] || []).filter((i) => i !== item),
      },
      completedItems: {
        ...prev.completedItems,
        [type]: [...(prev.completedItems[type] || []), item],
      },
      itemErrors: {
        ...prev.itemErrors,
        [type]: prev.itemErrors[type] ? {
          ...prev.itemErrors[type],
          [item]: undefined
        } : {}
      }
    }));
  };

  const setItemError = (type: string, item: string, errorMessage: string) => {
    setState(prev => ({
      ...prev,
      loadingItems: {
        ...prev.loadingItems,
        [type]: (prev.loadingItems[type] || []).filter((i) => i !== item),
      },
      itemErrors: {
        ...prev.itemErrors,
        [type]: {
          ...(prev.itemErrors[type] || {}),
          [item]: errorMessage,
        }
      }
    }));
  };

  const resetOnboardingState = () => {
    setState(prev => ({
      ...prev,
      error: null,
      itemErrors: {},
      loadingItems: { ...initialItemsState },
      completedItems: { ...initialItemsState },
    }));
  };

  return {
    ...state,
    setStep,
    setSelectedTemplate,
    setCurrentJsonData,
    setIsLoading,
    setError,
    setProgress,
    setLoadingItems,
    setCompletedItems,
    setItemErrors,
    setItemLoading,
    setItemCompleted,
    setItemError,
    resetOnboardingState,
    getDisplayNamesFromData,
  };
}
