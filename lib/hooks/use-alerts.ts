import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useAlerts(segmentId?: string) {
  const query = segmentId ? `?segmentId=${segmentId}&isActive=true` : "?isActive=true"

  const { data, error, isLoading, mutate } = useSWR(`/api/alerts${query}`, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  })

  return {
    alerts: data?.data || [],
    isLoading,
    error,
    mutate,
  }
}

export function useModelPerformance() {
  const { data, error, isLoading } = useSWR("/api/model-performance", fetcher, {
    refreshInterval: 60000, // Refresh every minute
  })

  return {
    metrics: data?.data || [],
    isLoading,
    error,
  }
}

export function usePredictions(segmentId: string, modelType?: string) {
  const query = modelType
    ? `?segmentId=${segmentId}&modelType=${modelType}&limit=24`
    : `?segmentId=${segmentId}&limit=24`

  const { data, error, isLoading } = useSWR(`/api/predictions${query}`, fetcher, {
    refreshInterval: 60000, // Refresh every minute
  })

  return {
    predictions: data?.data || [],
    isLoading,
    error,
  }
}
