import { useState, useEffect, useMemo } from 'react';

// Configuration for IANA Timezones and Local Hours
const SESSIONS_CONFIG = [
    {
        name: 'Sydney',
        city: 'Sydney',
        tz: 'Australia/Sydney',
        openHour: 7, // 7:00 AM Local
        closeHour: 16, // 4:00 PM Local
        color: '#06b6d4', // Cyan
        coordinates: [151.2093, -33.8688]
    },
    {
        name: 'Tokyo',
        city: 'Tokyo',
        tz: 'Asia/Tokyo',
        openHour: 9, // 9:00 AM Local
        closeHour: 18, // 6:00 PM Local
        color: '#eab308', // Yellow
        coordinates: [139.6503, 35.6762]
    },
    {
        name: 'London',
        city: 'London',
        tz: 'Europe/London',
        openHour: 8, // 8:00 AM Local
        closeHour: 17, // 5:00 PM Local
        color: '#3b82f6', // Blue
        coordinates: [-0.1278, 51.5074]
    },
    {
        name: 'New York',
        city: 'New York',
        tz: 'America/New_York',
        openHour: 8, // 8:00 AM Local
        closeHour: 17, // 5:00 PM Local
        color: '#22c55e', // Green
        coordinates: [-74.0060, 40.7128]
    }
];

