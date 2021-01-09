import { useState } from "react";

const getJwt = async () => {
  const tokenRes = await fetch("http://localhost:4000/getJwt", {
    credentials: "include",
  });
  if (tokenRes.ok) {
    const { jwt } = await tokenRes.json();
    return jwt;
  }
};

const App = () => {
  const [jwt, setJwt] = useState(null);
  const [protectedRouteResult, setProtectedRouteResult] = useState(
    "not attempted yet"
  );

  const onLoadJwtViaRefreshToken = async () => {
    const newAccessToken = await getJwt();
    setJwt(newAccessToken);
  };

  const removeJwt = () => {
    setJwt(null);
  };

  const hitProtectedRoute = async () => {
    setProtectedRouteResult("attempting...");
    const res = await fetch("http://localhost:4000/protectedRoute", {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    setProtectedRouteResult(res.status);
  };

  return (
    <>
      <div>
        <a href="http://localhost:4000/auth/google">
          <button>Login pt 1 - load refresh token</button>
        </a>
        <button onClick={onLoadJwtViaRefreshToken}>
          Login pt 2 - load JWT via refresh
        </button>
      </div>
      <div>
        <button onClick={removeJwt}>Logout pt 1 - remove JWT</button>
        <a href="http://localhost:4000/auth/google/logout">
          <button>Logout pt 2 - remove refresh token</button>
        </a>
      </div>
      <div>Logged in (has JWT): {jwt ? "true" : "false"}</div>
      <div>
        <button onClick={hitProtectedRoute}>Hit JWT-protected route</button>
        Status: {protectedRouteResult}
      </div>
    </>
  );
};

export default App;
