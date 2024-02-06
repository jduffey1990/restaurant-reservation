import React, {useEffect } from "react";
import { Route, Switch } from "react-router-dom";
import Layout from "./layout/Layout";

import { pingBackend } from "./utils/api";

/**
 * Defines the root application component.
 * @returns {JSX.Element}
 */
function App() {
  useEffect(() => {
    // Call the function to ping the backend
    pingBackend()
      .then(() => console.log("Backend pinged successfully"))
      .catch((error) => console.error("Error pinging backend:", error));
  }, []);

  return (
    <Switch>
      <Route path="/">
        <Layout />
      </Route>
    </Switch>
  );
}

export default App;
