export interface IAdmin {
  fullName: string;
  // username: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}

export enum Role {
  USER,
  ADMIN,

}
