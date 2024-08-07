import React, {useEffect} from "react";

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";
import { useIonRouter, isPlatform } from "@ionic/react";

export const Footer = () => {
  const router = useIonRouter();

  const ishome: boolean = router.routeInfo.pathname === "/home";
  const receive: boolean = router.routeInfo.pathname === "/receive";

  useEffect(() => {
    if (isPlatform('android') || isPlatform('ios')) {
      setTimeout(() => {
        var footer = document.querySelector('.Footer') as HTMLElement;
        var viewportHeight = window.innerHeight;
        if (footer) {
          footer.style.top = viewportHeight - (footer.clientHeight ?? 0) + 'px';
        }
      }, 150)
    }
  }, [isPlatform('android'), isPlatform('ios')]);

  useEffect(() => {
    // Create a new resize event
    const resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);
  }, []);

  const handleResize = () => {
    var footer = document.querySelector('.Footer') as HTMLElement;
    var viewportHeight = window.innerHeight;
    if (footer) {
      footer.style.top = viewportHeight - (footer.clientHeight ?? 0) + 'px';
    }
  };

  useEffect(() => {
    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div>
      {(ishome) ? (
        <React.Fragment>
          <footer className="Footer">
            <div className="Footer_receive_btn">
              <button onClick={() => { router.push("/receive") }}>Receive</button>
            </div>
            <div className="Footer_send_btn">
              <button onClick={() => { router.push("/send") }}>Send</button>
            </div>
            <div className="Footer_QR" onClick={() => { router.push("/scan") }}>
              {Icons.QR()}
            </div>
          </footer>
        </React.Fragment>
      ) : (
        receive ? (
          <React.Fragment>
            <footer className="Footer">
              <div className="Footer_receive_btn">
                <button onClick={() => { router.push("/home") }}>Cancel</button>
              </div>
              <div className="Footer_send_btn">
                <button onClick={() => { router.push("/home") }}>OK</button>
              </div>
              <div className="Footer_QR" onClick={() => { router.push("/scan") }}>
                {Icons.QR()}
              </div>
            </footer>
          </React.Fragment>
        ) : (
          <></>
        )
      )}
    </div>
  )
}