import React, { useState } from "react";
import { Copy, Check, Clipboard, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataCard } from "./DataCard";
import seedData from "@/features/platform/onboarding/lib/seed.json";

interface CustomSetupStepsProps {
  currentJson?: any;
  onJsonUpdate?: (newJson: any) => void;
  onBack?: () => void;
}

function useCopyToClipboard(): [
  string | null,
  (text: string) => Promise<boolean>
] {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = React.useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard not supported");
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch (error) {
      console.warn("Copy failed", error);
      setCopiedText(null);
      return false;
    }
  }, []);

  return [copiedText, copy];
}

// Get complete setup configuration from seed data
function getCompleteSetupJson() {
  return seedData;
}

export function CustomSetupSteps({
  currentJson,
  onJsonUpdate = () => {},
  onBack,
}: CustomSetupStepsProps) {
  const [, copy] = useCopyToClipboard();
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});
  const [customJson, setCustomJson] = useState("");
  const [jsonError, setJsonError] = useState("");

  // Use complete setup JSON as the base
  const completeJson = getCompleteSetupJson();

  const copyToClipboard = async (text: string, itemKey: string) => {
    try {
      const success = await copy(text);
      if (success) {
        setCopiedItems((prev) => ({ ...prev, [itemKey]: true }));
        setTimeout(() => {
          setCopiedItems((prev) => ({ ...prev, [itemKey]: false }));
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Generate the AI prompt focused on user questions rather than editing existing JSON
  const generateAIPrompt = () => {
    return `I need help customizing my restaurant configuration. I've pasted my current setup.

**Your first response should be:**

Start by telling me what this JSON configuration currently contains:

**RESTAURANT INFORMATION:**
- Name: Stack Kitchen
- Tagline: Cooked fresh, served your way
- Address: 742 Artisan Way, Brooklyn, NY 11201

**INFRASTRUCTURE:**
- Kitchen Stations: Grill, Fryer, Salad, Bar, Dessert, Prep
- Seating: 1 Floor, 2 Sections (Main Dining, Patio), 8 Tables

**MENU:**
- Categories: Featured, Burgers, Chicken, Sides, Drinks, Desserts
- Menu Items: 23 items including The Big Stack, Signature Cheeseburger, etc.
- Modifiers: Patty sizes, cheese types, extra toppings, drink sizes.

**PAYMENT:**
- Methods: Cash, Credit Card, Mobile Payment

Then ask: "This is what your restaurant configuration currently has. What would you like to change? 
As the user provides more changes to the JSON, keep asking what changes and once the user is finished and indicates they are done, return the JSON and tell them to paste it into the restaurant setup."

After I tell you what to change, modify the JSON and provide the complete updated configuration for me to paste.`;
  };

  const [jsonApplied, setJsonApplied] = useState(false);

  const validateAndApplyJson = () => {
    try {
      const parsed = JSON.parse(customJson);

      const requiredKeys = [
        "storeInfo",
        "kitchenStations",
        "floors",
        "sections",
        "tables",
        "paymentMethods",
        "categories",
        "menuItems",
        "modifiers",
      ];
      const missingKeys = requiredKeys.filter((key) => {
        if (key === "storeInfo") {
          return !parsed[key] || typeof parsed[key] !== "object";
        }
        return !parsed[key] || !Array.isArray(parsed[key]);
      });

      if (missingKeys.length > 0) {
        setJsonError(`Missing required keys: ${missingKeys.join(", ")}`);
        return;
      }

      onJsonUpdate(parsed);
      setJsonApplied(true);
      setJsonError("");
    } catch (err) {
      setJsonError("Invalid JSON format. Please check your syntax.");
    }
  };

  const steps = [
    {
      number: 1,
      title: "Copy Base Configuration",
      description: "Start with our complete restaurant template JSON configuration",
      content: (
        <DataCard
          title="Onboarding Data"
          content={JSON.stringify(completeJson, null, 2)}
          onCopy={copyToClipboard}
          copied={copiedItems.json || false}
          copyKey="json"
        />
      ),
    },
    {
      number: 2,
      title: "Copy AI Customization Prompt",
      description:
        "Use this prompt with any AI assistant to get your custom configuration",
      content: (
        <DataCard
          title="AI Prompt"
          content={generateAIPrompt()}
          onCopy={copyToClipboard}
          copied={copiedItems.prompt || false}
          copyKey="prompt"
        />
      ),
    },
    {
      number: 3,
      title: "Chat with AI",
      description:
        "The AI will ask you about your restaurant, menu, kitchen setup, and seating, and help you customize your setup",
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            The AI will ask you questions about your business such as:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• What is your restaurant's name and address?</li>
            <li>• What menu items and categories do you want?</li>
            <li>• How many floors and tables do you have?</li>
            <li>• What kitchen stations do you need?</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Answer the AI's questions to get your custom JSON configuration.
          </p>
        </div>
      ),
    },
    {
      number: 4,
      title: "Paste Your Custom JSON",
      description: "Paste the AI-generated configuration here",
      content: (
        <div className="rounded-lg border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
            <span className="text-sm font-medium text-muted-foreground">
              Custom Onboarding Data
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  setCustomJson(text);
                  setJsonError("");
                } catch (err) {
                  console.error("Failed to paste:", err);
                }
              }}
              className="h-6 w-6 p-0 hover:bg-background/80"
            >
              <Clipboard className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
          <div className="bg-background">
            <Textarea
              placeholder="Paste your customized JSON configuration here..."
              value={customJson}
              onChange={(e) => {
                setCustomJson(e.target.value);
                setJsonError("");
              }}
              className="min-h-[200px] font-mono text-xs resize-none border-0 bg-transparent focus:outline-none p-4 rounded-none"
            />
          </div>
          {jsonError && (
            <div className="px-4 pb-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2">
                <p className="text-xs text-destructive">{jsonError}</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-end px-4 py-2 bg-muted border-t">
            <Button
              size="sm"
              onClick={validateAndApplyJson}
              disabled={!customJson.trim()}
            >
              Apply Configuration
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {jsonApplied && onBack && (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setJsonApplied(false);
              onBack();
            }}
            className="h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Custom Setup
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Custom Setup Configuration
        </Label>
        <p className="text-xs text-muted-foreground">
          Follow these steps to create a personalized restaurant setup using AI
          assistance.
        </p>
      </div>

      <div className="space-y-0">
        {steps.map((step, index) => (
          <div key={step.number} className="relative">
            {/* Connecting line between sections */}
            {index < steps.length - 1 && (
              <div className="absolute left-3 top-3 bottom-0 w-[1px] bg-border"></div>
            )}

            {/* Section header with number badge */}
            <div className="flex items-center space-x-3 mb-2 relative">
              <div className="inline-flex size-6 items-center justify-center rounded-sm border border-border bg-background text-sm text-foreground shadow-sm z-10">
                {step.number}
              </div>
              <Label className="text-sm font-medium text-foreground">
                {step.title}
              </Label>
            </div>

            {/* Section items */}
            <div className="pl-9">
              <div className="pb-6">
                <p className="text-xs text-muted-foreground mb-3">
                  {step.description}
                </p>
                {step.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
