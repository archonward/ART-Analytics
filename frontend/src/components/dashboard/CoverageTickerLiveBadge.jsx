import CompactTickerBadge from '../common/CompactTickerBadge';
import useMarketData from '../../hooks/useMarketData';

export default function CoverageTickerLiveBadge({ ticker }) {
  const {
    marketData,
    marketLoading,
    marketError,
    marketUnavailable
  } = useMarketData(ticker, true);

  return (
    <CompactTickerBadge
      marketData={marketData}
      marketLoading={marketLoading}
      marketError={marketError}
      marketUnavailable={marketUnavailable}
    />
  );
}