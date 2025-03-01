import React from "react";

interface Ticker {
  symbol: string;
  change: string;
  color: string;
}

interface TickerTapeProps {
  tickers?: Ticker[];
  className?: string;
}

export const TickerTape = ({ tickers, className = "" }: TickerTapeProps) => {
  const defaultTickers: Ticker[] = [
    { symbol: "AAPL", change: "+1.2%", color: "text-green-500" },
    { symbol: "GOOGL", change: "+0.8%", color: "text-green-500" },
    { symbol: "MSFT", change: "+1.5%", color: "text-green-500" },
    { symbol: "TSLA", change: "-0.6%", color: "text-red-500" },
    { symbol: "META", change: "+2.1%", color: "text-green-500" },
    { symbol: "NVDA", change: "+3.2%", color: "text-green-500" },
    { symbol: "AMZN", change: "+0.9%", color: "text-green-500" },
    { symbol: "JPM", change: "-0.4%", color: "text-red-500" },
  ];

  const tickersToUse = tickers || defaultTickers;

  return (
    <div className={`bg-muted/20 py-2 overflow-hidden border-b ${className}`}>
      <div className="flex items-center animate-[marquee_30s_linear_infinite] whitespace-nowrap">
        {tickersToUse.concat(tickersToUse).map((ticker, i) => (
          <div key={i} className="flex items-center mx-6">
            <span className="font-semibold">{ticker.symbol}</span>
            <span className={`ml-2 ${ticker.color}`}>{ticker.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TickerTape; 