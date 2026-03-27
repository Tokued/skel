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
import WatchlistPage from "./components/pages/watchlistPage";
import Reviews from "./components/pages/Reviews"; // <-- Add this
import getUserInfo from "./utilities/decodeJwt";
import MoviePage from "./components/pages/moviePage";

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
          <Route exact path="/watchlist" element={<WatchlistPage />} />
          <Route path="/movies/:id" element={<MoviePage />} />

          {/* Reviews page route */}
          <Route exact path="/reviews" element={<Reviews />} />
        </Routes>
      </UserContext.Provider>
    </>
  );
};

export default App;