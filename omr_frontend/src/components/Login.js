import React, { useState } from "react";
import { Button, Input, Card, message } from "antd";
import axios from "axios";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // For loading indicator

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please enter username and password!");
      return;
    }

    try {
      setLoading(true); // Start loading
      const response = await axios.post(
        "https://api.aramiasacademy.com/admin/login",
        {
          email: username, // Map username to email
          password: password,
        }
      );

      // Check if login is successful
      if (response.status === 200) {
        message.success("Login successful!");
        onLogin(); // Call the onLogin function if provided
      }
    } catch (error) {
      console.error("Login failed:", error);
      message.error("Login failed. Please check your credentials.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        margin: "230px auto",
      }}
    >
      <Card
        style={{
          width: "30vw",
          border: "1px solid rgba(5, 5, 5, 0.06)",
          paddingBottom: "20px",
        }}
        bordered={false}
      >
        <h2>Login</h2>
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ marginBottom: 10, marginTop: 20 }}
        />
        <Input.Password
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: 10, marginTop: 20 }}
        />
        <Button
          style={{ marginBottom: 10, marginTop: 20 }}
          type="primary"
          onClick={handleLogin}
          loading={loading} // Show loading spinner while logging in
          block
        >
          Login
        </Button>
      </Card>
    </div>
  );
};

export default Login;
