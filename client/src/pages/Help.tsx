import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, FileText, HelpCircle, Mail, Scale, Shield } from "lucide-react";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";

const faqs = [
  {
    question: "Where does the insider trading data come from?",
    answer: "All insider trading data comes directly from SEC EDGAR Form 4 filings. Form 4 is required by the SEC whenever company insiders (executives, directors, or 10%+ shareholders) buy or sell company stock. We fetch this data in real-time from the SEC's public API."
  },
  {
    question: "What are congressional trades?",
    answer: "Under the STOCK Act (Stop Trading on Congressional Knowledge Act) of 2012, members of Congress are required to disclose stock transactions within 45 days. This data comes from official House and Senate disclosures. Note: Some external APIs may have availability limitations."
  },
  {
    question: "How does the AI pattern detection work?",
    answer: "Our AI analyzes trading patterns looking for unusual activity such as cluster selling (multiple insiders selling around the same time), unusual timing (trades before major announcements), and volume anomalies. The AI provides confidence scores and explains its reasoning for each alert."
  },
  {
    question: "What is Social Buzz?",
    answer: "Social Buzz aggregates trending stock discussions from Reddit communities like r/wallstreetbets, r/stocks, and r/investing. Data is sourced from the ApeWisdom API, which tracks mentions, upvotes, and sentiment across these communities."
  },
  {
    question: "How accurate are the alerts?",
    answer: "AI alerts are designed to highlight potentially significant patterns, not guarantee trading signals. Always conduct your own research before making investment decisions. Past trading patterns do not guarantee future results."
  },
  {
    question: "How often is data updated?",
    answer: "SEC Form 4 data is fetched in real-time from EDGAR. Congressional disclosures update as they become available (typically within 45 days of trades). Social Buzz data refreshes every 5 minutes from ApeWisdom."
  },
];

const dataSources = [
  {
    name: "SEC EDGAR",
    description: "Official SEC database for Form 4 filings",
    url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4",
  },
  {
    name: "House Stock Watcher",
    description: "Congressional stock trade disclosures",
    url: "https://housestockwatcher.com",
  },
  {
    name: "Senate Stock Watcher", 
    description: "Senate financial disclosures",
    url: "https://senatestockwatcher.com",
  },
  {
    name: "ApeWisdom",
    description: "Reddit stock sentiment aggregator",
    url: "https://apewisdom.io",
  },
];

export default function Help() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-help-title">Help Center</h1>
        <p className="text-muted-foreground">Learn how InsiderSignal works and where our data comes from.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger 
                  className="text-left"
                  data-testid={`faq-question-${index}`}
                >
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Sources
          </CardTitle>
          <CardDescription>
            All data is sourced from official government filings and reputable aggregators.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dataSources.map((source, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
              data-testid={`data-source-${index}`}
            >
              <div>
                <p className="font-medium">{source.name}</p>
                <p className="text-sm text-muted-foreground">{source.description}</p>
              </div>
              <a 
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 text-sm"
              >
                Visit <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              InsiderSignal is an informational tool designed to aggregate and analyze publicly available data. 
              This is not financial advice.
            </p>
            <p>
              All trading information is sourced from official SEC filings and public disclosures. 
              AI-generated alerts are pattern-based observations and should not be the sole basis for investment decisions.
            </p>
            <p>
              Always consult with a qualified financial advisor before making investment decisions. 
              Past trading patterns do not guarantee future results.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-view-full-disclaimer">
                <Scale className="h-4 w-4" />
                View Full Legal Disclaimer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <LegalDisclaimer showAcceptButton={false} />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-muted-foreground">
                Have questions or need assistance? Reach out to our support team.
              </p>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
