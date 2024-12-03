import React from "react";
import { Menu, Dropdown, Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";

const NavBar = ({ onLogout }) => {
  const menu = (
    <Menu>
      <Menu.Item key="1" icon={<LogoutOutlined />} onClick={onLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <div
      style={{
        background: "#EEEEEE",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <p>Aram IAS Academy</p>
      <Dropdown overlay={menu} placement="bottomRight">
        <Button type="text">Profile</Button>
      </Dropdown>
    </div>
  );
};

export default NavBar;
