// Mock Base44 client to replace @api/sdk
export const api = {
  auth: {
    me: async () => ({
      id: 'mock-user-id',
      email: 'demo@example.com',
      full_name: 'Demo User',
      user_metadata: {
        full_name: 'Demo User'
      }
    }),
    logout: async () => {
      console.log('Mock Logout');
    },
    redirectToLogin: () => {
      console.log('Mock Redirect to Login');
    }
  },
  functions: {
    invoke: async (functionName, payload) => {
      console.log(`Mock invoking function: ${functionName}`, payload);

      if (functionName === 'fetchOandaData') {
        return {
          data: {
            ok: true,
            candles: Array.from({ length: 100 }, (_, i) => ({
              time: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
              mid: { o: "1.0850", h: "1.0860", l: "1.0840", c: "1.0855" }
            }))
          }
        };
      }

      if (functionName === 'computeMidnightOpenAnalysis') {
        return {
          data: {
            ok: true,
            meta: {
              isSessionMode: payload.lookbackDays === 1,
              sessionMode: payload.sessionMode,
              timezone: payload.timezone,
              dataCoveragePct: 100,
              sampleSizeSessions: payload.lookbackDays,
              notes: []
            },
            kpis: {
              moReturnRatePct: 85,
              moCrossThroughRatePct: 65,
              moMultiTouchRatePct: 40,
              timeToFirstReturn: { medianMinutes: 125, avgMinutes: 140, fastestMinutes: 5, slowestMinutes: 480 },
              maxExcursionMAE: { medianTicks: 15, avgTicks: 18, p90Ticks: 35 },
              firstMoveBias: { upFirstPct: 52, downFirstPct: 48, avgFirstPushTicks: 12, falseBreakRatePct: 15 }
            },
            tables: {
              retracementDepthDistribution: [],
              timeOfDayBreakdown: []
            },
            insights: {
              edgeSummaryBullets: ["High probability of return to midnight open", "Strong mean reversion tendency"],
              edgeConditions: [],
              stability: "High",
              outliers: "Minimal"
            },
            pro: { isProUser: true, lockedBlocks: [] },
            disclaimer: "Educational use only."
          }
        };
      }

      if (functionName === 'computeStatsFromJournal') {
        return { data: { stats: {} } };
      }
      return { data: { ok: true } };
    }
  },
  entities: new Proxy({}, {
    get: (target, entityName) => {
      return {
        filter: async () => [],
        one: async () => null,
        create: async (data) => ({ id: 'mock-id', ...data }),
        update: async (id, data) => ({ id, ...data }),
        delete: async () => true,
      };
    }
  }),
  appLogs: {
    logUserInApp: async (pageName) => {
      console.log(`Mock logging user in page: ${pageName}`);
      return { ok: true };
    }
  }
};

// Helper for robust date parsing to avoid "Invalid time value"
export const safeDate = (dateVal) => {
  if (!dateVal) return new Date();
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? new Date() : d;
};

