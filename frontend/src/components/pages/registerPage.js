import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

const PRIMARY_COLOR = "#cc5c99";
const SECONDARY_COLOR = "#0c0c1f";
const url = `${process.env.REACT_APP_BACKEND_SERVER_URI}/user/signup`;

const Register = () => {
  const [data, setData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [light, setLight] = useState(false);
  const [bgColor, setBgColor] = useState(SECONDARY_COLOR);
  const [bgText, setBgText] = useState("Light Mode");

  const handleChange = ({ currentTarget: input }) => {
    setData({ ...data, [input.name]: input.value });
  };

  useEffect(() => {
    if (light) {
      setBgColor("white");
      setBgText("Dark mode");
    } else {
      setBgColor(SECONDARY_COLOR);
      setBgText("Light mode");
    }
  }, [light]);

  let labelStyling = {
    color: PRIMARY_COLOR,
    fontWeight: "bold",
    textDecoration: "none",
  };

  let buttonStyling = {
    background: PRIMARY_COLOR,
    borderStyle: "none",
    color: bgColor,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: res } = await axios.post(url, data);
      const { accessToken } = res;

      window.alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (error) {
      if (
        error.response &&
        error.response.status >= 400 &&
        error.response.status <= 500
      ) {
        setError(error.response.data.message);
      }
    }
  };

  return (
    <section className="vh-100" style={{ background: bgColor }}>
      <div className="container h-100 d-flex justify-content-center align-items-center">
        <div
          className="card p-4 shadow-lg"
          style={{
            width: "100%",
            maxWidth: "420px",
            background: light ? "white" : "#1a1a1a",
            border: "1px solid #333",
          }}
        >
          <h2 className="text-center mb-2" style={{ color: PRIMARY_COLOR }}>
            Create Account
          </h2>
          <p className="text-center text-muted mb-4">
            Join the community
          </p>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label style={labelStyling}>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                onChange={handleChange}
                placeholder="Enter username"
                className="rounded-3 bg-dark text-white border-secondary"
                style={light ? { background: "#f0f0f0", color: "black" } : {}}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={labelStyling}>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                onChange={handleChange}
                placeholder="Enter email"
                className="rounded-3 bg-dark text-white border-secondary"
                style={light ? { background: "#f0f0f0", color: "black" } : {}}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={labelStyling}>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                onChange={handleChange}
                placeholder="Password"
                className="rounded-3 bg-dark text-white border-secondary"
                style={light ? { background: "#f0f0f0", color: "black" } : {}}
              />
            </Form.Group>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="flexSwitchCheckDefault"
                onChange={() => setLight(!light)}
              />
              <label
                className="form-check-label text-muted"
                htmlFor="flexSwitchCheckDefault"
              >
                {bgText}
              </label>
            </div>

            {error && (
              <div className="pt-2" style={{ color: PRIMARY_COLOR }}>
                {error}
              </div>
            )}

            <Button
              variant="primary"
              type="submit"
              style={buttonStyling}
              className="w-100 rounded-3 mt-2"
            >
              Register
            </Button>
          </Form>

          <div className="text-center mt-3">
            <span className="text-muted">Already have an account?</span>
            <span
              className="ms-1"
              style={{ color: PRIMARY_COLOR, cursor: "pointer" }}
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;