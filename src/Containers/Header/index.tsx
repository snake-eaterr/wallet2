import React, { useContext } from "react";
import Logo from "../../Assets/Images/logo.png";
import Menu from "../../Assets/Icons/menu.svg";
import { HeaderProps } from "./types";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { Ctx } from "../../Context";

import SWText from "../../Assets/Icons/sw_text.png";

export const Header: React.FC<HeaderProps> = (): JSX.Element => {
  const navigate: NavigateFunction = useNavigate()
  const state = useContext(Ctx)

  const isNopeUp: boolean = window.location.pathname === "/";
  const isLoader: boolean = window.location.pathname === "/loader";
  const isscan: boolean = window.location.pathname === "/scan";
  const isreceive: boolean = window.location.pathname === "/receive";

  return (
    <header className="Header">
      {(isNopeUp || isLoader) ? (
        <React.Fragment>
          <button className="Header__logo_1" onClick={() => navigate("/")}>
            <img src={Logo} width="70px" alt="" />
          </button>
          <button className="Header__menu" onClick={() => navigate("#")}>
            <img src={Menu} width="40px" alt="" />
          </button>
          <div className="Header_text">
            <img src={SWText} width="330px" alt="" />
          </div>
        </React.Fragment>
      ) : (
        isscan ? (
          <></>
        ) : (
          isreceive ? (
            <React.Fragment>
              <button className="Header__logo_2" onClick={() => navigate("/")}>
                <img src={Logo} width="30px" alt="" />
              </button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button className="Header__logo_2" onClick={() => navigate("/")}>
                <img src={Logo} width="30px" alt="" />
              </button>
              <button className="Header__menu" onClick={() => navigate("#")}>
                <img src={Menu} width="40px" alt="" />
              </button>
            </React.Fragment>
          )
        )
      )}
    </header>
  )
}