export function useMarketSessions() {
    // Update every second
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const sessionData = useMemo(() => {
        // --- 1. Basic Status & Weekend Rules ---
        const utcDay = now.getUTCDay(); // 0=Sun, 1=Mon... 6=Sat
        const utcHour = now.getUTCHours();

        // Strict Weekend Rules
        const isFridayAfterClose = (utcDay === 5 && utcHour >= 21);
        const isSaturday = (utcDay === 6);
        const isSundayBeforeOpen = (utcDay === 0 && utcHour < 21);
        const isGlobalWeekend = isFridayAfterClose || isSaturday || isSundayBeforeOpen;

        // Process individual sessions
        const activeSessions = [];
        const sessions = SESSIONS_CONFIG.map(config => {
            const fmt = new Intl.DateTimeFormat('en-US', {
                timeZone: config.tz,
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hour12: false,
                weekday: 'short'
            });
            const parts = fmt.formatToParts(now);
            const getPart = (type) => parts.find(p => p.type === type)?.value;

            const localHour = parseInt(getPart('hour'), 10);
            const localMinute = parseInt(getPart('minute'), 10);
            const localWeekday = getPart('weekday');

            let status = 'CLOSED';
            let isOpen = false;
            let infoText = '';

            if (isGlobalWeekend) {
                status = 'CLOSED';
                isOpen = false;
                infoText = 'Weekend Close';
            } else {
                // Not global weekend
                if (localWeekday === 'Sat' || localWeekday === 'Sun') {
                    // Local weekend
                    // Check if it's actually Sydney Monday morning (which is Sun UTC)?
                    // If local day is Sat/Sun, usually implies closed unless special case.
                    // Sydney Mon 7am is fine.
                } else {
                    // Mon-Fri Local
                    if (localHour >= config.openHour && localHour < config.closeHour) {
                        status = 'OPEN';
                        isOpen = true;
                        activeSessions.push(config.name);
                    }
                }

                // Info Text Logic
                if (isOpen) {
                    const minutesLeft = (config.closeHour * 60) - ((localHour * 60) + localMinute);
                    if (minutesLeft <= 60 && minutesLeft > 0) status = 'CLOSING SOON';
                    const h = Math.floor(minutesLeft / 60);
                    const m = minutesLeft % 60;
                    infoText = `Closes in ${h}h ${m}m`;
                } else {
                    // Time to open logic (simplified)
                    let minToOpen = 0;
                    if (localHour < config.openHour) {
                        minToOpen = (config.openHour * 60) - ((localHour * 60) + localMinute);
                    } else {
                        // Opens tomorrow: (24 - now + open)
                        minToOpen = ((24 - localHour + config.openHour) * 60) - localMinute;
                    }
                    const h = Math.floor(minToOpen / 60);
                    const m = minToOpen % 60;

                    if (localHour === config.openHour - 1) status = 'OPENS SOON';

                    infoText = h > 12 ? `Opens at ${config.openHour}:00` : `Opens in ${h}h ${m}m`;
                }
            }

            return {
                ...config,
                isOpen,
                status,
                infoText,
                localTime: `${localHour.toString().padStart(2, '0')}:${localMinute.toString().padStart(2, '0')}`
            };
        });

        // --- 2. Advanced Session Intelligence ---

        const isLondonOpen = activeSessions.includes('London');
        const isNYOpen = activeSessions.includes('New York');
        const isTokyoOpen = activeSessions.includes('Tokyo');
        const isSydneyOpen = activeSessions.includes('Sydney');

        // Overlap Logic
        const isLondonNYOverlap = isLondonOpen && isNYOpen;

        // Liquidity Scoring Logic
        let liquidityScore = 'LOW';
        let volatility = 'LOW';
        let sessionMessage = 'Low liquidity. Caution advised.';
        let verdict = 'AVOID'; // AVOID, TRADE_SMALL, TRADE_NORMAL, OPTIMAL
        let verdictReason = 'Low probability session.';

        if (isGlobalWeekend) {
            liquidityScore = 'NONE';
            volatility = 'NONE';
            sessionMessage = 'Markets Closed. Weekend Session.';
            verdict = 'AVOID';
            verdictReason = 'Markets are closed.';
        } else {
            // Priority Check: Overlap
            if (isLondonNYOverlap) {
                liquidityScore = 'HIGH';
                volatility = 'HIGH';
                sessionMessage = 'London–NY Overlap Active. Peak Liquidity.';
                verdict = 'OPTIMAL';
                verdictReason = 'Highest probability window.';
            }
            // London Only
            else if (isLondonOpen) {
                liquidityScore = 'MEDIUM';
                volatility = 'MEDIUM';
                sessionMessage = 'London Session Active.';
                verdict = 'TRADE_NORMAL';
                verdictReason = 'Standard execution conditions.';

                // London Open Volatility Boost (First 2 hours: 8-10 Local)
                const london = sessions.find(s => s.name === 'London');
                const londonHour = parseInt(london.localTime.split(':')[0]);
                if (londonHour >= 8 && londonHour < 10) {
                    volatility = 'HIGH';
                    sessionMessage = 'London Open. High Volatility.';
                    verdict = 'OPTIMAL';
                    verdictReason = 'London Open momentum.';
                }
            }
            // NY Only
            else if (isNYOpen) {
                liquidityScore = 'MEDIUM';
                volatility = 'MEDIUM';
                sessionMessage = 'New York Session Active.';
                verdict = 'TRADE_NORMAL';
                verdictReason = 'Standard execution conditions.';

                // Late NY Fade (After 3pm Local)
                const ny = sessions.find(s => s.name === 'New York');
                const nyHour = parseInt(ny.localTime.split(':')[0]);
                if (nyHour >= 15) {
                    liquidityScore = 'LOW';
                    volatility = 'LOW';
                    sessionMessage = 'Late NY Session. Liquidity drying up.';
                    verdict = 'TRADE_SMALL';
                    verdictReason = 'End of day chop risk.';
                }
            }
            // Asian Session
            else if (isTokyoOpen || isSydneyOpen) {
                liquidityScore = 'LOW';
                volatility = 'LOW';
                sessionMessage = 'Asian Session. Lower volatility range.';
                verdict = 'TRADE_SMALL';
                verdictReason = 'Risk of consolidation/chop.';
            }
        }

        return {
            sessions,
            isGlobalWeekend,
            utcTime: now.toISOString().substring(11, 19) + ' UTC',
            intelligence: {
                liquidityScore,
                volatility,
                isLondonNYOverlap,
                activeSessions,
                sessionMessage,
                verdict,
                verdictReason
            }
        };

    }, [now]);

    return { ...sessionData };
}
