// "use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

const useFetch = (cb) => {
    const [data, setData] = useState(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fn = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        setData(undefined); // Reset data before new operation

        try {
            const response = await cb(...args);
            setData(response);
            setError(null);
        } catch (error) {
            setError(error);
            setData(undefined);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [cb]);

    const reset = useCallback(() => {
        setData(undefined);
        setLoading(false);
        setError(null);
    }, []);

    return { data, loading, error, fn, setData, reset };
};

export default useFetch;
