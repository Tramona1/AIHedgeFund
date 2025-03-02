"use client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const FAQData = [
  {
    question: "How are the alerts generated?",
    answer:
      "Our AI system continuously monitors market data, SEC filings, options flow, and social sentiment to identify significant events that could impact stock prices. We process this data in real-time to deliver actionable insights to our users.",
  },
  {
    question: "How quickly will I receive alerts?",
    answer:
      "Real-time alerts are delivered within seconds of detection. Weekly summaries are sent every Sunday evening before market open, giving you a comprehensive overview before trading begins.",
  },
  {
    question: "Can I customize which alerts I receive?",
    answer:
      "Yes! Even with our free tier, you can track up to 3 assets. Pro and Enterprise plans allow for custom alert settings based on specific stocks, sectors, event types, and significance thresholds.",
  },
  {
    question: "How is this different from other services?",
    answer:
      "We focus specifically on institutional activity and hedge fund movements, giving you insights typically only available to professional traders. Our AI-powered platform democratizes access to elite market intelligence, starting with our free tier.",
  },
  {
    question: "What's included in the free tier?",
    answer:
      "Our free tier includes tracking for up to 3 assets (stocks, crypto, or REITs), weekly market summaries, and basic AI-driven insights. It's perfect for anyone who wants to stay informed about their investments without any cost.",
  },
  {
    question: "Do I need to be an experienced trader to use this?",
    answer:
      "Not at all! Our platform is designed to be accessible to everyone, from first-time investors to seasoned traders. We translate complex market data into clear, actionable insights that anyone can understand.",
  },
]

export function FAQ() {
  return (
    <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
      {FAQData.map((item, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-left text-lg font-semibold">{item.question}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
} 