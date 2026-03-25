import React, { createContext, useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import './css/card.css';
import './index.css';

// Components
import Navbar from "./components/navbar";
import LandingPage from "./components/pages/landingPage";
import HomePage from "./components/pages/homePage";
import Login from "./components/pages/loginPage";
import Signup from "./components/pages/registerPage";
import PrivateUserProfile from "./components/pages/privateUserProfilePage";
import MbtaAlertsPage from "./components/pages/mbtaAlerts";
import MbtaLinesPage from "./components/pages/mbtaLines";
import Reviews from "./components/pages/Reviews"; // <-- fixed import path

import getUserInfo from "./utilities/decodeJwt";

export const UserContext = createContext();

const App = () => {
  const [user, setUser] = useState();

  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  return (
    <>
      <Navbar />
      <UserContext.Provider value={user}>
        <Routes>
          <Route exact path="/" element={<LandingPage />} />
          <Route exact path="/home" element={<HomePage />} />
          <Route exact path="/login" element={<Login />} />
          <Route exact path="/signup" element={<Signup />} />
          <Route path="/privateUserProfile" element={<PrivateUserProfile />} />
          <Route exact path="/mbtaAlerts" element={<MbtaAlertsPage />} />
          <Route exact path="/mbtaLines" element={<MbtaLinesPage />} />

          {/* Reviews page route */}
          <Route exact path="/reviews" element={<Reviews />} />
        </Routes>
      </UserContext.Provider>
    </>
  );
};

export default App;