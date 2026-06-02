import { createContext, type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import defaultProfile from "@/@shared/images/user.png";
import { fetchLogout } from "@/features/member/api/fetchMember";

export interface UserInfo {
  id: number | string;
  email: string;
  nickname: string;
  profileImage: string;
  gender?: string;
  birthdate?: string;
  phoneNumber?: string;
  memberTags?: number[];
  createAt?: string;
  isNewUser?: boolean;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo;
  login: (user: UserInfo) => void;
  logout: () => Promise<void>;
  loginSuccess: boolean;
  setLoginSuccess: (value: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);

  const [user, setUser] = useState<UserInfo>({
    id: 0,
    nickname: "",
    profileImage: defaultProfile,
    email: "",
    gender: "",
    birthdate: "",
    phoneNumber: "",
    memberTags: [],
    createAt: "",
    isNewUser: false,
  });

  const logout = async () => {
    try {
      await fetchLogout();
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error("로그아웃 오류 : ", error);
      }
    }

    setIsAuthenticated(false);
    setUser({
      id: 0,
      nickname: "",
      profileImage: defaultProfile,
      email: "",
      gender: "",
      phoneNumber: "",
      memberTags: [],
      createAt: "",
      isNewUser: false,
    });
    sessionStorage.removeItem("userInfo");
    navigate("/");
  };

  useEffect(() => {
    const savedUser = sessionStorage.getItem("userInfo");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData && userData.id) {
          setUser({ ...userData, isNewUser: userData.isNewUser || false });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("AuthContext - 사용자 정보 파싱 오류:", error);
      }
    }
  }, []);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logout();
        navigate("/");
      } catch (error) {
        console.error("로그아웃 오류 : ", error);
        navigate("/");
      }
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, [navigate]);

  const login = (userData: UserInfo) => {
    setIsAuthenticated(true);
    setUser(userData);
    sessionStorage.setItem("userInfo", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        loginSuccess,
        setLoginSuccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
