import { useState, useEffect, useCallback } from 'react';

export function useDataFetching<T>(
    fetcher: () => Promise<T>,
    initialState: T | null = null
) {
    const [data, setData] = useState<T | null>(initialState);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const result = await fetcher();
            setData(result);
            setError(null);
        } catch (err) {
            setError("Failed to fetch data. Please try again later.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [fetcher]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
