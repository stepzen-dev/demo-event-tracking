import { createContext, useCallback, useEffect, useState } from "react";
import ReactGA from "react-ga";

import AnalyticsListener from "../components/AnalyticsListener";

const analyticsContext = createContext();

const generateQuery = (now, path, type, userId) =>
  `
mutation MyMutation {
  amplitude_event(
    eventTime: ${now}
    eventType: ${type}
    path: ${path}
    userId: "${userId}"
  ) {
    code
    events_ingested
    payload_size_bytes
    server_upload_time
  }
}`.trim();

const {
  REACT_APP_ANALYTICS_STEPZEN_API_URL,
  REACT_APP_ANALYTICS_STEPZEN_API_KEY,
  REACT_APP_REACTGA_ID,
} = process.env;

const AnalyticsProvider = (props) => {
  const [userId, setUserID] = useState(null);
  
  useEffect(() => {
    ReactGA.initialize(`${REACT_APP_REACTGA_ID}`);
    ReactGA.pageview('/');
    ReactGA.ga((tracker) => {
      setUserID(tracker.get("clientId"));
    });
  }, []);

  // Event handler utilizing useCallback ...
  // ... so that reference never changes.
  const handler = useCallback(async (event) => {
    const now = JSON.stringify(new Date().toLocaleString());
    const type = JSON.stringify(event.type);

    const path = event.path[0].className
      ? JSON.stringify(event.path[0].className)
      : `${JSON.stringify(event.path[0].outerHTML)}`;

    const amplitudeEvent = generateQuery(now, path, type, userId);

    await fetch(REACT_APP_ANALYTICS_STEPZEN_API_URL, {
      body: JSON.stringify({ query: amplitudeEvent }),
      headers: {
        Authorization: `Apikey ${REACT_APP_ANALYTICS_STEPZEN_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }).then((response) => {
      console.log(response);
      response.json().then((data) => {
        console.log("the response", data);
      });
    });
  });

  // Add event listener using our hook
  AnalyticsListener("click", handler);

  const state = {
    userId: userId,
  };

  return (
    <analyticsContext.Provider value={state}>
      {props.children}
    </analyticsContext.Provider>
  );
};

export { analyticsContext, AnalyticsProvider };
