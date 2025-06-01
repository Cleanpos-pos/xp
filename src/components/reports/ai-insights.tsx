import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export function AiInsights() {
  // In a real application, this data would come from an AI flow
  // defined in src/ai/flows, processed, and passed here.
  const mockInsights = [
    "Sales for 'Suit Cleaning' are up 25% this month compared to last month's average.",
    "Anomaly Detected: Unusually high number of 'Silk Blouse' cleaning requests this week (15 items vs. avg. 3). Consider checking silk solvent stock.",
    "Trend: Average order value has increased by 8% over the last quarter.",
    "Observation: Friday afternoons show peak drop-off times. Consider adjusting staffing.",
  ];

  return (
    <Card className="shadow-md bg-accent/20 border-accent">
      <CardHeader>
        <CardTitle className="font-headline flex items-center">
          <Lightbulb className="mr-2 h-6 w-6 text-accent-foreground" />
          Automated Insights & Trends
        </CardTitle>
        <CardDescription>
          Powered by AI, these insights help you identify important trends and potential anomalies in your business data.
          This section would utilize Genkit flows from <code>src/ai/flows</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {mockInsights.map((insight, index) => (
            <li key={index} className="text-sm flex items-start">
              <span className="text-accent-foreground mr-2">&#8226;</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground mt-4">
          Note: These are sample insights. Actual insights would be dynamically generated.
        </p>
      </CardContent>
    </Card>
  );
}
