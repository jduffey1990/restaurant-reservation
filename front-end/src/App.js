import React, { useEffect, useState } from "react";
import { Route, Switch } from "react-router-dom";
import Layout from "./layout/Layout";
import WakeUpScreen from "./layout/WakeUpScreen";
import { pingBackend } from "./utils/api";

function App() {
  const [isAwake, setIsAwake] = useState(false);

  useEffect(() => {
    pingBackend()
      .then(() => {
        // Signal the WakeUpScreen that the backend is ready
        if (window.__wakeUpReady) {
          window.__wakeUpReady();
        } else {
          setIsAwake(true);
        }
      })
      .catch((error) => {
        console.error("Error pinging backend:", error);
        // Still proceed even if ping fails
        if (window.__wakeUpReady) {
          window.__wakeUpReady();
        } else {
          setIsAwake(true);
        }
      });
  }, []);

  return (
    <>
      {!isAwake && <WakeUpScreen onReady={() => setIsAwake(true)} />}
      <Switch>
        <Route path="/">
          <Layout />
        </Route>
      </Switch>
    </>
  );
}

export default App;