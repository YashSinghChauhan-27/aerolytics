import React, { createContext, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const RefreshContext = createContext();

export const useRefresh = () => useContext(RefreshContext);

export const RefreshProvider = ({ children }) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const calculateDelay = () => {
            const now = new Date();
            const nextHour = new Date(now);
            nextHour.setHours(now.getHours() + 1);
            nextHour.setMinutes(0);
            nextHour.setSeconds(0);
            nextHour.setMilliseconds(0);
            return nextHour.getTime() - now.getTime();
        };

        const scheduleRefresh = () => {
            const delay = calculateDelay();
            console.log(`Scheduling background refresh in ${Math.round(delay / 60000)} minutes`);

            const timer = setTimeout(() => {
                console.log("Global Refresh Triggered: Invalidating Cache...");
                // This forces a background refetch for all active queries
                queryClient.invalidateQueries();
                scheduleRefresh(); // Recurse
            }, delay);

            return timer;
        };

        const timerId = scheduleRefresh();
        return () => clearTimeout(timerId);
    }, [queryClient]);

    return (
        <RefreshContext.Provider value={{}}>
            {children}
        </RefreshContext.Provider>
    );
};
