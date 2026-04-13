import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Shield, Scale, FileText } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LegalDisclaimerProps {
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export function LegalDisclaimer({ onAccept, showAcceptButton = true }: LegalDisclaimerProps) {
  const [hasRead, setHasRead] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/accept-disclaimer");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onAccept?.();
    },
  });

  const canAccept = hasRead && hasAcknowledged;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-destructive/10">
          <Scale className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold">Important Legal Disclaimer</h1>
        <p className="text-muted-foreground">Please read carefully before using InsiderSignal</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Investment Risk Warning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Not Financial Advice
                </h3>
                <p className="text-muted-foreground">
                  The information provided on InsiderSignal is for general informational and educational purposes only. 
                  Nothing on this platform constitutes, or is intended to constitute, financial advice, investment advice, 
                  trading advice, legal advice, tax advice, or any other advice. InsiderSignal is not a registered 
                  investment advisor, broker-dealer, or financial planner. We are not licensed to provide financial advice 
                  in any jurisdiction. You should consult with qualified, licensed professionals before making any 
                  financial or investment decisions.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  High Risk of Financial Loss
                </h3>
                <p className="text-muted-foreground">
                  Trading and investing in securities, including stocks, options, futures, forex, cryptocurrencies, 
                  and other financial instruments involves substantial risk of loss. You may lose some or all of your 
                  initial investment. Past performance does not guarantee future results. Historical data, patterns, 
                  and trends presented on this platform do not predict or guarantee future market movements. The value 
                  of investments can go down as well as up, and you may not get back the amount you originally invested.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Data Sources and Accuracy
                </h3>
                <p className="text-muted-foreground">
                  InsiderSignal aggregates data from publicly available sources including SEC EDGAR Form 4 filings, 
                  STOCK Act congressional disclosures, and social media sentiment aggregators. While we strive for 
                  accuracy, we make no warranties or representations regarding the accuracy, completeness, timeliness, 
                  or reliability of any information displayed. Data may be delayed, incomplete, or contain errors. 
                  Official filings may be amended, corrected, or superseded. Always verify information through official 
                  sources before making decisions.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">AI-Generated Analysis</h3>
                <p className="text-muted-foreground">
                  This platform uses artificial intelligence to analyze trading patterns and generate alerts. AI-generated 
                  content is algorithmic in nature and based on pattern recognition. AI analysis should not be considered 
                  as investment recommendations or advice. The AI may produce false positives, miss important patterns, 
                  or misinterpret data. AI confidence scores are estimates and do not represent probabilities of market 
                  outcomes. Never rely solely on AI-generated alerts for investment decisions.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">Insider Trading Information</h3>
                <p className="text-muted-foreground">
                  Information about insider trading activity is derived from mandatory SEC Form 4 filings. Insider 
                  transactions occur for many reasons unrelated to company prospects, including diversification, 
                  tax planning, estate planning, and personal liquidity needs. The presence of insider buying or 
                  selling does not necessarily indicate the future direction of a stock's price. Many insiders sell 
                  shares pursuant to pre-scheduled 10b5-1 trading plans and not based on material non-public information.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">Congressional Trading Data</h3>
                <p className="text-muted-foreground">
                  Congressional trading data is derived from STOCK Act disclosures filed by members of Congress. 
                  These disclosures may be filed up to 45 days after a transaction. Reported amounts are ranges, 
                  not exact figures. Committee memberships shown may not represent access to specific non-public 
                  information. Correlation between trades and subsequent events does not imply causation or 
                  illegal activity.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">Social Media Sentiment</h3>
                <p className="text-muted-foreground">
                  Social media sentiment data is aggregated from third-party sources monitoring Reddit and other 
                  platforms. Social media discussions are speculative and should not be considered investment research. 
                  High social media activity may indicate increased volatility risk. Social sentiment can change rapidly 
                  and unpredictably. Discussions may be influenced by coordinated campaigns or misinformation.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">Limitation of Liability</h3>
                <p className="text-muted-foreground">
                  TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, INSIDERSIGNAL AND ITS AFFILIATES, OFFICERS, 
                  DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, 
                  CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF 
                  PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR USE OR INABILITY 
                  TO USE THE SERVICE; (B) ANY INVESTMENT OR TRADING DECISIONS MADE BASED ON INFORMATION PROVIDED 
                  BY THE SERVICE; (C) ANY UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR DATA; OR (D) ANY OTHER 
                  MATTER RELATING TO THE SERVICE.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">Your Sole Responsibility</h3>
                <p className="text-muted-foreground">
                  You assume full responsibility for all investment and trading decisions you make. You agree that 
                  InsiderSignal shall not be responsible or liable for any trading or investment decisions you make 
                  based on information presented on this platform. You acknowledge that you have the financial 
                  knowledge and experience to evaluate the risks and rewards of any investment, and that you will 
                  conduct your own due diligence before making any financial decisions. You should only invest 
                  funds that you can afford to lose entirely.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">Regulatory Compliance</h3>
                <p className="text-muted-foreground">
                  This platform does not engage in broker-dealer activities. We do not execute trades, hold customer 
                  funds, or provide personalized investment advice. Users are responsible for ensuring their own 
                  compliance with applicable securities laws and regulations in their jurisdiction. This service 
                  may not be available in all jurisdictions.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">No Guarantees</h3>
                <p className="text-muted-foreground">
                  We make no guarantees regarding the accuracy, profitability, or completeness of any information 
                  provided. Market conditions, opinions, and recommendations may change without notice. Hypothetical 
                  or simulated performance results have inherent limitations and may not reflect actual trading 
                  results. There are no guarantees that any strategy or method will be profitable.
                </p>
              </section>

              <section className="pb-4">
                <h3 className="font-semibold mb-2">Acceptance of Terms</h3>
                <p className="text-muted-foreground">
                  By clicking "I Accept" below, you acknowledge that you have read, understood, and agree to be 
                  bound by this disclaimer. If you do not agree with any part of this disclaimer, you must not 
                  use InsiderSignal. This disclaimer is subject to change without notice, and your continued use 
                  of the service constitutes acceptance of any modifications.
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {showAcceptButton && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="read" 
                checked={hasRead} 
                onCheckedChange={(checked) => setHasRead(checked === true)}
                data-testid="checkbox-read-disclaimer"
              />
              <label htmlFor="read" className="text-sm leading-relaxed cursor-pointer">
                I have read and understood the entire legal disclaimer above, including the risks associated with 
                investing and the limitations of the information provided by InsiderSignal.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox 
                id="acknowledge" 
                checked={hasAcknowledged} 
                onCheckedChange={(checked) => setHasAcknowledged(checked === true)}
                data-testid="checkbox-acknowledge-disclaimer"
              />
              <label htmlFor="acknowledge" className="text-sm leading-relaxed cursor-pointer">
                I acknowledge that InsiderSignal does not provide financial advice, that past performance does not 
                guarantee future results, and that I am solely responsible for my own investment decisions. I agree 
                that InsiderSignal shall not be held liable for any losses I may incur.
              </label>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              disabled={!canAccept || acceptMutation.isPending}
              onClick={() => acceptMutation.mutate()}
              data-testid="button-accept-disclaimer"
            >
              {acceptMutation.isPending ? "Processing..." : "I Accept and Agree to Continue"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By clicking above, you consent to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
