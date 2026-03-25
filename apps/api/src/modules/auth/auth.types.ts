export interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

export interface LoginBody {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: { id: string; username: string };
}

export type RegisterResult =
  | {
      kind: "pending";
      id: string;
      username: string;
      email: string;
    }
  | {
      kind: "session";
      id: string;
      username: string;
      email: string;
      token: string;
    };
